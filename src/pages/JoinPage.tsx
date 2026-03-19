import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

const INVITE_TOKEN_KEY = 'mit_nexus_invite_token';

type TokenState = 'checking' | 'valid' | 'invalid' | 'already_used';

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  const [tokenState, setTokenState] = useState<TokenState>('checking');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Validate the token
  useEffect(() => {
    if (!token) {
      setTokenState('invalid');
      return;
    }
    supabase
      .from('invites')
      .select('id, used_by')
      .eq('token', token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setTokenState('invalid');
        } else if (data.used_by !== null) {
          setTokenState('already_used');
        } else {
          setTokenState('valid');
          // Store for post-onboarding processing
          localStorage.setItem(INVITE_TOKEN_KEY, token);
        }
      });
  }, [token]);

  // Handle already-authenticated users
  useEffect(() => {
    if (authLoading || tokenState === 'checking') return;
    if (!user) return;

    if (profile?.onboarded) {
      // Already a member — redirect to dashboard
      navigate('/dashboard');
    } else {
      // Authenticated but not onboarded — send to onboarding
      navigate('/onboard');
    }
  }, [authLoading, user, profile, tokenState, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + '/auth/callback' },
      });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  }

  if (tokenState === 'checking' || authLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1E293B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (tokenState === 'invalid') {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg text-center">
          <CardContent className="py-10 space-y-3">
            <div className="text-4xl">🔗</div>
            <p className="text-brand-navy-light font-semibold text-lg">Invalid invite link</p>
            <p className="text-gray-500 text-sm">
              This invite link doesn't exist or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenState === 'already_used') {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg text-center">
          <CardContent className="py-10 space-y-3">
            <div className="text-4xl">✅</div>
            <p className="text-brand-navy-light font-semibold text-lg">Invite already used</p>
            <p className="text-gray-500 text-sm">
              This invite link has already been claimed.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-brand-gold hover:bg-brand-gold-hover text-white"
            >
              Sign in instead
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-brand-navy-light text-3xl font-bold tracking-tight">
            MIT Nexus
          </CardTitle>
          <p className="text-gray-500 text-sm mt-1">
            You've been invited to join your cohort network.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          {submitted ? (
            <div className="text-center py-6 space-y-2">
              <div className="text-4xl">📬</div>
              <p className="text-brand-navy-light font-semibold text-lg">Check your inbox</p>
              <p className="text-gray-500 text-sm">
                We sent a magic link to{' '}
                <span className="font-medium text-brand-navy-light">{email}</span>. Click it to
                join.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium text-brand-navy-light">
                  MIT email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@mit.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-gray-300 focus:border-[#1E293B]"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button
                type="submit"
                disabled={sending}
                className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white font-semibold"
              >
                {sending ? 'Sending...' : 'Get started'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
