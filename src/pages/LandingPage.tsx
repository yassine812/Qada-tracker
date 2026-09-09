import React, { useState } from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { PhilosophySection } from '../components/landing/PhilosophySection';
import { FaqSection } from '../components/landing/FaqSection';
import { FinalCtaSection } from '../components/landing/FinalCtaSection';
import { InstallModal } from '../components/InstallModal';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const [isInstallOpen, setIsInstallOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#18231C] text-[#F6F1E7] selection:bg-[#C6A15B]/30 selection:text-[#F6F1E7]">
      {/* 1. Transparent Floating Navigation */}
      <LandingNavbar onStartApp={onEnterApp} />

      <main>
        {/* 2. Fullscreen Video Hero with Left-Anchored Typography */}
        <HeroSection onStartApp={onEnterApp} onInstall={() => setIsInstallOpen(true)} />

        {/* 3. Editorial Ivory Features Section */}
        <FeaturesSection />

        {/* 4. Dark Olive Local-First Philosophy Section */}
        <PhilosophySection />

        {/* 5. Minimalist FAQ Section */}
        <FaqSection />
      </main>

      {/* 6. Emotional Final CTA & Footer */}
      <FinalCtaSection onStartApp={onEnterApp} />
      <InstallModal isOpen={isInstallOpen} onClose={() => setIsInstallOpen(false)} />
    </div>
  );
};
