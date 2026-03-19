import { ChevronDown } from 'lucide-react';
import EmailSignInForm from './EmailSignInForm';

export default function HeroSection() {
  const handleScrollDown = () => {
    const statsSection = document.getElementById('stats');
    statsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 md:px-8"
      style={{ background: 'linear-gradient(to bottom, #0F172A, #1E293B)' }}
    >
      <div className="max-w-6xl mx-auto w-full flex flex-col items-center gap-6">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-slate-700 text-slate-400 text-xs uppercase tracking-widest">
          MIT Professional Education · Innovation Leadership 2026
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight max-w-4xl">
          Find your{' '}
          <em className="not-italic italic text-amber-400">people</em>{' '}
          in the cohort
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl font-light text-slate-400 max-w-2xl leading-relaxed">
          A networking app for 144 leaders. Discover who knows what, who's traveling where, and who you should meet this week.
        </p>

        {/* Email form */}
        <div className="w-full max-w-md mt-2">
          <EmailSignInForm variant="hero" />
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={handleScrollDown}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-500 animate-bounce"
        aria-label="Scroll down"
      >
        <ChevronDown className="w-6 h-6" />
      </button>
    </section>
  );
}
