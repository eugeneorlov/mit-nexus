import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import type {
  SessionMessage,
  SessionMessageWithSender,
  Profile,
} from '@/lib/types';

export interface UseSessionMessagesReturn {
  messages: SessionMessageWithSender[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string, replyToId?: string) => Promise<void>;
}

export function useSessionMessages(
  sessionId: string
): UseSessionMessagesReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SessionMessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Ref keeps current messages available inside the Realtime callback
  const messagesRef = useRef<SessionMessageWithSender[]>(messages);
  messagesRef.current = messages;

  // Resolve reply_to references from the existing messages array
  const resolveReplyTo = useCallback(
    (
      msg: SessionMessage & { sender: Profile },
      allMessages: SessionMessageWithSender[]
    ): SessionMessageWithSender => {
      if (!msg.reply_to_id) {
        return { ...msg, reply_to: null };
      }
      const parent = allMessages.find((m) => m.id === msg.reply_to_id);
      if (parent) {
        return {
          ...msg,
          reply_to: {
            id: parent.id,
            session_id: parent.session_id,
            sender_id: parent.sender_id,
            content: parent.content,
            reply_to_id: parent.reply_to_id,
            created_at: parent.created_at,
            sender: parent.sender,
          },
        };
      }
      return { ...msg, reply_to: null };
    },
    []
  );

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('session_messages')
        .select('*, sender:profiles!sender_id(*)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      const raw = (data ?? []) as (SessionMessage & { sender: Profile })[];
      // Two-pass: first pass without reply_to, second pass resolves them
      const withoutReplies: SessionMessageWithSender[] = raw.map((m) => ({
        ...m,
        reply_to: null,
      }));
      const resolved = raw.map((m) => resolveReplyTo(m, withoutReplies));
      setMessages(resolved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [user, sessionId, resolveReplyTo]);

  const sendMessage = useCallback(
    async (content: string, replyToId?: string) => {
      if (!user) return;
      await supabase.from('session_messages').insert({
        session_id: sessionId,
        sender_id: user.id,
        content,
        reply_to_id: replyToId ?? null,
      });
      // Don't refetch — Realtime subscription picks up the new message
    },
    [user, sessionId]
  );

  // Subscribe to Realtime INSERT events on session_messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`session_messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          const newRow = payload.new as SessionMessage;

          // Avoid duplicates (e.g. own message already appended optimistically)
          if (messagesRef.current.some((m) => m.id === newRow.id)) return;

          // Fetch the full message with sender profile join
          const { data } = await supabase
            .from('session_messages')
            .select('*, sender:profiles!sender_id(*)')
            .eq('id', newRow.id)
            .single();

          if (!data) return;

          const raw = data as SessionMessage & { sender: Profile };
          const resolved = resolveReplyTo(raw, messagesRef.current);

          setMessages((prev) => {
            // Double-check for duplicates after async fetch
            if (prev.some((m) => m.id === resolved.id)) return prev;
            return [...prev, resolved];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user, sessionId, resolveReplyTo]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return { messages, loading, error, sendMessage };
}
