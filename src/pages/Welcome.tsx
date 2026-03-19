import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { InviteCTA } from '@/components/invite/InviteCTA';
import { ProgressBar } from '@/components/invite/ProgressBar';

const INVITE_TOKEN_KEY = 'mit_nexus_invite_token';

export default function Welcome() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [memberNumber, setMemberNumber] = useState<number | null>(null);

  useEffect(() => {
    if (!user || !profile) return;

    // Mark invite as used if there's a pending token
    const pendingToken = localStorage.getItem(INVITE_TOKEN_KEY);
    if (pendingToken) {
      supabase
        .from('invites')
        .update({ used_by: user.id })
        .eq('token', pendingToken)
        .is('used_by', null)
        .then(() => {
          localStorage.removeItem(INVITE_TOKEN_KEY);
        });
    }

    // Find this user's member number (rank by created_at among onboarded members)
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('onboarded', true)
      .lte('created_at', profile.created_at)
      .then(({ count }) => setMemberNumber(count ?? null));
  }, [user, profile]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#1E293B] text-2xl font-bold">
              Welcome to MIT Nexus!
            </CardTitle>
            {memberNumber !== null && (
              <p className="text-gray-500 text-sm mt-1">
                You're member{' '}
                <span className="font-semibold text-[#1E293B]">#{memberNumber}</span>.
                Help unlock Coffee Roulette:
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressBar />
            <InviteCTA />
            <div className="text-center">
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-[#F59E0B] hover:bg-[#D97706] text-white w-full"
              >
                Go to Dashboard
              </Button>
              <Link
                to="/dashboard"
                className="block mt-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip for now
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
