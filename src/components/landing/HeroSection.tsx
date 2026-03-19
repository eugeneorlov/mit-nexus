import { ChevronDown } from 'lucide-react';
import EmailSignInForm from './EmailSignInForm';

export default function HeroSection() {
  const handleScrollDown = () => {
    const statsSection = document.getElementById('stats');
    statsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 md:px-8"
      style={{ background: 'linear-gradient(to bottom, #080E1A, #0F172A)' }}
    >
      <div className="max-w-6xl mx-auto w-full flex flex-col items-center gap-6">
        {/* Eyebrow badge */}
        <div
          className="inline-flex items-center px-5 py-2 rounded-full text-slate-400 text-xs uppercase tracking-[0.2em]"
          style={{
            border: '1px solid rgba(163, 31, 52, 0.4)',
            backgroundColor: 'rgba(163, 31, 52, 0.08)',
          }}
        >
          MIT PROFESSIONAL EDUCATION · CXO COHORT 2026
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight max-w-4xl mt-8">
          Find your{' '}
          <em className="italic text-brand-gold">people</em>{' '}
          in the cohort
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl font-light text-slate-400 max-w-2xl leading-relaxed mt-6">
          A private network for 144 leaders. Discover who knows what, who's traveling where, and who you should meet this week.
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
