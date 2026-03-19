import { useState, useEffect } from 'react';
import { Link2, CheckCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export function InviteCTA() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usedCount, setUsedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('invites')
      .select('*', { count: 'exact', head: true })
      .eq('inviter_id', user.id)
      .not('used_by', 'is', null)
      .then(({ count }) => setUsedCount(count ?? 0));
  }, [user]);

  async function handleCopyInvite() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from('invites')
        .insert({ inviter_id: user.id })
        .select()
        .single();
      if (insertError || !data) throw insertError ?? new Error('Failed to create invite');
      const url = `${window.location.origin}/join/${data.token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setError('Failed to generate invite link. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-brand-navy-light flex items-center gap-2">
          <Users size={18} className="text-brand-gold" />
          Invite your cohort mates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-500">
          Share your personal invite link to bring cohort members onto MIT Nexus.
        </p>
        {usedCount !== null && usedCount > 0 && (
          <p className="text-sm font-medium text-[#10B981]">
            {usedCount} {usedCount === 1 ? 'person has' : 'people have'} joined via your invite.
          </p>
        )}
        <Button
          onClick={handleCopyInvite}
          disabled={loading || copied}
          className={`w-full gap-2 text-white ${
            copied
              ? 'bg-[#10B981] hover:bg-[#10B981]'
              : 'bg-brand-gold hover:bg-brand-gold-hover'
          }`}
        >
          {copied ? (
            <>
              <CheckCircle size={16} />
              Copied!
            </>
          ) : (
            <>
              <Link2 size={16} />
              Copy Invite Link
            </>
          )}
        </Button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </CardContent>
    </Card>
  );
}
