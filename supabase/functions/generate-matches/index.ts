import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileRow {
  id: string;
  timezone: string | null;
}

interface TagRow {
  user_id: string;
  category: 'help' | 'learn';
  label: string;
}

interface PastMatchRow {
  user_a_id: string;
  user_b_id: string;
  week_number: number;
  year: number;
}

interface ProfileWithTags extends ProfileRow {
  helpTags: string[];
  learnTags: string[];
  timezoneOffsetHours: number;
}

interface ScoredPair {
  aId: string;
  bId: string;
  score: number;
  sharedTags: string[];
}

interface NewMatch {
  user_a_id: string;
  user_b_id: string;
  week_number: number;
  year: number;
  status: 'pending';
  shared_tags: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns ISO week number and year for a given date.
 * ISO week 1 is the week containing the first Thursday of the year.
 */
function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Mon=1..Sun=7)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

/**
 * Returns the UTC offset in hours for an IANA timezone name (e.g. "America/New_York").
 * Falls back to 0 if the timezone is unknown or null.
 */
function getTimezoneOffsetHours(timezone: string | null): number {
  if (!timezone) return 0;
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === 'timeZoneName');
    if (!offsetPart) return 0;
    // e.g. "GMT+5:30", "GMT-8", "GMT"
    const match = offsetPart.value.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (!match) return 0;
    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3] ?? '0', 10);
    return sign * (hours + minutes / 60);
  } catch {
    return 0;
  }
}

/**
 * Returns approximate weeks between two (week, year) pairs.
 * Assumes 52 weeks/year; accurate enough for the > 4 weeks novelty check.
 */
