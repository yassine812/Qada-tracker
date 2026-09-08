import React, { useRef, useState, useEffect } from 'react';
import {
  User, Moon, Sun, Download, Upload, Trash2,
  Settings as SettingsIcon, ChevronLeft, AlertTriangle, ShieldCheck,
  Calculator, Edit3, Smartphone, Bell, BellRing, BellOff, CheckCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EditCountersModal } from '../components/EditCountersModal';
import { RecalculateModal } from '../components/RecalculateModal';
import { InstallModal } from '../components/InstallModal';
import { PageTransition, TactileButton } from '../components/ui/MotionPrimitives';
import { StarEightPoint } from '../components/landing/IslamicOrnaments';
import {
  getPermissionState,
  requestPermission,
  sendTestNotification,
  type NotificationPermissionState,
} from '../services/notificationService';
import { AdhkarCategory } from '../types';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, exportBackup, importBackup, resetAll, adhkarReminders, updateAdhkarReminder, showToast } = useApp();

  const [isEditCountersOpen, setIsEditCountersOpen] = useState(false);
  const [isRecalculateOpen, setIsRecalculateOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [permState, setPermState] = useState<NotificationPermissionState>(() => getPermissionState());
  const [isTestingSend, setIsTestingSend] = useState(false);
  const [testResult, setTestResult] = useState<'sent' | 'failed' | null>(null);

  // Refresh permission state whenever tab becomes visible
  useEffect(() => {
    const refresh = () => setPermState(getPermissionState());
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, []);

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

  const currentTheme = settings?.theme || 'auto';

  return (
    <PageTransition className="space-y-6 pb-24 text-right select-none">
      {/* 1. Header */}
      <div>
        <span className="text-xs uppercase tracking-wider text-[#7E8C7F] dark:text-[#A9B7A3] font-semibold block mb-1">
          التخصيص والبيانات
        </span>
        <h2 className="text-2xl font-bold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">
          الإعدادات والخصوصية
        </h2>
      </div>

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      {/* 2. Theme Selection (Light / Dark / Auto) */}
      <div className="p-5 rounded-3xl bg-white/80 dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7] flex items-center gap-1.5">
          <StarEightPoint size={11} color="#C6A15B" />
          <span>مظهر التطبيق</span>
        </h3>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { id: 'light', label: 'عاجي نهاري', icon: Sun },
            { id: 'dark', label: 'غابة ليلية', icon: Moon },
            { id: 'auto', label: 'تلقائي', icon: Smartphone },
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

      {/* 3. Adhkar Reminder Toggles (independent per collection) */}
      <div className="p-5 rounded-3xl bg-white/80 dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7] flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-[#C6A15B]" />
            <span>تذكيرات الأذكار اليومية</span>
          </h3>

          {/* Permission state badge */}
          {permState === 'granted' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-[9px] text-green-600 dark:text-green-400 font-bold">
              <CheckCircle className="w-3 h-3" />
              إشعارات مفعّلة
            </span>
          )}
          {permState === 'denied' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-[9px] text-red-500 font-bold">
              <BellOff className="w-3 h-3" />
              إشعارات محجوبة
            </span>
          )}
          {permState === 'default' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C6A15B]/10 border border-[#C6A15B]/25 text-[9px] text-[#C6A15B] font-bold">
              <BellRing className="w-3 h-3" />
              في انتظار الإذن
            </span>
          )}
          {permState === 'unsupported' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-500/10 border border-gray-500/25 text-[9px] text-gray-500 font-bold">
              غير مدعوم
            </span>
          )}
        </div>

        {/* Permission request / guidance */}
        {permState === 'default' && (
          <button
            type="button"
            onClick={async () => {
              const state = await requestPermission();
              setPermState(state);
              if (state === 'granted') {
                showToast('تم تفعيل الإشعارات بنجاح ✅', 'success');
              } else {
                showToast('لم يُمنح إذن الإشعارات', 'info');
              }
            }}
            className="w-full py-2.5 rounded-xl bg-[#C6A15B]/15 border border-[#C6A15B]/35 text-[#C6A15B] text-xs font-bold text-center hover:bg-[#C6A15B]/25 transition-colors"
          >
            السماح بالإشعارات
          </button>
        )}
        {permState === 'denied' && (
          <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3] leading-relaxed">
            <strong className="text-red-500 block mb-1">الإشعارات محجوبة من إعدادات المتصفح.</strong>
            لتفعيلها: افتح إعدادات المتصفح ← إعدادات المواقع ← الإشعارات ← ابحث عن هذا الموقع وغيّر الإعداد إلى «سماح».
          </div>
        )}

        <p className="text-[10px] leading-relaxed text-[#7E8C7F] dark:text-[#A9B7A3]">
          يذكّرك التطبيق في وقتك المحدد بكل ورد على حدة. للتذكير داخل المتصفح يُطلب إذن الإشعارات أول مرة — بياناتك كاملة محلية.
        </p>

        {(Object.keys(adhkarReminders) as AdhkarCategory[]).map((category) => {
          const reminder = adhkarReminders[category];
          const meta: Record<AdhkarCategory, { icon: string; title: string; desc: string; defaultTime: string }> = {
            morning: { icon: '🌅', title: 'أذكار الصباح', desc: 'من بعد صلاة الفجر حتى الظهر', defaultTime: '07:00' },
            evening: { icon: '🌇', title: 'أذكار المساء', desc: 'من بعد صلاة العصر حتى المغرب', defaultTime: '17:00' },
            sleep: { icon: '🌙', title: 'أذكار النوم', desc: 'قبل النوم', defaultTime: '22:00' },
          };
          const m = meta[category];

          return (
            <div
              key={category}
              className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-transparent"
              style={reminder.enabled ? { borderColor: 'rgba(198,161,91,0.25)' } : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl shrink-0">{m.icon}</span>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]">
                    {m.title}
                  </span>
                  <span className="block text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3] truncate">
                    {m.desc}
                  </span>
                  {reminder.enabled && (
                    <label className="flex items-center gap-1.5 mt-1.5">
                      <input
                        type="time"
                        value={reminder.time}
                        onChange={async (e) => {
                          if (e.target.value) {
                            await updateAdhkarReminder(category, { ...reminder, time: e.target.value });
                          }
                        }}
                        className="w-[104px] px-2 py-1 rounded-lg bg-white dark:bg-[#18231C] border border-[#C6A15B]/30 text-[11px] text-[#1D211E] dark:text-[#F6F1E7] focus:outline-none focus:border-[#C6A15B]/70"
                      />
                      <span className="text-[10px] text-[#7E8C7F]">وقت التذكير</span>
                    </label>
                  )}
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={reminder.enabled}
                aria-label={`تفعيل تذكير ${m.title}`}
                onClick={async () => {
                  if (!reminder.enabled && permState === 'default') {
                    const state = await requestPermission();
                    setPermState(state);
                    if (state !== 'granted') {
                      showToast('لم يتم الحصول على إذن الإشعارات، سيظهر التذكير داخل التطبيق فقط', 'info');
                    }
                  }
                  await updateAdhkarReminder(category, { ...reminder, enabled: !reminder.enabled });
                }}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                  reminder.enabled ? 'bg-[#C6A15B]' : 'bg-black/15 dark:bg-white/15'
                }`}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                  style={{
                    insetInlineStart: reminder.enabled ? undefined : '2px',
                    insetInlineEnd: reminder.enabled ? '2px' : undefined,
                  }}
                />
              </button>
            </div>
          );
        })}

        {/* Test notification button */}
        {permState === 'granted' && (
          <button
            type="button"
            disabled={isTestingSend}
            onClick={async () => {
              setIsTestingSend(true);
              setTestResult(null);
              const result = await sendTestNotification();
              setIsTestingSend(false);
              setTestResult(result.dispatched ? 'sent' : 'failed');
              setTimeout(() => setTestResult(null), 4000);
            }}
            className="w-full py-2.5 rounded-xl border border-[#C6A15B]/30 text-[#C6A15B] text-xs font-bold text-center hover:bg-[#C6A15B]/10 transition-colors disabled:opacity-50"
          >
            {isTestingSend ? 'جاري الإرسال...' : testResult === 'sent' ? '✅ تم إرسال إشعار تجريبي' : testResult === 'failed' ? '❌ فشل الإرسال' : 'إرسال إشعار تجريبي'}
          </button>
        )}
      </div>

      {/* 4. Prayer Calculations & Counters Adjustment */}
      <div className="p-5 rounded-3xl bg-white/80 dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm space-y-2">
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
                تعديل الأرقام يدوياً
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
                إعادة الحساب التقديري
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
      <div className="p-5 rounded-3xl bg-white/80 dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm space-y-2">
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
                تصدير نسخة احتياطية
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
                استعادة نسخة احتياطية
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
                حذف وتصفير البيانات
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
      <div className="p-4 rounded-2xl bg-[#26352A]/5 dark:bg-[#C6A15B]/5 border border-[#C6A15B]/20 text-center text-xs text-[#7E8C7F] dark:text-[#A9B7A3] space-y-1">
        <p className="font-semibold text-[#1D211E] dark:text-[#F6F1E7]">
          قضاء • تطبيق إسلامي محلي بالكامل
        </p>
        <p className="text-[11px]">
          يعمل بدون خوادم خارجية وبدون إنترنت • بياناتك في أمان تام
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

      <InstallModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
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
