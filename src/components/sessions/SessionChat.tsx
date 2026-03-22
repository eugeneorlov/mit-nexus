import { useState, useEffect, useRef, useCallback } from 'react';
import { Archive } from 'lucide-react';
import { useSessionMessages } from '@/hooks/useSessionMessages';
import type { SessionMessageWithSender } from '@/lib/types';
import { toast } from '@/lib/toast';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const initialLoadRef = useRef(true);

  // Track scroll position to decide whether to auto-scroll
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  // Auto-scroll to bottom on new messages (skip if user scrolled up)
  useEffect(() => {
    if (isNearBottomRef.current || initialLoadRef.current) {
      bottomRef.current?.scrollIntoView({
        behavior: initialLoadRef.current ? 'auto' : 'smooth',
      });
      initialLoadRef.current = false;
    }
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

  const handleSend = useCallback(
    async (content: string, replyToId?: string) => {
      if (!isOpen) {
        toast('Session has been closed');
        return;
      }
      await sendMessage(content, replyToId);
    },
    [isOpen, sendMessage]
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white flex flex-col h-full md:h-[420px]">
        <div className="flex-1 overflow-y-auto py-2 space-y-3 px-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2.5 animate-pulse">
              <div className="h-7 w-7 bg-slate-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="flex gap-2">
                  <div className="h-4 bg-slate-200 rounded w-20" />
                  <div className="h-3 bg-slate-200 rounded w-12" />
                </div>
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-gray-400 text-center">
          Loading messages…
        </div>
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
    <div className="rounded-2xl border border-slate-200 bg-white flex flex-col h-full md:h-[420px]">
      {/* Scrollable message list */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-2"
      >
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
          onSend={handleSend}
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
