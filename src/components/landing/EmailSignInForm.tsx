import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

interface EmailSignInFormProps {
  variant?: 'hero' | 'cta';
}

export default function EmailSignInForm({ variant = 'hero' }: EmailSignInFormProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email);
      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center gap-3 text-emerald-400 py-4">
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-base font-medium">
          Check your inbox — we sent you a magic link
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-0">
        <input
          type="email"
          placeholder="you@mit.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={`
            w-full px-4 py-3 text-base bg-white/10 text-white placeholder:text-slate-400
            border border-white/20 focus:outline-none focus:border-amber-400
            sm:rounded-l-xl sm:rounded-r-none rounded-xl
            ${variant === 'cta' ? 'bg-white/5' : ''}
          `}
        />
        <button
          type="submit"
          disabled={loading}
          className="
            px-6 py-3 bg-amber-500 hover:bg-amber-600 text-navy font-semibold text-base
            sm:rounded-r-xl sm:rounded-l-none rounded-xl whitespace-nowrap
            transition-colors duration-200 disabled:opacity-70
            text-[#1E293B]
          "
        >
          {loading ? 'Sending...' : 'Get Started'}
        </button>
      </div>
      {error && (
        <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
      )}
    </form>
  );
}
