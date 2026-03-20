import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export function OptInToggle() {
  const { user, profile } = useAuth();
  const [localOverride, setLocalOverride] = useState<boolean | null>(null);
  const [updating, setUpdating] = useState(false);
  const optIn = localOverride ?? profile?.roulette_opt_in ?? false;

  async function toggle() {
    if (!user || updating) return;
    const newValue = !optIn;
    setLocalOverride(newValue);
    setUpdating(true);
    await supabase.from('profiles').update({ roulette_opt_in: newValue }).eq('id', user.id);
    if (!newValue) {
      // Clean up queue entry if they opt out
      await supabase.from('match_queue').delete().eq('user_id', user.id);
    }
    setUpdating(false);
  }

  return (
    <Card className="border border-gray-200">
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand-navy-light">Participate in Coffee Roulette</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Get matched with a cohort member for a casual coffee chat.
            </p>
          </div>
          <button
            onClick={toggle}
            disabled={updating}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 ${
              optIn ? 'bg-brand-gold' : 'bg-gray-200'
            } ${updating ? 'opacity-60 cursor-not-allowed' : ''}`}
            role="switch"
            aria-checked={optIn}
            aria-label="Participate in Coffee Roulette"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                optIn ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
