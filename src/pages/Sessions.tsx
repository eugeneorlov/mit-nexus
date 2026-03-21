import { Link } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';
import { SessionCard } from '@/components/sessions/SessionCard';
import { Button } from '@/components/ui/button';

export default function Sessions() {
  const { sessions, loading, error } = useSessions();

  const openSessions = sessions.filter((s) => s.status === 'open');
  const pastSessions = sessions.filter((s) => s.status === 'closed');

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy-light">Sessions</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Join or create breakout sessions with your cohort.
          </p>
        </div>
        <Button asChild className="bg-brand-gold hover:bg-brand-gold-hover text-white">
          <Link to="/sessions/new">
            <Plus className="h-4 w-4 mr-1" />
            New Session
          </Link>
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-navy-light" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="py-8 text-center text-red-500 text-sm">{error}</div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Empty state */}
          {sessions.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <p className="text-base font-medium">No sessions yet</p>
              <p className="text-sm mt-1 mb-4">Create the first session for your cohort.</p>
              <Button asChild className="bg-brand-gold hover:bg-brand-gold-hover text-white">
                <Link to="/sessions/new">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Session
                </Link>
              </Button>
            </div>
          )}

          {/* Open Sessions */}
          {openSessions.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-brand-navy-light mb-3">Open Sessions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {openSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </section>
          )}

          {/* Past Sessions */}
          {pastSessions.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-brand-navy-light mb-3">Past Sessions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
