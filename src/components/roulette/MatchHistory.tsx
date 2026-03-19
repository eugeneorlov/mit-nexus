import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock } from 'lucide-react';
import { useRoulette } from '@/hooks/useRoulette';

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function MatchHistory() {
  const { matchHistory, queueStatus } = useRoulette();

  if (queueStatus === 'loading' || matchHistory.length === 0) return null;

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-brand-navy-light flex items-center gap-2">
          <Clock size={18} className="text-gray-400" />
          Past Matches
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-gray-100">
        {matchHistory.map((match) => {
          const partner = match.partner;
          return (
            <div key={match.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Avatar className="h-9 w-9 flex-shrink-0">
                {partner.avatar_url && (
                  <AvatarImage src={partner.avatar_url} alt={partner.name ?? ''} />
                )}
                <AvatarFallback className="bg-brand-navy-light text-white text-xs">
                  {getInitials(partner.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-navy-light">
                  {partner.name ?? 'Unknown'}
                </p>
                <p className="text-xs text-gray-400">{formatDate(match.created_at)}</p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  match.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {match.status}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
