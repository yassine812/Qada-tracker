import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useApp();
  if (!toast) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--qada-success)' }} />,
    error: <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--qada-error)' }} />,
    info: <Info className="w-4 h-4 shrink-0" style={{ color: 'var(--qada-primary)' }} />,
  };

  return (
    <div className="fixed top-16 left-3 right-3 z-50 flex justify-center pointer-events-none anim-fade-slide-up">
      <div
        className="pointer-events-auto max-w-sm w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl glass-panel"
        style={{ boxShadow: 'var(--qada-shadow-lg)' }}
      >
        <div className="flex items-center gap-2.5">
          {iconMap[toast.type]}
          <p className="font-medium text-right leading-snug text-sm" style={{ color: 'var(--qada-text)' }}>
            {toast.message}
          </p>
        </div>
        <button
          onClick={hideToast}
          className="p-1 rounded transition-opacity opacity-50 hover:opacity-100"
          style={{ color: 'var(--qada-text-muted)' }}
          aria-label="إغلاق"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
