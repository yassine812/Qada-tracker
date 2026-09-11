import React from 'react';
import { Moon, Sun, Flame, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StarEightPoint } from './landing/IslamicOrnaments';
import { usePwaInstall } from '../context/PwaInstallContext';
export const Header: React.FC = () => {
  const { settings, updateSettings, stats } = useApp();
  const { canInstall, promptInstall } = usePwaInstall();

  const isDark =
    settings?.theme === 'dark' ||
    (settings?.theme === 'auto' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    if (!settings) return;
    const next = isDark ? 'light' : 'dark';
    updateSettings({ theme: next });
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const goToLanding = () => {
    try {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      window.location.href = '/';
    }
  };

  return (
    <header
      className="fixed top-0 inset-x-0 z-40 backdrop-blur-xl border-b transition-colors duration-300"
      style={{
        background: isDark ? 'rgba(24, 35, 28, 0.85)' : 'rgba(250, 247, 242, 0.88)',
        borderColor: 'var(--qada-border)',
      }}
      dir="rtl"
    >
      <div className="max-w-md md:max-w-3xl lg:max-w-6xl mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
        {/* Right (start in RTL): Brand Identity matching landing page */}
        <button
          type="button"
          onClick={goToLanding}
          className="flex items-center gap-2 group cursor-pointer"
          title="العودة للصفحة الرئيسية"
        >
          <div className="w-8 h-8 rounded-lg bg-[#26352A]/10 dark:bg-[#C6A15B]/15 border border-[#C6A15B]/30 flex items-center justify-center text-[#C6A15B] transition-transform group-hover:scale-105">
            <StarEightPoint size={14} color="#C6A15B" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-lg font-landing-display tracking-tight text-[#1D211E] dark:text-[#F6F1E7]">
              قضاء
            </span>
            <span className="text-[9px] uppercase tracking-widest text-[#7E8C7F] dark:text-[#A9B7A3] font-mono">
              QADA
            </span>
          </div>
        </button>

        {/* Left (end in RTL): Controls & Streak badge */}
        <div className="flex items-center gap-2">
          {canInstall && (
            <button type="button" onClick={() => { void promptInstall(); }} aria-label="تثبيت التطبيق"
              title="تثبيت التطبيق" className="w-9 h-9 rounded-lg flex items-center justify-center text-[#526055] dark:text-[#A9B7A3] hover:bg-black/5 dark:hover:bg-white/5">
              <Download className="w-4 h-4" />
            </button>
          )}
          {/* Streak indicator if user has an active streak */}
          {stats && stats.currentStreak > 0 && (
            <div
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(198, 161, 91, 0.15)',
                color: 'var(--qada-accent)',
                border: '1px solid rgba(198, 161, 91, 0.25)',
              }}
              title={`أيام الالتزام المتتالية: ${stats.currentStreak}`}
            >
              <Flame className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>{stats.currentStreak}</span>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-[#526055] dark:text-[#A9B7A3] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            title={isDark ? 'تبديل إلى المظهر النهاري' : 'تبديل إلى المظهر الليلي'}
            aria-label="تبديل المظهر"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#C6A15B]" /> : <Moon className="w-4 h-4" />}
          </button>

        </div>
      </div>
    </header>
  );
};
