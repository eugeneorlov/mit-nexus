# Coffee Roulette — On-Demand Rework (Claude Code Task)

**Scope:** Replace the weekly batch matching system with an on-demand queue-based model
**Estimated time:** 3–4 hours
**Prerequisites:** Existing roulette system working (Edge Function + UI components)
**Depends on:** Nothing — can run independently of the redesign task

---

## Context for Claude Code

```
I'm reworking the Coffee Roulette feature in MIT Nexus, a cohort networking app.

Stack: React 18 + Vite + TypeScript + Tailwind + shadcn/ui + Supabase + Leaflet
Deployed at: mit-nexus.vercel.app

The current system runs a weekly batch matching algorithm via a Supabase Edge Function.
I'm replacing it with an on-demand queue model where users click "Match me" and either
get paired instantly (if someone is waiting) or enter a queue.

Key constraint: max 2 active matches per user at any time.
Scoring algorithm (tag overlap + novelty) is preserved.

Reference: this file for all implementation details.
```

---

## Part 1: Schema Changes

### 1A: New `match_queue` table

Create a new migration file `supabase/migrations/003_roulette_on_demand.sql`:

```sql
-- Queue for users waiting for a match
CREATE TABLE match_queue (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    entered_at  TIMESTAMPTZ DEFAULT NOW(),
    matched     BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id)  -- a user can only be in the queue once
);

-- Index for finding unmatched queue entries quickly
CREATE INDEX idx_match_queue_active ON match_queue(matched, entered_at ASC)
    WHERE matched = FALSE;

-- RLS policies
ALTER TABLE match_queue ENABLE ROW LEVEL SECURITY;

-- Users can see their own queue status
CREATE POLICY "Users can view own queue entry"
    ON match_queue FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert themselves into the queue
CREATE POLICY "Users can join queue"
    ON match_queue FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can remove themselves from the queue
CREATE POLICY "Users can leave queue"
    ON match_queue FOR DELETE
    USING (auth.uid() = user_id);

-- Service role can do anything (for the Edge Function)
CREATE POLICY "Service role full access on match_queue"
    ON match_queue
    USING (auth.role() = 'service_role');
```

### 1B: Modify `matches` table

```sql
-- Add 'active' status option
ALTER TABLE matches
    DROP CONSTRAINT IF EXISTS matches_status_check;

ALTER TABLE matches
    ADD CONSTRAINT matches_status_check
    CHECK (status IN ('pending', 'active', 'completed', 'skipped'));

-- week_number and year columns remain but become nullable / unused
-- Don't drop them — existing data references them
-- New matches will have NULL for week_number and year
ALTER TABLE matches ALTER COLUMN week_number DROP NOT NULL;
ALTER TABLE matches ALTER COLUMN year DROP NOT NULL;
```

### 1C: Update types

In `src/lib/types.ts`, add:

```typescript
export interface MatchQueueEntry {
    id: string;
    user_id: string;
    entered_at: string;
    matched: boolean;
}

// Update Match type to make week_number and year optional
export interface Match {
    id: string;
    user_a_id: string;
    user_b_id: string;
    week_number?: number | null;  // legacy, nullable for on-demand matches
    year?: number | null;         // legacy, nullable for on-demand matches
    status: 'pending' | 'active' | 'completed' | 'skipped';
    shared_tags: string[] | null;
    created_at: string;
}
```

---

## Part 2: Edge Function Rewrite

Replace `supabase/functions/generate-matches/index.ts` with a new on-demand matching function.