function weeksDiff(
  week: number,
  year: number,
  currentWeek: number,
  currentYear: number,
): number {
  return (currentYear - year) * 52 + (currentWeek - week);
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    }

    // Use service_role to bypass RLS
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const now = new Date();
    const { week: currentWeek, year: currentYear } = getISOWeek(now);

    // ── 1. Check for existing matches this week ──────────────────────────────
    const { data: existingMatches, error: existingError } = await supabase
      .from('matches')
      .select('id')
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .limit(1);

    if (existingError) throw existingError;

    if (existingMatches && existingMatches.length > 0) {
      return new Response(
        JSON.stringify({
          message: `Matches already generated for week ${currentWeek} of ${currentYear}`,
          matches_created: 0,
          week_number: currentWeek,
          year: currentYear,
        }),
        { headers: corsHeaders, status: 200 },
      );
    }

    // ── 2. Fetch opted-in, onboarded profiles ────────────────────────────────
    const { data: profileRows, error: profilesError } = await supabase
      .from('profiles')
      .select('id, timezone')
      .eq('roulette_opt_in', true)
      .eq('onboarded', true);

    if (profilesError) throw profilesError;

    const profiles = (profileRows ?? []) as ProfileRow[];

    if (profiles.length < 2) {
      return new Response(
        JSON.stringify({
          message: 'Not enough opted-in users to create matches',
          matches_created: 0,
          opted_in_users: profiles.length,
          unmatched: profiles.length,
          week_number: currentWeek,
          year: currentYear,
        }),
        { headers: corsHeaders, status: 200 },
      );
    }

    const profileIds = profiles.map((p) => p.id);

    // ── 3. Fetch tags for those users ────────────────────────────────────────
    const { data: tagRows, error: tagsError } = await supabase
      .from('tags')
      .select('user_id, category, label')
      .in('user_id', profileIds);

    if (tagsError) throw tagsError;

    const tags = (tagRows ?? []) as TagRow[];

    // ── 4. Fetch past matches (all time) between opted-in users ──────────────
    const { data: pastMatchRows, error: pastMatchesError } = await supabase
      .from('matches')
      .select('user_a_id, user_b_id, week_number, year')
      .or(
        `user_a_id.in.(${profileIds.join(',')}),user_b_id.in.(${profileIds.join(',')})`,
      );

    if (pastMatchesError) throw pastMatchesError;

    const pastMatches = (pastMatchRows ?? []) as PastMatchRow[];

    // ── 5. Build in-memory structures ────────────────────────────────────────

    // Profile map: id → ProfileWithTags
    const profileMap = new Map<string, ProfileWithTags>();
    for (const p of profiles) {
      profileMap.set(p.id, {
        ...p,
        helpTags: [],
        learnTags: [],
        timezoneOffsetHours: getTimezoneOffsetHours(p.timezone),
      });
    }

    // Populate tags
    for (const tag of tags) {
      const profile = profileMap.get(tag.user_id);
      if (!profile) continue;
      if (tag.category === 'help') {
        profile.helpTags.push(tag.label);
      } else {
        profile.learnTags.push(tag.label);
      }
    }

    // Past match map: sorted "idA:idB" → [{week_number, year}, ...]
    const pastMatchMap = new Map<string, Array<{ week_number: number; year: number }>>();
    for (const m of pastMatches) {
      const key = [m.user_a_id, m.user_b_id].sort().join(':');
      if (!pastMatchMap.has(key)) pastMatchMap.set(key, []);
      pastMatchMap.get(key)!.push({ week_number: m.week_number, year: m.year });
    }

    // ── 6. Score every pair ──────────────────────────────────────────────────
    const profileList = Array.from(profileMap.values());
    const scoredPairs: ScoredPair[] = [];

    for (let i = 0; i < profileList.length; i++) {
      for (let j = i + 1; j < profileList.length; j++) {
        const a = profileList[i];
        const b = profileList[j];

        // Tag overlap: A.helpTags ∩ B.learnTags  +  B.helpTags ∩ A.learnTags
        const aHelpsB = a.helpTags.filter((t) => b.learnTags.includes(t));
        const bHelpsA = b.helpTags.filter((t) => a.learnTags.includes(t));
        const tagOverlap = aHelpsB.length + bHelpsA.length;
        // Deduplicated list for display (why you matched)
        const sharedTags = [...new Set([...aHelpsB, ...bHelpsA])];

        // Timezone penalty: 0 = same tz, 1 = 12 h apart
        const tzDiff = Math.abs(a.timezoneOffsetHours - b.timezoneOffsetHours);
        const timezonePenalty = Math.min(tzDiff / 12, 1.0);

        // Novelty based on past match history
        const key = [a.id, b.id].sort().join(':');
        const history = pastMatchMap.get(key) ?? [];
        let novelty: number;
        if (history.length === 0) {
          novelty = 1.0;
        } else if (history.length === 1) {
          const diff = weeksDiff(history[0].week_number, history[0].year, currentWeek, currentYear);
          novelty = diff > 4 ? 0.3 : 0.0;
        } else {
          novelty = 0.0;
        }

        const score = tagOverlap * 2.0 + (1.0 - timezonePenalty) + novelty;

        scoredPairs.push({ aId: a.id, bId: b.id, score, sharedTags });
      }
    }

    // Sort descending by score
    scoredPairs.sort((x, y) => y.score - x.score);

    // ── 7. Greedy assignment ─────────────────────────────────────────────────
    const matched = new Set<string>();
    const newMatches: NewMatch[] = [];

    for (const pair of scoredPairs) {
      if (matched.has(pair.aId) || matched.has(pair.bId)) continue;
      matched.add(pair.aId);
      matched.add(pair.bId);
      newMatches.push({
        user_a_id: pair.aId,
        user_b_id: pair.bId,
        week_number: currentWeek,
        year: currentYear,
        status: 'pending',
        shared_tags: pair.sharedTags,
      });
    }

    // ── 8. Persist matches ───────────────────────────────────────────────────
    if (newMatches.length > 0) {
      const { error: insertError } = await supabase.from('matches').insert(newMatches);
      if (insertError) throw insertError;
    }

    const unmatched = profileList.length - matched.size;

    return new Response(
      JSON.stringify({
        matches_created: newMatches.length,
        opted_in_users: profileList.length,
        unmatched,
        week_number: currentWeek,
        year: currentYear,
      }),
      { headers: corsHeaders, status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: corsHeaders, status: 500 },
    );
  }
});
