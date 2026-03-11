import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';

export default function Landing() {
  const { session, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      navigate('/dashboard');
    }
  }, [session, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await signIn(email);
      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1E293B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-[#1E293B] text-3xl font-bold tracking-tight">
            MIT Nexus
          </CardTitle>
          <p className="text-gray-500 text-sm mt-1">
            Connect with your cohort — find help, learn together, travel smarter.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          {submitted ? (
            <div className="text-center py-6 space-y-2">
              <div className="text-4xl">📬</div>
              <p className="text-[#1E293B] font-semibold text-lg">Check your inbox</p>
              <p className="text-gray-500 text-sm">
                We sent a magic link to <span className="font-medium text-[#1E293B]">{email}</span>.
                Click it to sign in.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium text-[#1E293B]">
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
                className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white font-semibold"
              >
                {sending ? 'Sending...' : 'Send magic link'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
