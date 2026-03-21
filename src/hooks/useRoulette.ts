import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import type { Match, MatchWithProfile, Profile } from '@/lib/types';

type MatchResult =
    | { status: 'MATCHED'; match: Match; shared_tags: string[] }
    | { status: 'QUEUED'; message: string }
    | { status: 'ERROR'; error: string };

interface UseRouletteReturn {
    queueStatus: 'idle' | 'queued' | 'loading';
    activeMatches: MatchWithProfile[];
    matchHistory: MatchWithProfile[];
    canMatch: boolean;
    error: string | null;
    lastMatchedAt: number | null;
    findMatch: () => Promise<MatchResult>;
    leaveQueue: () => Promise<void>;
    completeMatch: (matchId: string) => Promise<void>;
    skipMatch: (matchId: string) => Promise<void>;
}

async function fetchMatchesWithPartner(
    userId: string,
    statuses: string[]
): Promise<MatchWithProfile[]> {
    const { data: matches } = await supabase
        .from('matches')
        .select('*, user_a:profiles!matches_user_a_id_fkey(*), user_b:profiles!matches_user_b_id_fkey(*)')
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
        .in('status', statuses)
        .order('created_at', { ascending: false });

    if (!matches) return [];

    return matches.map((m: Match & { user_a: Profile; user_b: Profile }) => ({
        ...m,
        partner: m.user_a_id === userId ? m.user_b : m.user_a,
    }));
}

export function useRoulette(): UseRouletteReturn {
    const { user } = useAuth();
    const [queueStatus, setQueueStatus] = useState<'idle' | 'queued' | 'loading'>('loading');
    const [activeMatches, setActiveMatches] = useState<MatchWithProfile[]>([]);
    const [matchHistory, setMatchHistory] = useState<MatchWithProfile[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [lastMatchedAt, setLastMatchedAt] = useState<number | null>(null);

    const refresh = useCallback(async () => {
        if (!user) return;

        const [active, history, queueEntry] = await Promise.all([
            fetchMatchesWithPartner(user.id, ['pending', 'active']),
            fetchMatchesWithPartner(user.id, ['completed', 'skipped']).then(r => r.slice(0, 20)),
            supabase
                .from('match_queue')
                .select('id')
                .eq('user_id', user.id)
                .eq('matched', false)
                .maybeSingle(),
        ]);

        setActiveMatches(active);
        setMatchHistory(history);
        setQueueStatus(queueEntry.data ? 'queued' : 'idle');
    }, [user]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
        refresh();
    }, [refresh]);

    // Ref pattern to avoid stale closures in Realtime callbacks
    const refreshRef = useRef(refresh);
    useEffect(() => { refreshRef.current = refresh; }, [refresh]);

    const handleMatchReceived = useCallback(async () => {
        await refreshRef.current();
        setQueueStatus('idle');
        setLastMatchedAt(Date.now());
    }, []);

    const handleMatchReceivedRef = useRef(handleMatchReceived);
    useEffect(() => { handleMatchReceivedRef.current = handleMatchReceived; }, [handleMatchReceived]);

    const handleMatchUpdated = useCallback(async () => {
        await refreshRef.current();
    }, []);

    const handleMatchUpdatedRef = useRef(handleMatchUpdated);
    useEffect(() => { handleMatchUpdatedRef.current = handleMatchUpdated; }, [handleMatchUpdated]);

    // Subscribe to Realtime changes on the matches table
    const shouldSubscribe = queueStatus === 'queued' || activeMatches.length > 0;

    useEffect(() => {
        if (!shouldSubscribe || !user) return;

        const channel = supabase
            .channel(`roulette-match-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'matches',
                    filter: `user_a_id=eq.${user.id}`,
                },
                () => handleMatchReceivedRef.current()
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'matches',
                    filter: `user_b_id=eq.${user.id}`,
                },
                () => handleMatchReceivedRef.current()
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'matches',
                    filter: `user_a_id=eq.${user.id}`,
                },
                () => handleMatchUpdatedRef.current()
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'matches',
                    filter: `user_b_id=eq.${user.id}`,
                },
                () => handleMatchUpdatedRef.current()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [shouldSubscribe, user]);

    const findMatch = useCallback(async (): Promise<MatchResult> => {
        if (!user) return { status: 'ERROR', error: 'Not authenticated' };

        if (activeMatches.length >= 2) {
            const msg = 'You already have 2 active matches. Complete or skip one before finding another.';
            setError(msg);
            return { status: 'ERROR', error: msg };
        }

        setError(null);

        const { data, error: fnError } = await supabase.functions.invoke('generate-matches');

        if (fnError) {
            const msg = fnError.message || 'Failed to find a match';
            setError(msg);
            return { status: 'ERROR', error: msg };
        }

        if (data?.status === 'MATCHED') {
            await refresh();
            return { status: 'MATCHED', match: data.match, shared_tags: data.shared_tags };
        }

        if (data?.status === 'QUEUED') {
            setQueueStatus('queued');
            return { status: 'QUEUED', message: data.message };
        }

        if (data?.error) {
            setError(data.message || data.error);
            return { status: 'ERROR', error: data.message || data.error };
        }

        return { status: 'ERROR', error: 'Unexpected response' };
    }, [user, refresh, activeMatches]);

    const leaveQueue = useCallback(async () => {
        if (!user) return;
        await supabase
            .from('match_queue')
            .delete()
            .eq('user_id', user.id)
            .eq('matched', false);
        setQueueStatus('idle');
    }, [user]);

    const completeMatch = useCallback(async (matchId: string) => {
        if (!user) return;
        await supabase
            .from('matches')
            .update({ status: 'completed' })
            .eq('id', matchId)
            .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);
        await refresh();
    }, [user, refresh]);

    const skipMatch = useCallback(async (matchId: string) => {
        if (!user) return;
        await supabase
            .from('matches')
            .update({ status: 'skipped' })
            .eq('id', matchId)
            .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);
        await refresh();
    }, [user, refresh]);

    const canMatch = activeMatches.length < 2 && queueStatus !== 'queued';

    return {
        queueStatus,
        activeMatches,
        matchHistory,
        canMatch,
        error,
        lastMatchedAt,
        findMatch,
        leaveQueue,
        completeMatch,
        skipMatch,
    };
}
