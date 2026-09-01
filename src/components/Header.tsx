import React from 'react';
import { Flame, Download, Moon, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenInstall?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenInstall }) => {
  const { stats, settings, updateSettings } = useApp();

  const toggleTheme = () => {
    if (!settings) return;
    const next = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: next });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#F5F5F0]/90 dark:bg-[#1C1D1A]/90 backdrop-blur-md border-b border-[#E8E4D9] dark:border-[#3D3E37] transition-colors">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#F0EEE6] dark:bg-[#2A2B26] border border-[#E8E4D9] dark:border-[#3D3E37] flex items-center justify-center text-[#5A5A40] dark:text-[#C8C7B9]">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Islamic Arch icon */}
              <path d="M12 3c-4 4-8 8-8 14a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4c0-6-4-10-8-14z" />
              <path d="M12 3v4" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-xl font-brand-serif text-[#2D2D2A] dark:text-[#EAE7E0] leading-tight">
              قضاء
            </h1>
          </div>
        </div>

        {/* Action badges: Streak & Theme Toggle */}
        <div className="flex items-center gap-2">
          {stats.currentStreak > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0EEE6] dark:bg-[#2A2B26] border border-[#E8E4D9] dark:border-[#3D3E37] text-[#5A5A40] dark:text-[#EAE7E0] text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-[#C97C5D] fill-[#C97C5D]" />
              <span>{stats.currentStreak} أيام</span>
            </div>
          )}

          {onOpenInstall && (
            <button
              onClick={onOpenInstall}
              className="p-1.5 rounded-xl hover:bg-[#EAE7E0] dark:hover:bg-[#2A2B26] text-[#5A5A40] dark:text-[#C8C7B9] transition-colors"
              title="تثبيت التطبيق"
              aria-label="تثبيت التطبيق"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-xl hover:bg-[#EAE7E0] dark:hover:bg-[#2A2B26] text-[#5A5A40] dark:text-[#C8C7B9] transition-colors"
            title="تبديل الوضع الليلي"
            aria-label="تبديل الوضع الليلي"
          >
            {settings?.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#E09578]" />
            ) : (
              <Moon className="w-4 h-4 text-[#5A5A40]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
