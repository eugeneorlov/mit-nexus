import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Map, Coffee } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { MatchCard } from '@/components/roulette/MatchCard';
import { MatchHistory } from '@/components/roulette/MatchHistory';
import { OptInToggle } from '@/components/roulette/OptInToggle';
import { InviteCTA } from '@/components/invite/InviteCTA';
import { ProgressBar } from '@/components/invite/ProgressBar';

const MEMBER_THRESHOLD = 10;

export default function Dashboard() {
  const { profile } = useAuth();
  const [memberCount, setMemberCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('onboarded', true)
      .then(({ count }) => setMemberCount(count ?? 0));
  }, []);

  const hasEnoughMembers = memberCount !== null && memberCount >= MEMBER_THRESHOLD;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy-light">
          Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening in your cohort.</p>
      </div>

      {/* Opt-in toggle */}
      <OptInToggle />

      {/* Coffee Roulette — conditional on member count */}
      {memberCount === null ? (
        <Card className="border border-gray-200">
          <CardContent className="py-8 text-center text-sm text-gray-400">
            Loading…
          </CardContent>
        </Card>
      ) : !hasEnoughMembers ? (
        <>
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-brand-navy-light flex items-center gap-2">
                <Coffee size={18} className="text-brand-gold" />
                Coffee Roulette
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                Invite cohort mates to activate Coffee Roulette
              </p>
              <ProgressBar />
            </CardContent>
          </Card>
          <InviteCTA />
        </>
      ) : (
        <MatchCard />
      )}

      {/* Cohort progress */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-brand-navy-light flex items-center gap-2">
            <Users size={18} className="text-[#3B82F6]" />
            Cohort Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">Members onboarded</span>
            <span className="font-medium text-brand-navy-light">
              {memberCount !== null ? memberCount : '—'} / —
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-gold rounded-full transition-all"
              style={{ width: memberCount !== null && memberCount > 0 ? '60%' : '0%' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Match history */}
      <MatchHistory />

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/directory">
          <Card className="border border-gray-200 hover:border-brand-gold hover:shadow-sm transition-all cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center py-6 gap-2">
              <Users size={24} className="text-brand-navy-light" />
              <span className="text-sm font-medium text-brand-navy-light">Directory</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/map">
          <Card className="border border-gray-200 hover:border-brand-gold hover:shadow-sm transition-all cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center py-6 gap-2">
              <Map size={24} className="text-brand-navy-light" />
              <span className="text-sm font-medium text-brand-navy-light">Map</span>
            </CardContent>
          </Card>
        </Link>
      </div>

    </div>
  );
}
