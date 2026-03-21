import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import type { Session, SessionWithMeta, Profile } from '@/lib/types';

interface UseSessionReturn {
  session: SessionWithMeta | null;
  participants: Profile[];
  loading: boolean;
  error: string | null;
  joinSession: () => Promise<void>;
  leaveSession: () => Promise<void>;
  closeSession: () => Promise<void>;
  updateMeetingLink: (link: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSession(sessionId: string | undefined): UseSessionReturn {
  const { user } = useAuth();
  const [session, setSession] = useState<SessionWithMeta | null>(null);
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user || !sessionId) return;

    try {
      setError(null);

      const [sessionResult, participantsResult] = await Promise.all([
        supabase
          .from('sessions')
          .select('*, creator:profiles!sessions_creator_id_fkey(*)')
          .eq('id', sessionId)
          .single(),
        supabase
          .from('session_participants')
          .select('user_id, profile:profiles!session_participants_user_id_fkey(*)')
          .eq('session_id', sessionId),
      ]);

      if (sessionResult.error) throw sessionResult.error;
      if (participantsResult.error) throw participantsResult.error;

      const row = sessionResult.data as Session & { creator: Profile };
      const participantProfiles = (participantsResult.data ?? []).map(
        (p) => p.profile as unknown as Profile
      );

      setParticipants(participantProfiles);
      setSession({
        ...row,
        creator: row.creator,
        participant_count: participantProfiles.length,
        is_participant: participantProfiles.some((p) => p.id === user.id),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch session');
    } finally {
      setLoading(false);
    }
  }, [user, sessionId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const joinSession = useCallback(async () => {
    if (!user || !sessionId) throw new Error('Not authenticated');

    // Check capacity
    const { count, error: countError } = await supabase
      .from('session_participants')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (countError) throw new Error(countError.message);

    if (session && count !== null && count >= session.max_participants) {
      throw new Error('Session is full');
    }

    const { error: insertError } = await supabase
      .from('session_participants')
      .insert({ session_id: sessionId, user_id: user.id });

    if (insertError) throw new Error(insertError.message);

    await refetch();
  }, [user, sessionId, session, refetch]);

  const leaveSession = useCallback(async () => {
    if (!user || !sessionId) throw new Error('Not authenticated');

    const { error: deleteError } = await supabase
      .from('session_participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', user.id);

    if (deleteError) throw new Error(deleteError.message);

    await refetch();
  }, [user, sessionId, refetch]);

  const closeSession = useCallback(async () => {
    if (!user || !sessionId) throw new Error('Not authenticated');

    const { error: updateError } = await supabase
      .from('sessions')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (updateError) throw new Error(updateError.message);

    await refetch();
  }, [user, sessionId, refetch]);

  const updateMeetingLink = useCallback(
    async (link: string) => {
      if (!user || !sessionId) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('sessions')
        .update({ meeting_link: link })
        .eq('id', sessionId);

      if (updateError) throw new Error(updateError.message);

      await refetch();
    },
    [user, sessionId, refetch]
  );

  return {
    session,
    participants,
    loading,
    error,
    joinSession,
    leaveSession,
    closeSession,
    updateMeetingLink,
    refetch,
  };
}
