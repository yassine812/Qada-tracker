import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Toast } from './components/Toast';
import { InstallModal } from './components/InstallModal';
import { DailyReminderModal } from './components/DailyReminderModal';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { RecordPage } from './pages/RecordPage';
import { HistoryPage } from './pages/HistoryPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { SettingsPage } from './pages/SettingsPage';

const MainAppContent: React.FC = () => {
  const { settings, loading, activeTab, setActiveTab } = useApp();
  const [isInstallOpen, setIsInstallOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#1C1D1A] flex flex-col items-center justify-center text-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-[#5A5A40]/10 dark:bg-[#C8C7B9]/15 text-[#5A5A40] dark:text-[#C8C7B9] flex items-center justify-center animate-pulse mb-3">
          <svg
            className="w-8 h-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3c-4 4-8 8-8 14a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4c0-6-4-10-8-14z" />
            <path d="M12 3v4" />
          </svg>
        </div>
        <h2 className="font-bold text-2xl font-brand-serif text-[#2D2D2A] dark:text-[#EAE7E0]">قضاء</h2>
        <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mt-1">
          جاري تحميل البيانات المحلية...
        </p>
      </div>
    );
  }

  // Show Onboarding if not completed yet
  if (!settings || !settings.hasCompletedOnboarding) {
    return <OnboardingPage />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#1C1D1A] text-[#2D2D2A] dark:text-[#EAE7E0] flex flex-col relative pb-20 selection:bg-[#D1CDC2] selection:text-[#2D2D2A]">
      {/* Background ambient natural warmth */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#EAE7E0] dark:from-[#2A2B26]/30 via-transparent to-transparent opacity-60" />

      {/* Fixed Top Header */}
      <Header onOpenInstall={() => setIsInstallOpen(true)} />

      {/* Main Content Area */}
      <main className="relative z-10 flex-grow pt-16 px-4 max-w-md mx-auto w-full">
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'record' && <RecordPage />}
        {activeTab === 'history' && <HistoryPage />}
        {activeTab === 'statistics' && <StatisticsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      {/* Fixed Bottom Navigation */}
      <Navigation currentTab={activeTab} onSelectTab={setActiveTab} />

      {/* Toast Notification */}
      <Toast />

      {/* Daily Reminder Trigger Modal */}
      <DailyReminderModal />

      {/* PWA Install Guide Modal */}
      <InstallModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
