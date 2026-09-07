import React from 'react';
import { Home, BookOpen, Moon, Settings, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { TabType } from '../types';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  const navItems: {
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: Home },
    { id: 'ibadat', label: 'العبادات', icon: Flame },
    { id: 'quran', label: 'القرآن', icon: BookOpen },
    { id: 'dhikr', label: 'الأذكار', icon: Moon },
    { id: 'settings', label: 'المزيد', icon: Settings },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl border-t transition-colors duration-300"
      style={{
        background: 'rgba(var(--qada-bg), 0.85)',
        borderColor: 'var(--qada-border)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
      }}
      dir="rtl"
    >
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              whileTap={{ scale: 0.9 }}
              className="relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl min-w-[56px] min-h-[48px] cursor-pointer select-none transition-colors"
              aria-label={item.label}
              aria-selected={isActive}
            >
              {/* Animated Sliding Indicator Pill */}
              {isActive && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: 'var(--qada-primary-soft)',
                    border: '1px solid rgba(198, 161, 91, 0.25)',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icon & Label */}
              <div
                className="relative z-10 flex flex-col items-center gap-1 transition-colors duration-200"
                style={{
                  color: isActive ? 'var(--qada-accent)' : 'var(--qada-text-muted)',
                }}
              >
                <Icon
                  className="w-5 h-5 transition-transform duration-200"
                  style={{
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    strokeWidth: isActive ? 2.2 : 1.6,
                  }}
                />
                <span
                  className="text-[11px] leading-none font-landing-display tracking-tight transition-all duration-200"
                  style={{
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--qada-text)' : 'var(--qada-text-muted)',
                  }}
                >
                  {item.label}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
