import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [onboardChecked, setOnboardChecked] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!session) {
      navigate('/');
      return;
    }

    supabase
      .from('profiles')
      .select('is_onboarded')
      .eq('id', session.user.id)
      .single()
      .then(({ data: profile }) => {
        if (!profile?.is_onboarded) {
          navigate('/onboard');
        } else {
          setOnboardChecked(true);
        }
      });
  }, [session, loading, navigate]);

  if (loading || !onboardChecked) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1E293B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
