import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Coffee, Clock, CheckCircle, X } from 'lucide-react';
import { useRoulette } from '@/hooks/useRoulette';
import type { MatchWithProfile } from '@/lib/types';

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function ActiveMatchItem({ match, onComplete, onSkip }: {
  match: MatchWithProfile;
  onComplete: (id: string) => Promise<void>;
  onSkip: (id: string) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);
  const partner = match.partner;
  const sharedTags = match.shared_tags ?? [];

  async function handleComplete() {
    setUpdating(true);
    await onComplete(match.id);
    setUpdating(false);
  }

  async function handleSkip() {
    setUpdating(true);
    await onSkip(match.id);
    setUpdating(false);
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-3">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Active Match</p>
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          {partner.avatar_url && (
            <AvatarImage src={partner.avatar_url} alt={partner.name ?? ''} />
          )}
          <AvatarFallback className="bg-brand-navy-light text-white text-xs">
            {getInitials(partner.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-brand-navy-light text-sm">{partner.name ?? 'Unknown'}</p>
          {(partner.role || partner.company) && (
            <p className="text-xs text-gray-500 truncate">
              {[partner.role, partner.company].filter(Boolean).join(', ')}
            </p>
          )}
          {(partner.city || partner.country) && (
            <p className="text-xs text-gray-400">
              {[partner.city, partner.country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {sharedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-gray-400 mr-1">Shared:</span>
          {sharedTags.map((tag) => (
            <Badge
              key={tag}
              className="text-xs px-2 py-0 bg-brand-gold-subtle text-brand-gold border-brand-gold/30 border"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          className="bg-brand-gold hover:bg-brand-gold-hover text-white text-xs h-7"
          onClick={() => navigate(`/messages/${partner.id}`)}
        >
          Send message
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7 border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1"
          onClick={handleComplete}
          disabled={updating}
        >
          <CheckCircle size={13} />
          Done
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-7 text-gray-400 hover:text-gray-600 px-2"
          onClick={handleSkip}
          disabled={updating}
          title="Skip this match"
        >
          <X size={13} />
        </Button>
      </div>
    </div>
  );
}

export function MatchCard() {
  const { queueStatus, activeMatches, canMatch, error, lastMatchedAt, findMatch, leaveQueue, completeMatch, skipMatch } = useRoulette();
  const [findingMatch, setFindingMatch] = useState(false);
  const [justMatched, setJustMatched] = useState(false);
  const [debouncing, setDebouncing] = useState(false);
  const debounceRef = useRef(false);

  // Show "Match found!" briefly when a Realtime match arrives
  useEffect(() => {
    if (lastMatchedAt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJustMatched(true);
      const timer = setTimeout(() => setJustMatched(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [lastMatchedAt]);

  async function handleFindMatch() {
    if (debounceRef.current || findingMatch) return;
    debounceRef.current = true;
    setDebouncing(true);
    setFindingMatch(true);

    await findMatch();

    setFindingMatch(false);
    // Keep button disabled for 3 seconds (debounce)
    setTimeout(() => {
      debounceRef.current = false;
      setDebouncing(false);
    }, 3000);
  }

  if (queueStatus === 'loading') {
    return (
      <Card className="border border-gray-200">
        <CardContent className="py-8 text-center text-sm text-gray-400">
          Loading…
        </CardContent>
      </Card>
    );
  }

  const slotCount = activeMatches.length;
  const atCapacity = slotCount >= 2;

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-brand-navy-light flex items-center gap-2">
          <Coffee size={18} className="text-brand-gold" />
          Coffee Roulette
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded">{error}</p>
        )}

        {/* Match found transition */}
        {justMatched && (
          <div className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-3">
            <CheckCircle size={16} className="text-brand-gold flex-shrink-0" />
            <p className="font-semibold text-brand-gold">Match found!</p>
          </div>
        )}

        {/* Active matches */}
        {activeMatches.length > 0 && (
          <div className="space-y-3">
            {activeMatches.map((m) => (
              <ActiveMatchItem
                key={m.id}
                match={m}
                onComplete={completeMatch}
                onSkip={skipMatch}
              />
            ))}
          </div>
        )}

        {/* Queue waiting state */}
        {queueStatus === 'queued' && (
          <div className="flex items-start gap-2 text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-3">
            <Clock size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-700">You're in the queue…</p>
              <p className="text-xs text-amber-600 mt-0.5">
                We'll match you when someone else joins. Usually takes a few hours.
              </p>
            </div>
          </div>
        )}

        {/* Empty state description */}
        {activeMatches.length === 0 && queueStatus === 'idle' && (
          <p className="text-sm text-gray-500">
            Get matched with someone whose skills complement yours.
          </p>
        )}

        {/* Slot counter */}
        <p className="text-xs text-gray-400">
          {slotCount}/2 match slots used
        </p>

        {/* Action buttons */}
        {queueStatus === 'queued' ? (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8"
            onClick={leaveQueue}
          >
            Leave queue
          </Button>
        ) : atCapacity ? (
          <p className="text-xs text-gray-400">Complete or skip a match to find more.</p>
        ) : (
          <Button
            size="sm"
            className="bg-brand-gold hover:bg-brand-gold-hover text-white text-xs h-8"
            onClick={handleFindMatch}
            disabled={!canMatch || findingMatch || debouncing}
          >
            {findingMatch
              ? 'Finding…'
              : activeMatches.length > 0
              ? 'Find another match'
              : 'Find me a match'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
