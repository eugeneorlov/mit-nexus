import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_onboarded')
            .eq('id', session.user.id)
            .single();

          if (profile?.is_onboarded) {
            navigate('/dashboard');
          } else {
            navigate('/onboard');
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#1E293B] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#1E293B] font-medium">Signing you in…</p>
      </div>
    </div>
  );
}