**Trigger:** HTTP POST from the frontend (user clicks "Match me")
**Auth:** Requires a valid Supabase JWT (the user's session token)

### Function logic (step by step):

```
POST /functions/v1/generate-matches
Authorization: Bearer <user_jwt>
Body: {} (no payload needed — user ID comes from the JWT)
```

**Step 1: Validate and extract user**

```typescript
// Get the authenticated user from the JWT
const authHeader = req.headers.get('Authorization');
const { data: { user }, error } = await supabaseClient.auth.getUser(
    authHeader?.replace('Bearer ', '')
);
if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
const userId = user.id;
```

**Step 2: Check eligibility**

```typescript
// 2a. Is the user opted in and onboarded?
const { data: profile } = await supabaseClient
    .from('profiles')
    .select('roulette_opt_in, onboarded')
    .eq('id', userId)
    .single();

if (!profile?.onboarded || !profile?.roulette_opt_in) {
    return new Response(JSON.stringify({
        error: 'NOT_ELIGIBLE',
        message: 'You must be onboarded and opted in to Coffee Roulette.'
    }), { status: 400 });
}

// 2b. Does the user already have 2 active matches?
const { count: activeMatchCount } = await supabaseClient
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .in('status', ['pending', 'active']);

if (activeMatchCount !== null && activeMatchCount >= 2) {
    return new Response(JSON.stringify({
        error: 'MAX_MATCHES',
        message: 'Complete or skip a current match before finding a new one.'
    }), { status: 400 });
}

// 2c. Is the user already in the queue?
const { data: existingQueueEntry } = await supabaseClient
    .from('match_queue')
    .select('id')
    .eq('user_id', userId)
    .eq('matched', false)
    .maybeSingle();

if (existingQueueEntry) {
    return new Response(JSON.stringify({
        error: 'ALREADY_QUEUED',
        message: 'You are already waiting for a match.'
    }), { status: 400 });
}
```

**Step 3: Look for a match in the queue**

```typescript
// Fetch all unmatched queue entries (excluding self, just in case)
const { data: queueEntries } = await supabaseClient
    .from('match_queue')
    .select('user_id, entered_at')
    .eq('matched', false)
    .neq('user_id', userId)
    .order('entered_at', { ascending: true });

if (!queueEntries || queueEntries.length === 0) {
    // Nobody in the queue — add the current user and return "queued"
    await supabaseClient.from('match_queue').insert({ user_id: userId });
    return new Response(JSON.stringify({
        status: 'QUEUED',
        message: 'You are in the queue. We will match you when someone else joins.'
    }), { status: 200 });
}
```

**Step 4: Filter queue candidates**

Before scoring, eliminate ineligible candidates:

```typescript
// For each candidate in the queue, check:
// a) They haven't hit 2 active matches themselves
// b) They are still opted in and onboarded (may have changed since entering queue)
const candidateIds = queueEntries.map(e => e.user_id);

// Batch fetch: active match counts per candidate
const { data: candidateMatches } = await supabaseClient
    .from('matches')
    .select('user_a_id, user_b_id, status')
    .or(candidateIds.map(id => `user_a_id.eq.${id},user_b_id.eq.${id}`).join(','))
    .in('status', ['pending', 'active']);

// Count active matches per candidate
const activeCountMap: Record<string, number> = {};
for (const m of candidateMatches || []) {
    for (const id of candidateIds) {
        if (m.user_a_id === id || m.user_b_id === id) {
            activeCountMap[id] = (activeCountMap[id] || 0) + 1;
        }
    }
}

// Filter to candidates with < 2 active matches
const eligibleCandidates = candidateIds.filter(id => (activeCountMap[id] || 0) < 2);

if (eligibleCandidates.length === 0) {
    // Everyone in the queue is at capacity — add current user to queue
    await supabaseClient.from('match_queue').insert({ user_id: userId });
    return new Response(JSON.stringify({
        status: 'QUEUED',
        message: 'You are in the queue. We will match you when someone else joins.'
    }), { status: 200 });
}
```

**Step 5: Score candidates and pick the best**

Preserve the existing scoring logic but apply it only to eligible candidates:

```typescript
// Fetch tags for current user
const { data: userTags } = await supabaseClient
    .from('tags')
    .select('category, label')
    .eq('user_id', userId);

const userHelpTags = (userTags || []).filter(t => t.category === 'help').map(t => t.label);
const userLearnTags = (userTags || []).filter(t => t.category === 'learn').map(t => t.label);

// Fetch tags for all eligible candidates in one query
const { data: candidateTags } = await supabaseClient
    .from('tags')
    .select('user_id, category, label')
    .in('user_id', eligibleCandidates);

// Fetch past matches between current user and candidates (for novelty)
const { data: pastMatches } = await supabaseClient
    .from('matches')
    .select('user_a_id, user_b_id, created_at')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .in('status', ['completed', 'skipped']);

// Score each candidate
const scores: { candidateId: string; score: number; sharedTags: string[] }[] = [];

for (const candidateId of eligibleCandidates) {
    const cTags = (candidateTags || []).filter(t => t.user_id === candidateId);
    const cHelpTags = cTags.filter(t => t.category === 'help').map(t => t.label);
    const cLearnTags = cTags.filter(t => t.category === 'learn').map(t => t.label);

    // Tag overlap: A's help ↔ B's learn + B's help ↔ A's learn
    const aHelpBLearn = userHelpTags.filter(t => cLearnTags.includes(t));
    const bHelpALearn = cHelpTags.filter(t => userLearnTags.includes(t));
    const sharedTags = [...new Set([...aHelpBLearn, ...bHelpALearn])];
    const tagScore = sharedTags.length * 2.0;

    // Novelty: never matched = 1.5, matched before = 0
    const wasMatched = (pastMatches || []).some(m =>
        (m.user_a_id === candidateId || m.user_b_id === candidateId)
    );
    const noveltyScore = wasMatched ? 0 : 1.5;

    scores.push({
        candidateId,
        score: tagScore + noveltyScore,
        sharedTags,
    });
}

// Sort by score descending, break ties by who entered the queue first
scores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aEntry = queueEntries.find(e => e.user_id === a.candidateId)?.entered_at || '';
    const bEntry = queueEntries.find(e => e.user_id === b.candidateId)?.entered_at || '';
    return aEntry.localeCompare(bEntry);  // earlier = priority
});

const bestMatch = scores[0];
```

**Step 6: Create the match and clean up the queue**

```typescript
// Insert the match
const { data: match, error: matchError } = await supabaseClient
    .from('matches')
    .insert({
        user_a_id: userId,
        user_b_id: bestMatch.candidateId,
        week_number: null,
        year: null,
        status: 'active',
        shared_tags: bestMatch.sharedTags,
    })
    .select()
    .single();

if (matchError) {
    return new Response(JSON.stringify({ error: 'MATCH_FAILED', message: matchError.message }), { status: 500 });
}

// Remove the matched candidate from the queue
await supabaseClient
    .from('match_queue')
    .update({ matched: true })
    .eq('user_id', bestMatch.candidateId)
    .eq('matched', false);

// Return success with match details
return new Response(JSON.stringify({
    status: 'MATCHED',
    match: match,
    shared_tags: bestMatch.sharedTags,
    score: bestMatch.score,
}), { status: 200 });
```

### Algorithm changes summary vs old version

| Aspect | Old (weekly batch) | New (on-demand) |
|--------|-------------------|-----------------|
| Trigger | Cron / manual, once per week | User clicks "Match me" |
| Scope | All opted-in users at once | One user vs queue |
| Pairing | Greedy over all pairs | Best match from queue |
| Timezone scoring | Weight 1.0 | **Removed** — execs handle timezones |
| Novelty scoring | Weight 0–1.0 | **Increased to 1.5**, hard bonus for never-matched |
| Tag overlap scoring | Weight 2.0 per tag | Weight 2.0 per tag (unchanged) |
| Duplicate guard | "Matches exist for ISO week" | "User has < 2 active matches" |
| Match status | Created as `pending` | Created as `active` |
| Week/year tracking | Required fields | Nullable (legacy) |

---

## Part 3: Frontend Changes

### 3A: New hook — `src/hooks/useRoulette.ts`

```typescript
interface UseRouletteReturn {
    // State
    queueStatus: 'idle' | 'queued' | 'loading';
    activeMatches: MatchWithProfile[];  // matches with partner's profile joined
    matchHistory: MatchWithProfile[];
    canMatch: boolean;                  // true if < 2 active and not in queue
    error: string | null;

    // Actions
    findMatch: () => Promise<MatchResult>;
    leaveQueue: () => Promise<void>;
    completeMatch: (matchId: string) => Promise<void>;
    skipMatch: (matchId: string) => Promise<void>;
}

type MatchResult =
    | { status: 'MATCHED'; match: Match; shared_tags: string[] }
    | { status: 'QUEUED'; message: string }
    | { status: 'ERROR'; error: string };
```

**Implementation details:**

1. **`findMatch()`** — calls the edge function via `supabase.functions.invoke('generate-matches')`. Handles three response types: MATCHED, QUEUED, or error.

2. **`leaveQueue()`** — deletes the user's entry from `match_queue`. Only works if they're currently queued and unmatched.

3. **`completeMatch(matchId)`** — updates `matches.status` to `completed` where id = matchId. Checks that the current user is one of the two parties.

4. **`skipMatch(matchId)`** — updates `matches.status` to `skipped`.

5. **`queueStatus`** — on hook mount, check `match_queue` for the user's entry. If found with `matched = false`, status is `'queued'`. Otherwise `'idle'`.

6. **`activeMatches`** — query `matches` where (user_a_id = me OR user_b_id = me) AND status IN ('pending', 'active'), joined with the partner's profile. Order by `created_at DESC`.

7. **`matchHistory`** — same query but status IN ('completed', 'skipped'). Limit 20.

8. **`canMatch`** — derived: `activeMatches.length < 2 && queueStatus !== 'queued'`

### 3B: Rework `src/components/roulette/MatchCard.tsx`

The current card shows one match (current week's). Replace with a card that handles multiple active matches and the queue state.

**States to handle:**

**State 1: No active matches, not in queue (`canMatch = true`)**
```
┌─────────────────────────────────────────┐
│  ☕ Coffee Roulette                      │
│                                          │
│  Get matched with someone whose skills   │
│  complement yours.                       │
│                                          │
│  [ Find me a match ]  (gold button)      │
│                                          │
│  0/2 match slots used                    │
└─────────────────────────────────────────┘
```

**State 2: In queue, waiting (`queueStatus = 'queued'`)**
```
┌─────────────────────────────────────────┐
│  ☕ Coffee Roulette                      │
│                                          │
│  ⏳ You're in the queue...               │
│  We'll match you when someone else       │
│  joins. Usually takes a few hours.       │
│                                          │
│  [ Leave queue ]  (outline/ghost button) │
│                                          │
│  0/2 match slots used                    │
└─────────────────────────────────────────┘
```

**State 3: Has active match(es) (`activeMatches.length >= 1`)**

Show each active match as a sub-card:

```
┌─────────────────────────────────────────┐
│  ☕ Coffee Roulette                      │
│                                          │
│  ┌─ Active Match ─────────────────────┐ │
│  │  [avatar]  Sarah Chen               │ │
│  │  CTO, Acme Corp · Singapore         │ │
│  │  Shared: AI/ML Strategy, Hiring     │ │
│  │                                     │ │
│  │  [ Send message ]  [ ✓ Done ] [ ✗ ] │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  1/2 match slots used                    │
│  [ Find another match ]                  │
└─────────────────────────────────────────┘
```

**State 4: At capacity (2 active matches)**

Same as State 3 but the "Find another match" button is replaced with:
```
│  2/2 match slots used                    │
│  Complete or skip a match to find more.  │
```

**Button behavior:**
- "Find me a match" → calls `findMatch()`, shows loading spinner on button, button disabled during request
- After success (MATCHED) → refresh active matches, show the new match
- After success (QUEUED) → switch to State 2
- "Leave queue" → calls `leaveQueue()`, switch to State 1
- "Done" (✓) → calls `completeMatch(id)`, refreshes state
- Skip (✗) → calls `skipMatch(id)`, refreshes state — use a small icon button, not a prominent action
- "Send message" → navigates to `/messages/{partnerId}`

**Client-side debounce:** After clicking "Find me a match", disable the button for 3 seconds regardless of response. This prevents double-clicks and rapid re-queuing.

### 3C: Update `src/components/roulette/MatchHistory.tsx`

Minimal changes:
- Remove week/year references from the display
- Show `created_at` formatted as "Mar 15, 2026" instead of "Week 11, 2026"
- Keep the status badge (completed = green, skipped = gray)

### 3D: `OptInToggle.tsx`

Keep as-is. The opt-in toggle still controls `roulette_opt_in` on the profile. If a user opts out while in the queue, the edge function should handle this (it checks `roulette_opt_in` in Step 2). 

**One addition:** When user toggles OFF, also remove them from the queue:

```typescript
const handleToggle = async (optIn: boolean) => {
    await supabase.from('profiles').update({ roulette_opt_in: optIn }).eq('id', userId);
    if (!optIn) {
        // Clean up queue entry if they opt out
        await supabase.from('match_queue').delete().eq('user_id', userId);
    }
};
```

### 3E: Dashboard integration (`src/pages/Dashboard.tsx`)

- Keep the `MEMBER_THRESHOLD` guard (show invite CTA until enough members)
- Replace the "current week's match" display with the new multi-state MatchCard
- Remove any references to "this week's match" or "check back Monday"

---

## Part 4: Cleanup

### 4A: Remove cron/batch references

- The edge function no longer needs to be triggered by a cron schedule. If there's a `supabase/config.toml` or any scheduled job config referencing `generate-matches`, remove the schedule. The function is now HTTP-only.
- Remove the ISO week duplicate guard from the edge function (replaced by the active match count check).

### 4B: Queue staleness

Add a cleanup query to the edge function (run at the start of each invocation):

```sql
-- Remove queue entries older than 7 days (user probably forgot)
DELETE FROM match_queue
WHERE matched = false AND entered_at < NOW() - INTERVAL '7 days';
```

This prevents ghosts in the queue — someone who clicked "Match me" a week ago and never came back.

### 4C: Edge case — user deletes account while in queue

The `ON DELETE CASCADE` on `match_queue.user_id` handles this automatically. The queue entry is deleted when the profile is deleted.

### 4D: Edge case — both users click simultaneously

Two users click "Match me" at the same time. Both find each other in the queue (which is empty). Both try to insert themselves. The `UNIQUE(user_id)` constraint on `match_queue` prevents duplicates. One insert succeeds, the other gets a conflict error. The conflicting user retries and now finds someone in the queue.

Handle the insert conflict gracefully in the edge function:

```typescript
const { error: queueError } = await supabaseClient
    .from('match_queue')
    .insert({ user_id: userId });

if (queueError?.code === '23505') {
    // Already in queue (race condition) — return ALREADY_QUEUED
    return new Response(JSON.stringify({
        error: 'ALREADY_QUEUED',
        message: 'You are already waiting for a match.'
    }), { status: 400 });
}
```

---

## Verification Checklist

### Happy path
- [ ] User clicks "Find me a match" with empty queue → enters queue, UI shows "waiting" state
- [ ] Second user clicks "Find me a match" → instantly matched with first user
- [ ] Both users see the match in their active matches
- [ ] Shared tags are correctly calculated and displayed
- [ ] "Send message" navigates to DM with partner
- [ ] "Done" marks match as completed, frees a slot
- [ ] "Skip" marks match as skipped, frees a slot
- [ ] After completing, user can click "Find me a match" again

### Limits
- [ ] User with 2 active matches cannot click "Find me a match" (button disabled)
- [ ] User already in queue cannot re-queue (server returns ALREADY_QUEUED)
- [ ] Button is disabled for 3 seconds after click (client debounce)

### Queue management
- [ ] "Leave queue" removes user from queue, returns to idle state
- [ ] Toggling opt-out removes user from queue
- [ ] Stale queue entries (7+ days) are cleaned up

### Edge cases
- [ ] User who opts out while in queue is removed
- [ ] Candidate in queue who reached 2 active matches is skipped (not matched)
- [ ] Simultaneous clicks don't create duplicate matches or queue entries
- [ ] Never-matched pairs are scored higher than previously matched pairs

### Display
- [ ] No references to "this week" or "week N" anywhere in roulette UI
- [ ] Match history shows dates, not week numbers
- [ ] Slot counter shows "N/2 match slots used"
- [ ] Loading state on button during edge function call

---

*Spec created: 2026-03-19*
*Replaces: Weekly batch matching system*
*Key change: Cron → on-demand queue with max 2 active matches*
