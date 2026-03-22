import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Video, MessageSquare, Users, Calendar, Loader2 } from 'lucide-react';
import type { SessionWithMeta } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { formatTimestamp } from '@/lib/formatTimestamp';
import { toast } from '@/lib/toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SessionCardProps {
  session: SessionWithMeta;
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

export function SessionCard({ session }: SessionCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);

  const isClosed = session.status === 'closed';
  const isFull = session.participant_count >= session.max_participants;

  async function handleJoin() {
    if (!user || joining) return;
    setJoining(true);

    try {
      const { count, error: countError } = await supabase
        .from('session_participants')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', session.id);

      if (countError) throw countError;

      if (count !== null && count >= session.max_participants) {
        toast('Session is full');
        return;
      }

      const { error: insertError } = await supabase
        .from('session_participants')
        .insert({ session_id: session.id, user_id: user.id });

      if (insertError) throw insertError;

      navigate(`/sessions/${session.id}`);
    } catch {
      toast('Failed to join session');
    } finally {
      setJoining(false);
    }
  }

  // Determine action button
  let actionLabel: string;
  let actionVariant: 'default' | 'outline' | 'secondary';
  let actionDisabled = false;
  let actionLink: string | null = null;
  let actionOnClick: (() => void) | null = null;

  if (isClosed) {
    actionLabel = 'View Archive';
    actionVariant = 'outline';
    actionLink = `/sessions/${session.id}`;
  } else if (session.is_participant) {
    actionLabel = 'Open';
    actionVariant = 'default';
    actionLink = `/sessions/${session.id}`;
  } else if (isFull) {
    actionLabel = 'Full';
    actionVariant = 'secondary';
    actionDisabled = true;
  } else {
    actionLabel = 'Join';
    actionVariant = 'outline';
    actionOnClick = handleJoin;
    actionDisabled = joining;
  }

  return (
    <div
      className={`bg-white rounded-2xl p-6 border border-slate-200 hover:border-brand-gold/30 transition ${
        isClosed ? 'opacity-60' : ''
      }`}
    >
      {/* Title + Format badge */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-base font-semibold text-brand-navy-light line-clamp-1">
          {session.title}
        </h3>
        <Badge
          className={
            session.format === 'video'
              ? 'bg-blue-100 text-blue-700 border-blue-200 shrink-0'
              : 'bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0'
          }
        >
          {session.format === 'video' ? (
            <Video className="h-3 w-3 mr-1" />
          ) : (
            <MessageSquare className="h-3 w-3 mr-1" />
          )}
          {session.format === 'video' ? 'Video' : 'Chat'}
        </Badge>
      </div>

      {/* Description */}
      {session.description && (
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {session.description}
        </p>
      )}

      {/* Participant count */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
        <Users className="h-4 w-4" />
        <span>
          {session.participant_count}/{session.max_participants} joined
        </span>
      </div>

      {/* Scheduled time for video */}
      {session.format === 'video' && session.scheduled_at && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
          <Calendar className="h-4 w-4" />
          <span>{formatTimestamp(session.scheduled_at)}</span>
        </div>
      )}

      {/* Creator + Action */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            {session.creator.avatar_url && (
              <AvatarImage src={session.creator.avatar_url} alt={session.creator.name ?? ''} />
            )}
            <AvatarFallback className="text-[10px] bg-brand-navy text-white">
              {getInitials(session.creator.name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-gray-500 truncate max-w-[120px]">
            {session.creator.name ?? 'Unknown'}
          </span>
        </div>

        {actionLink ? (
          <Button
            asChild
            size="sm"
            variant={actionVariant}
            className={
              actionVariant === 'default'
                ? 'bg-brand-gold hover:bg-brand-gold-hover text-white'
                : actionVariant === 'outline' && !isClosed
                  ? 'border-brand-gold text-brand-gold hover:bg-brand-gold/10'
                  : ''
            }
          >
            <Link to={actionLink}>{actionLabel}</Link>
          </Button>
        ) : (
          <Button
            size="sm"
            variant={actionVariant}
            disabled={actionDisabled}
            onClick={actionOnClick ?? undefined}
            className={
              actionOnClick
                ? 'border-brand-gold text-brand-gold hover:bg-brand-gold/10'
                : ''
            }
          >
            {joining ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              actionLabel
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
