import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import HeroSection from '@/components/landing/HeroSection';
import MITBuildingSection from '@/components/landing/MITBuildingSection';
import StatsBar from '@/components/landing/StatsBar';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import QuoteSection from '@/components/landing/QuoteSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import LandingFooter from '@/components/landing/LandingFooter';

export default function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) {
      navigate('/dashboard');
    }
  }, [session, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F172A' }}>
        <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (session) return null;

  return (
    <div className="font-sans" style={{ scrollBehavior: 'smooth' }}>
      <HeroSection />
      <MITBuildingSection />
      <StatsBar />
      <FeaturesSection />
      <HowItWorksSection />
      <QuoteSection />
      <FinalCTASection />
      <LandingFooter />
    </div>
  );
}
