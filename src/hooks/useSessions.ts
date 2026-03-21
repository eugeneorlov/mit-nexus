import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import type { Session, SessionWithMeta, SessionParticipant, Profile, CreateSessionInput } from '@/lib/types';

interface UseSessionsReturn {
  sessions: SessionWithMeta[];
  loading: boolean;
  error: string | null;
  createSession: (input: CreateSessionInput) => Promise<Session>;
  refetch: () => Promise<void>;
}

export function useSessions(): UseSessionsReturn {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);

      // Two-query approach: sessions with creator join, then all participants
      const [sessionsResult, participantsResult] = await Promise.all([
        supabase
          .from('sessions')
          .select('*, creator:profiles!sessions_creator_id_fkey(*)')
          .order('status', { ascending: false }) // 'open' before 'closed' alphabetically
          .order('created_at', { ascending: false }),
        supabase
          .from('session_participants')
          .select('session_id, user_id'),
      ]);

      if (sessionsResult.error) throw sessionsResult.error;
      if (participantsResult.error) throw participantsResult.error;

      const participants = (participantsResult.data ?? []) as Pick<SessionParticipant, 'session_id' | 'user_id'>[];

      // Group participants by session_id
      const participantsBySession = new Map<string, string[]>();
      for (const p of participants) {
        const list = participantsBySession.get(p.session_id) ?? [];
        list.push(p.user_id);
        participantsBySession.set(p.session_id, list);
      }

      const merged: SessionWithMeta[] = (sessionsResult.data ?? []).map(
        (row: Session & { creator: Profile }) => {
          const sessionParticipants = participantsBySession.get(row.id) ?? [];
          return {
            ...row,
            creator: row.creator,
            participant_count: sessionParticipants.length,
            is_participant: sessionParticipants.includes(user.id),
          };
        }
      );

      setSessions(merged);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createSession = useCallback(
    async (input: CreateSessionInput): Promise<Session> => {
      if (!user) throw new Error('Not authenticated');

      const { data: session, error: insertError } = await supabase
        .from('sessions')
        .insert({
          creator_id: user.id,
          title: input.title,
          description: input.description ?? null,
          format: input.format,
          max_participants: input.max_participants ?? 8,
          meeting_link: input.meeting_link ?? null,
          scheduled_at: input.scheduled_at ?? null,
        })
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);

      // Auto-add creator as participant
      const { error: participantError } = await supabase
        .from('session_participants')
        .insert({ session_id: session.id, user_id: user.id });

      if (participantError) throw new Error(participantError.message);

      await refetch();
      return session as Session;
    },
    [user, refetch]
  );

  return { sessions, loading, error, createSession, refetch };
}
