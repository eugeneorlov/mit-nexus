import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Coffee } from 'lucide-react';
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

interface RouletteMatch {
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

export function MatchCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [match, setMatch] = useState<RouletteMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const { week, year } = getISOWeekAndYear(new Date());

    supabase
      .from('matches')
      .select(
        '*, user_a:profiles!matches_user_a_id_fkey(*, tags(*)), user_b:profiles!matches_user_b_id_fkey(*, tags(*))'
      )
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq('week_number', week)
      .eq('year', year)
      .single()
      .then(({ data }) => {
        setMatch((data as RouletteMatch) ?? null);
        setLoading(false);
      });
  }, [user]);

  async function updateStatus(newStatus: 'completed' | 'skipped') {
    if (!match || updating) return;
    setUpdating(true);
    await supabase.from('matches').update({ status: newStatus }).eq('id', match.id);
    setMatch((prev) => (prev ? { ...prev, status: newStatus } : null));
    setUpdating(false);
  }

  if (loading) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="py-8 text-center text-sm text-gray-400">
          Loading your match…
        </CardContent>
      </Card>
    );
  }

  if (!match) {
    return (
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#1E293B] flex items-center gap-2">
            <Coffee size={18} className="text-[#F59E0B]" />
            Coffee Roulette
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            No match this week — check back Monday!
          </p>
        </CardContent>
      </Card>
    );
  }

  const otherProfile = match.user_a_id === user?.id ? match.user_b : match.user_a;
  const sharedTags = match.shared_tags ?? [];
  const initials = getInitials(otherProfile.name);

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-[#1E293B] flex items-center gap-2">
          <Coffee size={18} className="text-[#F59E0B]" />
          Your match this week
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Other person's profile */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Avatar className="h-12 w-12 flex-shrink-0">
            {otherProfile.avatar_url && (
              <AvatarImage src={otherProfile.avatar_url} alt={otherProfile.name ?? ''} />
            )}
            <AvatarFallback className="bg-[#1E293B] text-white">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#1E293B] text-sm">{otherProfile.name ?? 'Unknown'}</p>
            {(otherProfile.role || otherProfile.company) && (
              <p className="text-xs text-gray-500 truncate">
                {[otherProfile.role, otherProfile.company].filter(Boolean).join(' @ ')}
              </p>
            )}
            {(otherProfile.city || otherProfile.country) && (
              <p className="text-xs text-gray-400">
                {[otherProfile.city, otherProfile.country].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Shared tags */}
        {sharedTags.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Why you matched:</p>
            <div className="flex flex-wrap gap-1.5">
              {sharedTags.map((tag) => (
                <Badge
                  key={tag}
                  className="text-xs px-2.5 py-0.5 bg-amber-50 text-amber-700 border-amber-200 border"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Status indicator for non-pending matches */}
        {match.status !== 'pending' && (
          <span
            className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
              match.status === 'completed'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {match.status === 'completed' ? 'Completed' : 'Skipped'}
          </span>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            className="bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs h-8"
            onClick={() => navigate(`/messages/${otherProfile.id}`)}
          >
            Send a message
          </Button>
          {match.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => updateStatus('completed')}
                disabled={updating}
              >
                Mark complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 text-gray-400 hover:text-gray-600"
                onClick={() => updateStatus('skipped')}
                disabled={updating}
              >
                Skip
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
