import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useAuth } from '@/lib/AuthContext';
import { SessionHeader } from '@/components/sessions/SessionHeader';
import { ParticipantRow } from '@/components/sessions/ParticipantRow';
import { SessionVideoBar } from '@/components/sessions/SessionVideoBar';
import { SessionChat } from '@/components/sessions/SessionChat';

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { session, participants, loading, error, joinSession, leaveSession, closeSession, updateMeetingLink } = useSession(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand-navy" />
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
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <Link to="/sessions" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-navy-light">
        <ArrowLeft className="h-4 w-4" />
        Sessions
      </Link>

      <SessionHeader
        session={session}
        isCreator={isCreator}
        onJoin={joinSession}
        onLeave={leaveSession}
        onClose={closeSession}
      />

      <ParticipantRow participants={participants} sessionId={session.id} />

      {session.format === 'video' && (
        <SessionVideoBar
          session={session}
          isCreator={isCreator}
          onUpdateLink={updateMeetingLink}
        />
      )}

      <SessionChat
        sessionId={session.id}
        isParticipant={session.is_participant}
        isOpen={session.status === 'open'}
      />
    </div>
  );
}
