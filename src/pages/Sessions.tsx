import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';
import { SessionCard } from '@/components/sessions/SessionCard';
import { Button } from '@/components/ui/button';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="h-5 bg-slate-200 rounded w-2/3" />
        <div className="h-5 bg-slate-200 rounded w-14" />
      </div>
      <div className="h-4 bg-slate-200 rounded w-full mb-2" />
      <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 w-4 bg-slate-200 rounded" />
        <div className="h-4 bg-slate-200 rounded w-20" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 bg-slate-200 rounded-full" />
          <div className="h-3 bg-slate-200 rounded w-16" />
        </div>
        <div className="h-8 bg-slate-200 rounded w-16" />
      </div>
    </div>
  );
}

export default function Sessions() {
  const { sessions, loading, error } = useSessions();

  const openSessions = sessions.filter((s) => s.status === 'open');
  const pastSessions = sessions.filter((s) => s.status === 'closed');

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
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

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
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
              <p className="text-base font-medium">No sessions yet.</p>
              <p className="text-sm mt-1 mb-4">Start the first breakout discussion!</p>
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
