import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Archive } from 'lucide-react';
import { useSessionMessages } from '@/hooks/useSessionMessages';
import type { SessionMessageWithSender } from '@/lib/types';
import { SessionMessage } from './SessionMessage';
import { SessionInput } from './SessionInput';

interface SessionChatProps {
  sessionId: string;
  isParticipant: boolean;
  isOpen: boolean;
}

export function SessionChat({ sessionId, isParticipant, isOpen }: SessionChatProps) {
  const { messages, loading, error, sendMessage } = useSessionMessages(sessionId);
  const [replyTo, setReplyTo] = useState<SessionMessageWithSender | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleScrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-brand-gold-subtle');
      setTimeout(() => el.classList.remove('bg-brand-gold-subtle'), 1500);
    }
  }, []);

  const handleReply = useCallback((message: SessionMessageWithSender) => {
    setReplyTo(message);
  }, []);

  const handleClearReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-5 w-5 animate-spin text-brand-navy" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-red-500 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white flex flex-col" style={{ height: '420px' }}>
      {/* Scrollable message list */}
      <div className="flex-1 overflow-y-auto py-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <SessionMessage
              key={msg.id}
              message={msg}
              onReply={handleReply}
              onScrollToMessage={handleScrollToMessage}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input or closed notice */}
      {isParticipant && isOpen ? (
        <SessionInput
          replyTo={replyTo}
          onClearReply={handleClearReply}
          onSend={sendMessage}
        />
      ) : !isOpen ? (
        <div className="border-t border-slate-200 px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Archive className="h-4 w-4 shrink-0" />
          This session has been closed. Chat is read-only.
        </div>
      ) : null}
    </div>
  );
}
