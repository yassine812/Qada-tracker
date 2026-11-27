import { FeatureHelp } from '../components/guide/FeatureHelp';
import { AppPageHeader } from '../components/ui/AppPageHeader';
import React, { useRef, useState } from 'react';
import {
  Moon, Sun, Download, Upload, Trash2,
  ChevronLeft, AlertTriangle, ShieldCheck, Calculator, Edit3
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EditCountersModal } from '../components/EditCountersModal';
import { RecalculateModal } from '../components/RecalculateModal';
import { PageTransition, TactileButton } from '../components/ui/MotionPrimitives';
import { StarEightPoint } from '../components/landing/IslamicOrnaments';
import { NotificationSettings } from '../components/NotificationSettings';
import { REPLAY_GUIDE } from '../services/companionFeedback';
import { StreakCard } from '../components/streak/StreakFeatures';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, exportBackup, importBackup, resetAll } = useApp();

  const [isEditCountersOpen, setIsEditCountersOpen] = useState(false);
  const [isRecalculateOpen, setIsRecalculateOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importBackup(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetConfirm = async () => {
    await resetAll();
    setIsResetConfirmOpen(false);
  };

  const currentTheme = settings?.theme === 'dark' ? 'dark' : 'light';

  return (
    <PageTransition className="qada-app-page qada-settings-layout qada-guide-settings pb-24 text-right select-none" data-guide="settings">
      {/* 1. Header */}
      <AppPageHeader symbol="settings" eyebrow="قضاء، على طريقتك" title="الإعدادات والخصوصية" description="المظهر، التذكيرات وبياناتك — خيارات واضحة في مكان واحد." />

      {/* Hidden file input for import */}
      <div className="qada-surface-card lg:col-span-2 p-5 rounded-3xl flex items-center justify-between gap-4">
        <div><h3 className="font-bold">جولة مع رفيق قضاء</h3><p className="text-sm opacity-70 mt-1">تعرّف على أقسام التطبيق خطوة بخطوة.</p></div>
        <button type="button" className="rounded-2xl px-4 py-3 border border-[#C6A15B]/50 font-bold shrink-0" onClick={() => window.dispatchEvent(new Event(REPLAY_GUIDE))}>إعادة الجولة</button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      {/* 2. Theme Selection (Light / Dark / Auto) */}
      <div data-guide="settings" className="qada-surface-card lg:col-span-2 p-5 rounded-3xl bg-white/80 dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7] flex items-center gap-1.5">
          <StarEightPoint size={11} color="#C6A15B" />
          <span>مظهر التطبيق</span>
          <FeatureHelp topic="theme" />
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            { id: 'light', label: 'فاتح', icon: Sun },
            { id: 'dark', label: 'داكن', icon: Moon },
          ].map((th) => {
            const isSelected = currentTheme === th.id;
            const Icon = th.icon;
            return (
              <button
                key={th.id}
                type="button"
                onClick={() => {
                  updateSettings({ theme: th.id as any });
                  if (th.id === 'dark') document.documentElement.classList.add('dark');
                  else if (th.id === 'light') document.documentElement.classList.remove('dark');
                }}
                className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                  isSelected
                    ? 'bg-[#26352A] text-[#F6F1E7] dark:bg-[#C6A15B] dark:text-[#18231C] shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 text-[#7E8C7F] dark:text-[#A9B7A3] hover:bg-black/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{th.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <NotificationSettings />

      <section className="lg:col-span-2" aria-label="الاستمرارية اليومية">
        <StreakCard profile />
      </section>

      {/* 4. Prayer Calculations & Counters Adjustment */}
      <div data-help="calculations" className="qada-surface-card lg:col-span-2 p-5 rounded-3xl bg-white/80 dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm space-y-2">
        <h3 className="text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7] flex items-center gap-1.5 mb-2">
          <StarEightPoint size={11} color="#C6A15B" />
          <span>حساب وتعديل الصلوات</span>
        </h3>

        <button
          type="button"
          onClick={() => setIsEditCountersOpen(true)}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Edit3 className="w-4 h-4 text-[#C6A15B]" />
            <div className="text-right">
              <span className="text-sm font-bold text-[#1D211E] dark:text-[#F6F1E7] block">
                تعديل الأرقام يدوياً <FeatureHelp topic="manual" />
              </span>
              <span className="text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                ضبط أعداد الصلوات المتبقية بدقة
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-[#7E8C7F] dark:text-[#A9B7A3]" />
        </button>

        <div className="border-t border-black/5 dark:border-white/5 my-1" />

        <button
          type="button"
          onClick={() => setIsRecalculateOpen(true)}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Calculator className="w-4 h-4 text-[#C6A15B]" />
            <div className="text-right">
              <span className="text-sm font-bold text-[#1D211E] dark:text-[#F6F1E7] block">
                إعادة الحساب التقديري <FeatureHelp topic="recalculate" />
              </span>
              <span className="text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                تحديث عمر البلوغ وسنوات الفوات
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-[#7E8C7F] dark:text-[#A9B7A3]" />
        </button>
      </div>

      {/* 4. Local Data Management (Backup, Restore, Reset) */}
      <div data-help="data" className="qada-surface-card lg:col-span-2 p-5 rounded-3xl bg-white/80 dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm space-y-2">
        <h3 className="text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7] flex items-center gap-1.5 mb-2">
          <ShieldCheck className="w-4 h-4 text-[#C6A15B]" />
          <span>البيانات والنسخ الاحتياطي</span>
        </h3>

        <button
          type="button"
          onClick={exportBackup}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Download className="w-4 h-4 text-[#C6A15B]" />
            <div className="text-right">
              <span className="text-sm font-bold text-[#1D211E] dark:text-[#F6F1E7] block">
                تصدير نسخة احتياطية <FeatureHelp topic="backup" />
              </span>
              <span className="text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                حفظ سجلاتك في ملف JSON محلي
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-[#7E8C7F] dark:text-[#A9B7A3]" />
        </button>

        <div className="border-t border-black/5 dark:border-white/5 my-1" />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Upload className="w-4 h-4 text-[#C6A15B]" />
            <div className="text-right">
              <span className="text-sm font-bold text-[#1D211E] dark:text-[#F6F1E7] block">
                استعادة نسخة احتياطية <FeatureHelp topic="restore" />
              </span>
              <span className="text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                تحميل بياناتك من ملف سابق
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-[#7E8C7F] dark:text-[#A9B7A3]" />
        </button>

        <div className="border-t border-black/5 dark:border-white/5 my-1" />

        <button
          type="button"
          onClick={() => setIsResetConfirmOpen(true)}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-[#9E3A3A]/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Trash2 className="w-4 h-4 text-[#9E3A3A]" />
            <div className="text-right">
              <span className="text-sm font-bold text-[#9E3A3A] block">
                حذف وتصفير البيانات <FeatureHelp topic="reset" />
              </span>
              <span className="text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                مسح السجلات المخزنة على هذا الجهاز
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-[#7E8C7F] dark:text-[#A9B7A3]" />
        </button>
      </div>

      {/* 5. Privacy Notice Footer */}
      <div className="lg:col-span-2 p-4 rounded-2xl bg-[#26352A]/5 dark:bg-[#C6A15B]/5 border border-[#C6A15B]/20 text-center text-xs text-[#7E8C7F] dark:text-[#A9B7A3] space-y-1">
        <p className="font-semibold text-[#1D211E] dark:text-[#F6F1E7]">
          قضاء • سجلاتك محفوظة على جهازك
        </p>
        <p className="text-[11px]">
          تتبّع عباداتك واقرأ القرآن دون اتصال بعد التجهيز الأول • الصوت والتفسير الجديد يحتاجان إلى الإنترنت
        </p>
      </div>

      {/* Modals */}
      <EditCountersModal
        isOpen={isEditCountersOpen}
        onClose={() => setIsEditCountersOpen(false)}
      />

      <RecalculateModal
        isOpen={isRecalculateOpen}
        onClose={() => setIsRecalculateOpen(false)}
      />

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="rounded-3xl p-6 max-w-sm w-full bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/30 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#9E3A3A]/15 text-[#9E3A3A] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">
                تأكيد حذف البيانات
              </h3>
              <p className="text-xs text-[#7E8C7F] dark:text-[#A9B7A3] mt-1 leading-relaxed">
                هل أنت متأكد من رغبتك في مسح كافة السجلات؟ هذا الإجراء محلي ولا يمكن التراجع عنه إلا بوجود نسخة احتياطية.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <TactileButton
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-3 rounded-2xl bg-black/5 dark:bg-white/5 font-semibold text-xs text-[#1D211E] dark:text-[#F6F1E7]"
              >
                إلغاء
              </TactileButton>
              <TactileButton
                onClick={handleResetConfirm}
                className="flex-1 py-3 rounded-2xl bg-[#9E3A3A] font-semibold text-xs text-white shadow-sm"
              >
                تأكيد الحذف
              </TactileButton>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
};
