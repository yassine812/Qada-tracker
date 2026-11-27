import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Toast } from './components/Toast';
import { IslamicGeometricBg } from './components/IslamicGeometricBg';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { IbadatPage } from './pages/IbadatPage';
import { QuranPage } from './pages/QuranPage';
import { DhikrPage } from './pages/DhikrPage';
import { SettingsPage } from './pages/SettingsPage';
import { LandingPage } from './pages/LandingPage';
import { InfoPage } from './pages/InfoPage';
import { AdSlot } from './components/AdSlot';
import { PwaInstallProvider } from './context/PwaInstallContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccountPage } from './pages/AccountPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationSettings } from './components/NotificationSettings';
import { QadaCompanion } from './components/QadaCompanion';
import { QadaGuide } from './components/QadaGuide';
import { AppWelcome } from './components/AppWelcome';
import { FeatureHelpHost } from './components/guide/FeatureHelp';
import { MotionConfig } from 'motion/react';
import { StreakProvider } from './context/StreakContext';
import { AchievementCelebration } from './components/streak/StreakFeatures';
import { AppStreakExperience } from './components/streak/AppStreakExperience';
import { hasSeenLaunchPrompt, markLaunchPromptSeen } from './services/startupState';
import './app-unified.css';
import './app-pages.css';

const INFO_PATHS = new Set(['/about', '/privacy', '/guides', '/guides/offline', '/guides/backup']);

const MainAppContent: React.FC<{ welcomeVisible: boolean }> = ({ welcomeVisible }) => {
  const { settings, loading, activeTab, setActiveTab } = useApp();
  if (loading) return null;

  if (window.location.pathname === '/app/notifications') {
    return <div className="qada-experience qada-notifications-page min-h-screen pt-20 pb-12 px-3" style={{ background: 'var(--qada-bg)', color: 'var(--qada-text)' }}>
      <Header />
      <main className="qada-help-content max-w-4xl mx-auto space-y-4"><a href="/app" className="block text-right">العودة إلى التطبيق ←</a><NotificationSettings /></main>
      <FeatureHelpHost />
    </div>;
  }

  if (!settings || !settings.hasCompletedOnboarding) {
    return <OnboardingPage />;
  }

  return (
    <MotionConfig reducedMotion="user"><div
      className={`qada-experience min-h-screen flex flex-col relative ${activeTab === 'quran' ? 'qada-reading-mode' : 'pb-20'}`}
      style={{ background: 'var(--qada-bg)', color: 'var(--qada-text)' }}
    >
      <IslamicGeometricBg />

      {activeTab !== 'quran' && <Header />}

      <main className={activeTab === 'quran' ? 'qada-reader-main relative z-10 w-full' : 'relative z-10 flex-grow pt-16 px-3 sm:px-4 lg:px-8 mx-auto w-full max-w-md md:max-w-3xl lg:max-w-6xl'}>
        {activeTab !== 'quran' && <QadaCompanion />}
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'ibadat' && <IbadatPage />}
        {activeTab === 'quran' && <QuranPage />}
        {activeTab === 'dhikr' && <DhikrPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      <Navigation currentTab={activeTab} onSelectTab={setActiveTab} />

      <Toast />
      {!welcomeVisible && <><QadaGuide />{settings.hasSeenAppGuide && <AppStreakExperience />}</>}
      <FeatureHelpHost />
    </div></MotionConfig>
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
  const { session, loading: authLoading } = useAuth();
  const { loading: dataLoading } = useApp();
  const [welcomeDismissed, setWelcomeDismissed] = useState(() => hasSeenLaunchPrompt('welcome'));
  const [welcomeComplete, setWelcomeComplete] = useState(() => hasSeenLaunchPrompt('welcome'));
  const finishWelcome = useCallback(() => { markLaunchPromptSeen('welcome'); setWelcomeDismissed(true); }, []);
  const appReady = !authLoading && (!session || !dataLoading);

  // Greet immediately while the session and saved records restore behind it.
  // Once dismissed, background synchronization must never replay the greeting.
  useEffect(() => {
    if (welcomeDismissed && appReady) setWelcomeComplete(true);
  }, [welcomeDismissed, appReady]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(checkIsAppPath() ? 'app' : 'landing');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleEnterApp = useCallback(() => {
    const destination = session ? '/app' : '/account?mode=login';
    try {
      window.history.pushState(null, '', destination);
    } catch {
      // Fallback in case of sandboxed iframe
      window.location.hash = destination;
    }
    window.location.reload();
  }, [session]);

  if (currentView === 'landing') {
    return <LandingPage onEnterApp={handleEnterApp} />;
  }

  return <>
    {appReady && (session ? <MainAppContent welcomeVisible={!welcomeComplete} /> : <AccountPage />)}
    {!welcomeComplete && <AppWelcome onComplete={finishWelcome} />}
  </>;
};

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname.replace(/\/$/, '') || '/');
  useEffect(() => {
    // Portaled dialogs and account/profile routes share the application theme.
    const appRoute = path.startsWith('/app') || path === '/profile' || path === '/account';
    document.documentElement.classList.toggle('qada-app-theme', appRoute);
    return () => document.documentElement.classList.remove('qada-app-theme');
  }, [path]);
  useEffect(() => {
    const update = () => setPath(window.location.pathname.replace(/\/$/, '') || '/');
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);

  // Public content does not mount the provider that reads personal prayer records.
  // Links between these documents and /app use full navigation, clearing ad scripts.
  if (INFO_PATHS.has(path)) {
    return <InfoPage path={path}><AdSlot /></InfoPage>;
  }
  if (path === '/account') return <AuthProvider><AccountPage /></AuthProvider>;
  if (path === '/profile') return <AuthProvider><PwaInstallProvider><StreakProvider><AppProvider><ProfilePage /><AchievementCelebration /></AppProvider></StreakProvider></PwaInstallProvider></AuthProvider>;
  return (
    <AuthProvider>
    <PwaInstallProvider>
      <StreakProvider>
      <AppProvider>
        <RootViewRouter />
      </AppProvider>
      </StreakProvider>
    </PwaInstallProvider>
    </AuthProvider>
  );
}
