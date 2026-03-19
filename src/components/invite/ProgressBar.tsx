import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const MEMBER_THRESHOLD = 10;

export function ProgressBar() {
  const [memberCount, setMemberCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('onboarded', true)
      .then(({ count }) => setMemberCount(count ?? 0));
  }, []);

  if (memberCount === null) return null;

  if (memberCount >= MEMBER_THRESHOLD) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-[#10B981]">
        <CheckCircle size={16} />
        Coffee Roulette is active! {memberCount} members and growing.
      </div>
    );
  }

  const progress = Math.min(memberCount / MEMBER_THRESHOLD, 1);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {memberCount}/10 members — Coffee Roulette activates at 10!
        </span>
        <span>{MEMBER_THRESHOLD - memberCount} more needed</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#F59E0B] rounded-full transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
