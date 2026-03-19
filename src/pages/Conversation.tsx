import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { useThread } from '@/hooks/useMessages';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function Conversation() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const partnerId = userId ?? '';

  const { messages, loading, sendMessage } = useThread(partnerId);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch partner profile
  useEffect(() => {
    if (!partnerId) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', partnerId)
      .single()
      .then(({ data }) => {
        if (data) setPartner(data as Profile);
      });
  }, [partnerId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText('');
    try {
      await sendMessage(content);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [text, sending, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Partner mini-header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <Link to="/messages" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 mr-1">
          <ArrowLeft size={18} />
        </Link>

        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={partner?.avatar_url ?? undefined} />
          <AvatarFallback className="bg-brand-navy-light text-white text-sm">
            {initials(partner?.name ?? null)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-brand-navy-light truncate">
            {partner?.name ?? '…'}
          </p>
          {partner?.company && (
            <p className="text-xs text-gray-500 truncate">{partner.company}</p>
          )}
        </div>

        {partner && (
          <Link
            to={`/profile/${partner.id}`}
            className="text-xs font-medium text-brand-gold hover:underline shrink-0"
          >
            View Profile
          </Link>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-[#F9FAFB]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Loading…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isSender={msg.sender_id === user?.id}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-end gap-2 shrink-0">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-brand-navy-light placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/40 focus:border-brand-gold max-h-32 overflow-y-auto"
          style={{ lineHeight: '1.5' }}
        />
        <Button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="h-9 w-9 p-0 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-white disabled:opacity-40 shrink-0"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
