import React from 'react';
import { Bell, Check, Clock, Sparkles, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatArabicTime } from '../utils/notifications';

export const DailyReminderModal: React.FC = () => {
  const { showReminderDialog, setShowReminderDialog, setActiveTab, settings } = useApp();

  if (!showReminderDialog) return null;

  const handleGoToRecord = () => {
    setShowReminderDialog(false);
    setActiveTab('record');
  };

  const reminderTimeDisplay = settings?.reminderTime
    ? formatArabicTime(settings.reminderTime)
    : 'المحدد';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF9F5] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-[28px] p-6 max-w-sm w-full shadow-2xl relative text-center">
        <button
          onClick={() => setShowReminderDialog(false)}
          className="absolute top-4 left-4 p-2 rounded-full text-[#8E8E80] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon with warm natural badge */}
        <div className="w-16 h-16 rounded-3xl bg-[#5A5A40]/10 dark:bg-[#C8C7B9]/15 text-[#5A5A40] dark:text-[#C8C7B9] flex items-center justify-center mx-auto mb-4 border border-[#E8E4D9] dark:border-[#3D3E37]">
          <Bell className="w-8 h-8 animate-bounce" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F0EEE6] dark:bg-[#1C1D1A] text-[#5A5A40] dark:text-[#C8C7B9] border border-[#E8E4D9] dark:border-[#3D3E37] mb-2">
          <Clock className="w-3.5 h-3.5" />
          <span>تذكير وقت {reminderTimeDisplay}</span>
        </span>

        <h3 className="font-bold text-xl font-brand-serif text-[#2D2D2A] dark:text-[#EAE7E0] mt-1 mb-2">
          موعد تسجيل صلواتك المقضية
        </h3>

        <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] leading-relaxed mb-6">
          تقبل الله طاعاتك. خذ دقيقة لتسجيل ما قضيته من الصلوات اليومية لمواصلة مسيرة القضاء وتحقيق هدفك.
        </p>

        <div className="space-y-2">
          <button
            type="button"
            onClick={handleGoToRecord}
            className="w-full py-3.5 bg-[#5A5A40] hover:bg-[#484833] dark:bg-[#C8C7B9] dark:hover:bg-[#B8B7A8] text-white dark:text-[#1C1D1A] font-bold text-sm rounded-2xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>تسجيل الصلوات الآن</span>
          </button>

          <button
            type="button"
            onClick={() => setShowReminderDialog(false)}
            className="w-full py-2.5 text-[#8E8E80] dark:text-[#A6A699] font-medium text-xs hover:text-[#2D2D2A] dark:hover:text-white transition-colors"
          >
            تذكير لاحقاً
          </button>
        </div>
      </div>
    </div>
  );
};
