import React from 'react';
import { Home, Edit3, History, BarChart2, Settings } from 'lucide-react';
import { TabType } from '../types';
import { useApp } from '../context/AppContext';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  const { settings } = useApp();

  const navItems: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: Home },
    { id: 'record', label: 'التسجيل', icon: Edit3 },
    { id: 'history', label: 'السجل', icon: History },
    { id: 'statistics', label: 'الإحصائيات', icon: BarChart2 },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF9F5]/90 dark:bg-[#1C1D1A]/90 backdrop-blur-xl border-t border-[#E8E4D9] dark:border-[#3D3E37] shadow-[0_-4px_20px_rgba(90,90,64,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 min-w-[56px] ${
                isActive
                  ? 'text-[#5A5A40] dark:text-[#C8C7B9] font-semibold scale-100'
                  : 'text-[#8E8E80] dark:text-[#A6A699] opacity-75 hover:opacity-100 hover:text-[#5A5A40] dark:hover:text-[#C8C7B9]'
              }`}
              style={{ minHeight: '48px' }}
            >
              <div className="relative flex flex-col items-center">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.7]'}`} />
                {/* Active indicator dot */}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5A5A40] dark:bg-[#C8C7B9] mt-1 transition-all" />
                )}
              </div>
              <span className={`text-[11px] mt-0.5 leading-tight ${isActive ? 'font-bold' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
