import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#5A5A40] dark:text-[#C8C7B9] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-[#5A5A40] dark:text-[#C8C7B9] shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-[#FAF9F5] dark:bg-[#252622] border-[#E8E4D9] dark:border-[#3D3E37] text-[#2D2D2A] dark:text-[#EAE7E0]',
    error: 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-100',
    info: 'bg-[#FAF9F5] dark:bg-[#252622] border-[#E8E4D9] dark:border-[#3D3E37] text-[#2D2D2A] dark:text-[#EAE7E0]',
  };

  return (
    <div className="fixed top-16 left-4 right-4 z-50 flex justify-center pointer-events-none transition-all duration-300">
      <div
        className={`pointer-events-auto max-w-sm w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md text-sm ${
          bgStyles[toast.type]
        } animate-in fade-in slide-in-from-top-3 duration-200`}
      >
        <div className="flex items-center gap-2.5">
          {icons[toast.type]}
          <p className="font-medium text-right leading-snug">{toast.message}</p>
        </div>
        <button
          onClick={hideToast}
          className="p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
