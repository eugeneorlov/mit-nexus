import { useState, useRef, useCallback } from 'react';
import { Send, X } from 'lucide-react';
import type { SessionMessageWithSender } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface SessionInputProps {
  replyTo: SessionMessageWithSender | null;
  onClearReply: () => void;
  onSend: (content: string, replyToId?: string) => Promise<void>;
}

export function SessionInput({ replyTo, onClearReply, onSend }: SessionInputProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await onSend(trimmed, replyTo?.id);
      setContent('');
      onClearReply();
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setSending(false);
    }
  }, [content, sending, onSend, replyTo, onClearReply]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  return (
    <div className="border-t border-slate-200 bg-white px-3 py-2">
      {/* Reply preview bar */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-slate-50 rounded border-l-2 border-brand-gold text-xs text-gray-500">
          <span className="truncate flex-1">
            Replying to{' '}
            <span className="font-medium text-gray-600">
              {replyTo.sender.name ?? 'Unknown'}
            </span>
          </span>
          <button
            type="button"
            onClick={onClearReply}
            className="shrink-0 p-0.5 rounded hover:bg-slate-200 text-gray-400 hover:text-gray-600"
            aria-label="Cancel reply"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 resize-none rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-gold"
        />
        <Button
          size="sm"
          disabled={!content.trim() || sending}
          onClick={handleSend}
          className="bg-brand-gold hover:bg-brand-gold-hover text-white shrink-0 h-9 w-9 p-0"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
