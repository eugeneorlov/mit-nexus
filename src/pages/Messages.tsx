import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useConversations } from '@/hooks/useMessages';
import type { Conversation } from '@/lib/types';

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 1) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function ConversationRow({ convo }: { convo: Conversation }) {
  const navigate = useNavigate();
  const { partnerProfile, lastMessage, unreadCount, updatedAt } = convo;

  return (
    <button
      onClick={() => navigate(`/messages/${partnerProfile.id}`)}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
    >
      <Avatar className="h-11 w-11 shrink-0">
        <AvatarImage src={partnerProfile.avatar_url ?? undefined} />
        <AvatarFallback className="bg-[#1E293B] text-white text-sm">
          {initials(partnerProfile.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-[#1E293B]' : 'font-medium text-[#1E293B]'}`}>
            {partnerProfile.name ?? 'Unknown'}
          </span>
          <span className="text-xs text-gray-400 shrink-0">{formatTime(updatedAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={`text-sm truncate ${unreadCount > 0 ? 'text-[#1E293B]' : 'text-gray-500'}`}>
            {lastMessage.content}
          </p>
          {unreadCount > 0 && (
            <Badge className="ml-auto h-5 min-w-[20px] shrink-0 flex items-center justify-center bg-[#F59E0B] text-white text-xs px-1.5">
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

export default function Messages() {
  const { conversations, loading } = useConversations();

  return (
    <div className="flex flex-col h-screen md:h-auto">
      <div className="px-6 py-5 border-b border-gray-100 bg-white">
        <h1 className="text-xl font-bold text-[#1E293B]">Messages</h1>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center p-12">
          <p className="text-gray-400 text-sm">Loading…</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <p className="text-gray-500 text-sm">
            No messages yet. Browse the directory to find someone to chat with.
          </p>
        </div>
      ) : (
        <div className="bg-white divide-y divide-gray-100">
          {conversations.map((convo) => (
            <ConversationRow key={convo.partnerId} convo={convo} />
          ))}
        </div>
      )}
    </div>
  );
}
