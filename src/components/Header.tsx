import { FeatureHelp } from './guide/FeatureHelp';
import React, { useEffect, useRef, useState } from 'react';
import { Moon, Sun, Flame, UserRound, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authClient } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { QadaLogo } from './QadaLogo';
import { InstallButton } from './InstallButton';
export const Header: React.FC = () => {
  const { settings, updateSettings, stats } = useApp();
  const { session } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) setAccountMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setAccountMenuOpen(false); };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const signOut = async () => {
    setAccountMenuOpen(false);
    if (authClient) await authClient.auth.signOut();
    window.location.assign('/account');
  };

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
      className="qada-app-header fixed top-0 inset-x-0 z-40 backdrop-blur-xl border-b transition-colors duration-300"
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
          <QadaLogo width={78} className="text-[#285543] dark:text-[#D5B77A]" />
        </button>

        {/* Left (end in RTL): Controls & Streak badge */}
        <div className="flex items-center gap-2">
          <div ref={accountMenuRef} className="relative">
            <button
              type="button"
              aria-label="قائمة الحساب"
              aria-expanded={accountMenuOpen}
              title="قائمة الحساب"
              onClick={() => setAccountMenuOpen(open => !open)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#526055] dark:text-[#A9B7A3] hover:bg-black/5 dark:hover:bg-white/5"
            >
              <UserRound className="h-4 w-4" />
            </button>
            {accountMenuOpen && (
              <div role="menu" className="absolute left-0 top-[calc(100%+0.5rem)] z-50 min-w-44 overflow-hidden rounded-2xl border border-[#C6A15B]/30 bg-[#F6F1E7] p-1 text-right shadow-xl dark:bg-[#1F2E24]">
                <a role="menuitem" href="/profile" onClick={() => setAccountMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold text-[#1D211E] hover:bg-black/5 dark:text-[#F6F1E7] dark:hover:bg-white/5">الملف الشخصي</a>
                {session ? (
                  <button role="menuitem" type="button" onClick={signOut} className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-[#9E3A3A] hover:bg-[#9E3A3A]/10">
                    <LogOut className="h-4 w-4" />
                    تسجيل الخروج
                  </button>
                ) : (
                  <a role="menuitem" href="/account" onClick={() => setAccountMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold text-[#1D211E] hover:bg-black/5 dark:text-[#F6F1E7] dark:hover:bg-white/5">تسجيل الدخول</a>
                )}
              </div>
            )}
          </div>
          <InstallButton className="min-h-9 px-2 rounded-lg text-xs text-[#526055] dark:text-[#A9B7A3] bg-black/5 dark:bg-white/5" />
          <FeatureHelp topic="navigation" />
          {/* Streak indicator if user has an active streak */}
          {stats && stats.currentStreak > 0 && (
            <div
              className="hidden min-[400px]:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
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
