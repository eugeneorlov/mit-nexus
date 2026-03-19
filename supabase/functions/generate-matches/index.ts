import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    }

    // Service role client to bypass RLS for queue operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // ── Step 4B: Clean up stale queue entries (older than 7 days) ────────────
    await supabaseAdmin
      .from('match_queue')
      .delete()
      .eq('matched', false)
      .lt('entered_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // ── Step 1: Validate and extract user ────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: corsHeaders,
        status: 401,
      });
    }

    // Use a user-scoped client to validate the JWT
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: corsHeaders,
        status: 401,
      });
    }

    const userId = user.id;

    // ── Step 2a: Check eligibility — onboarded and opted in ──────────────────
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('roulette_opt_in, onboarded')
      .eq('id', userId)
      .single();

    if (!profile?.onboarded || !profile?.roulette_opt_in) {
      return new Response(
        JSON.stringify({
          error: 'NOT_ELIGIBLE',
          message: 'You must be onboarded and opted in to Coffee Roulette.',
        }),
        { headers: corsHeaders, status: 200 },
      );
    }

    // ── Step 2b: Check active match count ────────────────────────────────────
    const { count: activeMatchCount } = await supabaseAdmin
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .in('status', ['pending', 'active']);

    if (activeMatchCount !== null && activeMatchCount >= 2) {
      return new Response(
        JSON.stringify({
          error: 'MAX_MATCHES',
          message: 'Complete or skip a current match before finding a new one.',
        }),
        { headers: corsHeaders, status: 200 },
      );
    }

    // ── Step 2c: Check if already in queue ───────────────────────────────────
    const { data: existingQueueEntry } = await supabaseAdmin
      .from('match_queue')
      .select('id')
      .eq('user_id', userId)
      .eq('matched', false)
      .maybeSingle();

    if (existingQueueEntry) {
      return new Response(
        JSON.stringify({
          error: 'ALREADY_QUEUED',
          message: 'You are already waiting for a match.',
        }),
        { headers: corsHeaders, status: 200 },
      );
    }

    // ── Step 3: Look for candidates in the queue ──────────────────────────────
    const { data: queueEntries } = await supabaseAdmin
      .from('match_queue')
      .select('user_id, entered_at')
      .eq('matched', false)
      .neq('user_id', userId)
      .order('entered_at', { ascending: true });

    if (!queueEntries || queueEntries.length === 0) {
      // Nobody waiting — add current user to queue
      const { error: queueError } = await supabaseAdmin
        .from('match_queue')
        .insert({ user_id: userId });

      if (queueError?.code === '23505') {
        return new Response(
          JSON.stringify({
            error: 'ALREADY_QUEUED',
            message: 'You are already waiting for a match.',
          }),
          { headers: corsHeaders, status: 200 },
        );
      }

      return new Response(
        JSON.stringify({
          status: 'QUEUED',
          message: 'You are in the queue. We will match you when someone else joins.',
        }),
        { headers: corsHeaders, status: 200 },
      );
    }

    // ── Step 4: Filter queue candidates ──────────────────────────────────────
    const candidateIds = queueEntries.map((e: { user_id: string }) => e.user_id);

    // Batch fetch active matches for all candidates
    const { data: candidateMatches } = await supabaseAdmin
      .from('matches')
      .select('user_a_id, user_b_id, status')
      .or(candidateIds.map((id: string) => `user_a_id.eq.${id},user_b_id.eq.${id}`).join(','))
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

    // Keep only candidates with < 2 active matches
    const eligibleCandidates = candidateIds.filter(
      (id: string) => (activeCountMap[id] || 0) < 2,
    );

    if (eligibleCandidates.length === 0) {
      // All queue candidates are at capacity — add current user to queue
      const { error: queueError } = await supabaseAdmin
        .from('match_queue')
        .insert({ user_id: userId });

      if (queueError?.code === '23505') {
        return new Response(
          JSON.stringify({
            error: 'ALREADY_QUEUED',
            message: 'You are already waiting for a match.',
          }),
          { headers: corsHeaders, status: 200 },
        );
      }

      return new Response(
        JSON.stringify({
          status: 'QUEUED',
          message: 'You are in the queue. We will match you when someone else joins.',
        }),
        { headers: corsHeaders, status: 200 },
      );
    }

    // ── Step 5: Score candidates and pick the best ────────────────────────────

    // Fetch tags for current user
    const { data: userTags } = await supabaseAdmin
      .from('tags')
      .select('category, label')
      .eq('user_id', userId);

    const userHelpTags = (userTags || [])
      .filter((t: { category: string; label: string }) => t.category === 'help')
      .map((t: { category: string; label: string }) => t.label);
    const userLearnTags = (userTags || [])
      .filter((t: { category: string; label: string }) => t.category === 'learn')
      .map((t: { category: string; label: string }) => t.label);

    // Fetch tags for all eligible candidates in one query
    const { data: candidateTags } = await supabaseAdmin
      .from('tags')
      .select('user_id, category, label')
      .in('user_id', eligibleCandidates);

    // Fetch past matches between current user and candidates
    const { data: pastMatches } = await supabaseAdmin
      .from('matches')
      .select('user_a_id, user_b_id, created_at')
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .in('status', ['completed', 'skipped']);

    // Score each eligible candidate
    const scores: { candidateId: string; score: number; sharedTags: string[] }[] = [];

    for (const candidateId of eligibleCandidates) {
      const cTags = (candidateTags || []).filter(
        (t: { user_id: string; category: string; label: string }) => t.user_id === candidateId,
      );
      const cHelpTags = cTags
        .filter((t: { category: string }) => t.category === 'help')
        .map((t: { label: string }) => t.label);
      const cLearnTags = cTags
        .filter((t: { category: string }) => t.category === 'learn')
        .map((t: { label: string }) => t.label);

      // Tag overlap: A's help ↔ B's learn + B's help ↔ A's learn
      const aHelpBLearn = userHelpTags.filter((t: string) => cLearnTags.includes(t));
      const bHelpALearn = cHelpTags.filter((t: string) => userLearnTags.includes(t));
      const sharedTags = [...new Set([...aHelpBLearn, ...bHelpALearn])];
      const tagScore = sharedTags.length * 2.0;

      // Novelty: never matched = 1.5, matched before = 0
      const wasMatched = (pastMatches || []).some(
        (m: { user_a_id: string; user_b_id: string }) =>
          m.user_a_id === candidateId || m.user_b_id === candidateId,
      );
      const noveltyScore = wasMatched ? 0 : 1.5;

      scores.push({ candidateId, score: tagScore + noveltyScore, sharedTags });
    }

    // Sort by score descending; break ties by queue entry time (earlier = priority)
    scores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aEntry =
        queueEntries.find((e: { user_id: string }) => e.user_id === a.candidateId)?.entered_at ||
        '';
      const bEntry =
        queueEntries.find((e: { user_id: string }) => e.user_id === b.candidateId)?.entered_at ||
        '';
      return aEntry.localeCompare(bEntry);
    });

    const bestMatch = scores[0];

    // ── Step 6: Create the match and clean up the queue ───────────────────────
    const { data: match, error: matchError } = await supabaseAdmin
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
      return new Response(
        JSON.stringify({ error: 'MATCH_FAILED', message: matchError.message }),
        { headers: corsHeaders, status: 500 },
      );
    }

    // Mark the matched candidate's queue entry as matched
    await supabaseAdmin
      .from('match_queue')
      .update({ matched: true })
      .eq('user_id', bestMatch.candidateId)
      .eq('matched', false);

    return new Response(
      JSON.stringify({
        status: 'MATCHED',
        match,
        shared_tags: bestMatch.sharedTags,
        score: bestMatch.score,
      }),
      { headers: corsHeaders, status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});
