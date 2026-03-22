import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useAuth } from '@/lib/AuthContext';
import { SessionHeader } from '@/components/sessions/SessionHeader';
import { ParticipantRow } from '@/components/sessions/ParticipantRow';
import { SessionVideoBar } from '@/components/sessions/SessionVideoBar';
import { SessionChat } from '@/components/sessions/SessionChat';
import { toast } from '@/lib/toast';

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { session, participants, loading, error, joinSession, leaveSession, closeSession, updateMeetingLink } = useSession(id);

  const handleJoin = useCallback(async () => {
    try {
      await joinSession();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to join session');
    }
  }, [joinSession]);

  const handleLeave = useCallback(async () => {
    try {
      await leaveSession();
      navigate('/sessions');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to leave session');
    }
  }, [leaveSession, navigate]);

  const handleClose = useCallback(async () => {
    try {
      await closeSession();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to close session');
    }
  }, [closeSession]);

  const handleUpdateLink = useCallback(async (link: string) => {
    try {
      await updateMeetingLink(link);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update meeting link');
    }
  }, [updateMeetingLink]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Back link skeleton */}
        <div className="h-4 bg-slate-200 rounded w-20 animate-pulse" />

        {/* Header skeleton */}
        <div className="animate-pulse space-y-4">
          <div className="h-7 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-9 bg-slate-200 rounded w-20" />
            <div className="h-9 bg-slate-200 rounded w-20" />
          </div>
        </div>

        {/* Participants skeleton */}
        <div className="animate-pulse flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-8 bg-slate-200 rounded-full" />
          ))}
        </div>

        {/* Chat loading */}
        <div className="text-sm text-gray-400 text-center py-8">
          Loading messages…
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-semibold text-brand-navy-light mb-2">Session not found</h2>
        <p className="text-gray-500 mb-4">This session may have been removed or doesn't exist.</p>
        <Link to="/sessions" className="text-brand-gold hover:underline">
          Back to Sessions
        </Link>
      </div>
    );
  }

  const isCreator = user?.id === session.creator_id;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6 h-[calc(100dvh-3.5rem)] md:h-auto">
      <Link to="/sessions" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-navy-light shrink-0">
        <ArrowLeft className="h-4 w-4" />
        Sessions
      </Link>

      <div className="shrink-0">
        <SessionHeader
          session={session}
          isCreator={isCreator}
          onJoin={handleJoin}
          onLeave={handleLeave}
          onClose={handleClose}
        />
      </div>

      <div className="shrink-0">
        <ParticipantRow participants={participants} sessionId={session.id} />
      </div>

      {session.format === 'video' && (
        <div className="shrink-0">
          <SessionVideoBar
            session={session}
            isCreator={isCreator}
            onUpdateLink={handleUpdateLink}
          />
        </div>
      )}

      <div className="flex-1 min-h-0 md:flex-none">
        <SessionChat
          sessionId={session.id}
          isParticipant={session.is_participant}
          isOpen={session.status === 'open'}
        />
      </div>
    </div>
  );
}
