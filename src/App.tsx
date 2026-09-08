import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { PwaInstallProvider } from './context/PwaInstallContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Toast } from './components/Toast';
import { InstallModal } from './components/InstallModal';
import { DailyReminderModal } from './components/DailyReminderModal';
import { IslamicGeometricBg } from './components/IslamicGeometricBg';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { IbadatPage } from './pages/IbadatPage';
import { QuranPage } from './pages/QuranPage';
import { DhikrPage } from './pages/DhikrPage';
import { SettingsPage } from './pages/SettingsPage';
import { LandingPage } from './pages/LandingPage';

const MainAppContent: React.FC = () => {
  const { settings, loading, activeTab, setActiveTab } = useApp();
  const [isInstallOpen, setIsInstallOpen] = useState(false);

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-center p-4 anim-fade-in"
        style={{ background: 'var(--qada-bg)' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-pulse"
          style={{ background: 'var(--qada-primary-soft)', color: 'var(--qada-primary)' }}
        >
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3c-4 4-8 8-8 14a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4c0-6-4-10-8-14z" />
            <path d="M12 3v4" />
          </svg>
        </div>
        <h2
          className="font-bold text-2xl font-brand-serif"
          style={{ color: 'var(--qada-text)' }}
        >
          قضاء
        </h2>
        <p
          className="text-xs mt-1"
          style={{ color: 'var(--qada-text-muted)' }}
        >
          جاري تحميل البيانات...
        </p>
      </div>
    );
  }

  if (!settings || !settings.hasCompletedOnboarding) {
    return <OnboardingPage />;
  }

  return (
    <div
      className="min-h-screen flex flex-col relative pb-20"
      style={{ background: 'var(--qada-bg)', color: 'var(--qada-text)' }}
    >
      <IslamicGeometricBg />

      <Header onOpenInstall={() => setIsInstallOpen(true)} />

      <main className={`relative z-10 flex-grow pt-16 px-3 sm:px-4 mx-auto w-full transition-all duration-300 ${activeTab === 'quran' ? 'max-w-3xl' : 'max-w-md'}`}>
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'ibadat' && <IbadatPage />}
        {activeTab === 'quran' && <QuranPage />}
        {activeTab === 'dhikr' && <DhikrPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      <Navigation currentTab={activeTab} onSelectTab={setActiveTab} />

      <Toast />
      <DailyReminderModal />
      <InstallModal isOpen={isInstallOpen} onClose={() => setIsInstallOpen(false)} />
    </div>
  );
};

const RootViewRouter: React.FC = () => {
  // Check if current URL is /app or has parameter ?app=true
  const checkIsAppPath = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;
    return path.startsWith('/app') || search.includes('app=true') || search.includes('view=app') || hash === '#/app';
  };

  const [currentView, setCurrentView] = useState<'landing' | 'app'>(() => {
    return checkIsAppPath() ? 'app' : 'landing';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(checkIsAppPath() ? 'app' : 'landing');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleEnterApp = useCallback(() => {
    try {
      window.history.pushState(null, '', '/app');
    } catch {
      // Fallback in case of sandboxed iframe
      window.location.hash = '#/app';
    }
    setCurrentView('app');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  if (currentView === 'landing') {
    return <LandingPage onEnterApp={handleEnterApp} />;
  }

  return <MainAppContent />;
};

export default function App() {
  return (
    <PwaInstallProvider>
      <AppProvider>
        <RootViewRouter />
      </AppProvider>
    </PwaInstallProvider>
  );
}

