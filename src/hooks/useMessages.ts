import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import type { Message, Conversation, Profile } from '@/lib/types';

// ─── useConversations ─────────────────────────────────────────────────────────

export interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  unreadTotal: number;
  refetch: () => Promise<void>;
}

export function useConversations(): UseConversationsReturn {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch all messages where user is sender or receiver
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!messages) return;

      // Group by conversation partner
      const partnerMap = new Map<string, { messages: Message[]; unread: number }>();
      for (const msg of messages) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!partnerMap.has(partnerId)) {
          partnerMap.set(partnerId, { messages: [], unread: 0 });
        }
        const entry = partnerMap.get(partnerId)!;
        entry.messages.push(msg);
        if (msg.receiver_id === user.id && msg.read_at === null) {
          entry.unread += 1;
        }
      }

      // Fetch profiles for all partners in parallel
      const partnerIds = Array.from(partnerMap.keys());
      if (partnerIds.length === 0) {
        setConversations([]);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', partnerIds);

      if (profilesError) throw profilesError;

      const profileById = new Map<string, Profile>(
        (profiles ?? []).map((p: Profile) => [p.id, p])
      );

      const convos: Conversation[] = [];
      for (const [partnerId, { messages: msgs, unread }] of partnerMap) {
        const partnerProfile = profileById.get(partnerId);
        if (!partnerProfile) continue;
        // Messages are already ordered desc, so first is latest
        const lastMessage = msgs[0];
        convos.push({
          partnerId,
          partnerProfile,
          lastMessage,
          unreadCount: unread,
          updatedAt: lastMessage.created_at,
        });
      }

      // Sort conversations by most recent message
      convos.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setConversations(convos);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const unreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return { conversations, loading, unreadTotal, refetch: fetchConversations };
}

// ─── useThread ────────────────────────────────────────────────────────────────

export interface UseThreadReturn {
  messages: Message[];
  loading: boolean;
  sendMessage: (content: string) => Promise<void>;
}

export function useThread(partnerId: string): UseThreadReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const markRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('receiver_id', user.id)
      .eq('sender_id', partnerId)
      .is('read_at', null);
  }, [user, partnerId]);

  const fetchThread = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),` +
          `and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data ?? []);
      await markRead();
    } finally {
      setLoading(false);
    }
  }, [user, partnerId, markRead]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user) return;
      const { data } = await supabase
        .from('messages')
        .insert({ sender_id: user.id, receiver_id: partnerId, content })
        .select()
        .single();
      if (data) {
        setMessages((prev) => [...prev, data as Message]);
      }
    },
    [user, partnerId]
  );

  // Subscribe to Realtime
  useEffect(() => {
    if (!user) return;

    // Deterministic channel name based on sorted user IDs
    const sortedIds = [user.id, partnerId].sort().join(':');

    const channel = supabase
      .channel(`messages:${sortedIds}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Only add if it belongs to this conversation
          if (newMsg.sender_id !== partnerId) return;
          setMessages((prev) => [...prev, newMsg]);
          // Mark as read since the thread is open
          markRead();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user, partnerId, markRead]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  return { messages, loading, sendMessage };
}
