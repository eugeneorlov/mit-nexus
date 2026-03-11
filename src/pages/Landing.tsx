import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

export default function Landing() {
  async function handleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-[#1E293B]">
            MIT <span className="text-[#F59E0B]">Nexus</span>
          </h1>
          <p className="mt-2 text-gray-500 text-lg">
            Connect with your MIT cohort
          </p>
        </div>

        <div className="flex justify-center gap-2">
          <Badge className="bg-[#10B981] text-white">Help</Badge>
          <Badge className="bg-[#3B82F6] text-white">Learn</Badge>
          <Badge className="bg-[#F59E0B] text-white">Connect</Badge>
        </div>

        <Button
          onClick={handleSignIn}
          className="w-full bg-[#1E293B] hover:bg-[#1E293B]/90 text-white py-3"
        >
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
