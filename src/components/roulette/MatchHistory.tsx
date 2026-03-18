import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import type { Profile, Tag } from '@/lib/types';

function getISOWeekAndYear(date: Date): { week: number; year: number } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, year: d.getFullYear() };
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

interface RouletteProfile extends Profile {
  tags: Tag[];
}

interface HistoryMatch {
  id: string;
  user_a_id: string;
  user_b_id: string;
  week_number: number;
  year: number;
  status: string;
  shared_tags: string[] | null;
  created_at: string;
  user_a: RouletteProfile;
  user_b: RouletteProfile;
}

export function MatchHistory() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<HistoryMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const { week: currentWeek, year: currentYear } = getISOWeekAndYear(new Date());

    supabase
      .from('matches')
      .select(
        '*, user_a:profiles!matches_user_a_id_fkey(*, tags(*)), user_b:profiles!matches_user_b_id_fkey(*, tags(*))'
      )
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .order('year', { ascending: false })
      .order('week_number', { ascending: false })
      .then(({ data }) => {
        const history = ((data as HistoryMatch[]) ?? []).filter(
          (m) => !(m.week_number === currentWeek && m.year === currentYear)
        );
        setMatches(history);
        setLoading(false);
      });
  }, [user]);

  if (loading || matches.length === 0) return null;

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-[#1E293B] flex items-center gap-2">
          <Clock size={18} className="text-gray-400" />
          Past Matches
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-gray-100">
        {matches.map((match) => {
          const otherProfile = match.user_a_id === user?.id ? match.user_b : match.user_a;
          const initials = getInitials(otherProfile.name);
          return (
            <div key={match.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Avatar className="h-9 w-9 flex-shrink-0">
                {otherProfile.avatar_url && (
                  <AvatarImage src={otherProfile.avatar_url} alt={otherProfile.name ?? ''} />
                )}
                <AvatarFallback className="bg-[#1E293B] text-white text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1E293B]">
                  {otherProfile.name ?? 'Unknown'}
                </p>
                <p className="text-xs text-gray-400">
                  Week {match.week_number}, {match.year}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  match.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700'
                    : match.status === 'skipped'
                    ? 'bg-gray-100 text-gray-500'
                    : 'bg-amber-50 text-amber-700'
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
