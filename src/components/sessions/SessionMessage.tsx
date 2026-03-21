import { Reply } from 'lucide-react';
import type { SessionMessageWithSender } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface SessionMessageProps {
  message: SessionMessageWithSender;
  onReply: (message: SessionMessageWithSender) => void;
  onScrollToMessage?: (messageId: string) => void;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  }) + ', ' + date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function SessionMessage({ message, onReply, onScrollToMessage }: SessionMessageProps) {
  return (
    <div
      id={`msg-${message.id}`}
      className="group flex gap-2.5 px-3 py-1.5 hover:bg-slate-50 rounded-lg transition-colors"
    >
      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
        <AvatarImage src={message.sender.avatar_url ?? undefined} alt={message.sender.name ?? 'User'} />
        <AvatarFallback className="text-[10px] bg-brand-gold-subtle text-brand-navy">
          {getInitials(message.sender.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        {/* Name + timestamp */}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-brand-navy-light truncate">
            {message.sender.name ?? 'Unknown'}
          </span>
          <span className="text-[11px] text-gray-400 whitespace-nowrap">
            {formatTimestamp(message.created_at)}
          </span>
        </div>

        {/* Reply-to quote */}
        {message.reply_to && (
          <button
            type="button"
            className="mt-0.5 mb-1 block w-full text-left bg-slate-100 border-l-2 border-brand-gold rounded px-2 py-1 text-xs text-gray-500 truncate hover:bg-slate-200 transition-colors"
            onClick={() => onScrollToMessage?.(message.reply_to!.id)}
          >
            <span className="font-medium text-gray-600">
              {message.reply_to.sender.name ?? 'Unknown'}
            </span>{' '}
            {truncate(message.reply_to.content, 80)}
          </button>
        )}

        {/* Message content */}
        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>

      {/* Reply button: visible on hover (desktop) or always (mobile) */}
      <button
        type="button"
        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 self-start mt-1 p-1 rounded hover:bg-slate-200 text-gray-400 hover:text-brand-navy-light"
        onClick={() => onReply(message)}
        aria-label="Reply"
      >
        <Reply className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
