import React, { useRef, useState, useEffect } from 'react';
import {
  User,
  Calculator,
  Edit3,
  Moon,
  Volume2,
  Vibrate,
  Download,
  Upload,
  Trash2,
  Info,
  ChevronLeft,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  Bell,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EditCountersModal } from '../components/EditCountersModal';
import { RecalculateModal } from '../components/RecalculateModal';
import { InstallModal } from '../components/InstallModal';
import {
  formatArabicTime,
  getNotificationPermission,
  requestNotificationPermission,
  triggerTestReminder,
  NotificationPermissionState,
} from '../utils/notifications';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, exportBackup, importBackup, resetAll, showToast } = useApp();

  const [isEditCountersOpen, setIsEditCountersOpen] = useState(false);
  const [isRecalculateOpen, setIsRecalculateOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [permState, setPermState] = useState<NotificationPermissionState>('default');
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPermState(getNotificationPermission());
  }, []);

  const handleToggleReminder = async () => {
    const nextState = !settings?.reminderEnabled;
    if (nextState) {
      // Request permission if not yet granted
      const granted = await requestNotificationPermission();
      const currentPerm = getNotificationPermission();
      setPermState(currentPerm);

      await updateSettings({
        reminderEnabled: true,
        reminderTime: settings?.reminderTime || '21:00',
      });

      if (granted) {
        showToast('تم تفعيل التنبيه اليومي وإذن الإشعارات', 'success');
      } else {
        showToast('تم تفعيل التنبيه اليومي داخل التطبيق', 'info');
      }
    } else {
      await updateSettings({ reminderEnabled: false });
      showToast('تم إيقاف التنبيه اليومي', 'info');
    }
  };

  const handleTimeChange = async (newTime: string) => {
    if (!newTime) return;
    await updateSettings({ reminderTime: newTime });
    showToast(`تم تعيين وقت التنبيه إلى ${formatArabicTime(newTime)}`, 'success');
  };

  const handleTestReminder = async () => {
    setIsTestingNotification(true);
    const res = await triggerTestReminder(settings?.soundEnabled, settings?.hapticsEnabled);
    setIsTestingNotification(false);
    if (res.browserNotified) {
      showToast('تم إرسال التنبيه التجريبي بنجاح عبر النظام 🔔', 'success');
    } else {
      showToast('تم تشغيل التنبيه التجريبي داخل التطبيق 🔔', 'info');
    }
  };

  const handleRequestPermissionAgain = async () => {
    const granted = await requestNotificationPermission();
    setPermState(getNotificationPermission());
    if (granted) {
      showToast('تم منح إذن إشعارات النظام بنجاح', 'success');
    } else {
      showToast('يرجى تمكين الإشعارات من إعدادات المتصفح/الهاتف', 'info');
    }
  };

  const reminderPresets = [
    { label: 'بعد الفجر', time: '06:00', icon: '🌅' },
    { label: 'بعد العصر', time: '16:30', icon: '☀️' },
    { label: 'بعد المغرب', time: '19:30', icon: '🌙' },
    { label: 'بعد العشاء', time: '21:00', icon: '⭐️' },
    { label: 'قبل النوم', time: '22:30', icon: '🛏️' },
  ];

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

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <div className="px-1">
        <h2 className="font-bold text-xl text-[#2D2D2A] dark:text-[#EAE7E0]">
          الإعدادات
        </h2>
        <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mt-0.5">
          إدارة الحساب، تخصيص التطبيق، والنسخ الاحتياطي
        </p>
      </div>

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      {/* GROUP 1: ACCOUNT & PRAYER DATA */}
      <section className="bg-[#FAF9F5] dark:bg-[#252622] rounded-[28px] p-5 border border-[#E8E4D9] dark:border-[#3D3E37] space-y-1 shadow-[0_4px_16px_rgba(90,90,64,0.04)]">
        <h3 className="text-xs font-bold text-[#5A5A40] dark:text-[#C8C7B9] uppercase tracking-wider mb-2">
          الحساب والبيانات
        </h3>

        <button
          type="button"
          onClick={() => setIsRecalculateOpen(true)}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-[#F0EEE6] dark:hover:bg-[#1C1D1A] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F0EEE6] dark:bg-[#1C1D1A] text-[#5A5A40] dark:text-[#C8C7B9] flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="text-right">
              <span className="font-semibold text-sm text-[#2D2D2A] dark:text-[#EAE7E0] block">
                إعادة حساب الصلوات
              </span>
              <span className="text-[11px] text-[#8E8E80] dark:text-[#A6A699]">
                تعديل العمر وسن البلوغ ونسبة الالتزام
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-[#8E8E80] dark:text-[#A6A699] group-hover:text-[#5A5A40] dark:group-hover:text-[#C8C7B9] transition-colors" />
        </button>

        <div className="h-px bg-[#E8E4D9] dark:bg-[#3D3E37] my-1" />

        <button
          type="button"
          onClick={() => setIsEditCountersOpen(true)}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-[#F0EEE6] dark:hover:bg-[#1C1D1A] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F0EEE6] dark:bg-[#1C1D1A] text-[#5A5A40] dark:text-[#C8C7B9] flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div className="text-right">
              <span className="font-semibold text-sm text-[#2D2D2A] dark:text-[#EAE7E0] block">
                تعديل العدد يدوياً
              </span>
              <span className="text-[11px] text-[#8E8E80] dark:text-[#A6A699]">
                تغيير العدد المتبقي لأي صلاة مباشرة
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-[#8E8E80] dark:text-[#A6A699] group-hover:text-[#5A5A40] dark:group-hover:text-[#C8C7B9] transition-colors" />
        </button>
      </section>

      {/* GROUP 2: DAILY REMINDER (التنبيه اليومي لتسجيل الصلوات) */}
      <section className="bg-[#FAF9F5] dark:bg-[#252622] rounded-[28px] p-5 border border-[#E8E4D9] dark:border-[#3D3E37] space-y-4 shadow-[0_4px_16px_rgba(90,90,64,0.04)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F0EEE6] dark:bg-[#1C1D1A] text-[#5A5A40] dark:text-[#C8C7B9] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div className="text-right">
              <h3 className="text-xs font-bold text-[#5A5A40] dark:text-[#C8C7B9] uppercase tracking-wider">
                التنبيه والتذكير اليومي
              </h3>
              <p className="text-[11px] text-[#8E8E80] dark:text-[#A6A699]">
                تذكير يومي لطيف لتسجيل ما قضيته من صلواتك
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleReminder}
            aria-label="تفعيل التنبيه اليومي"
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
              settings?.reminderEnabled ? 'bg-[#5A5A40]' : 'bg-[#D1CDC2] dark:bg-[#3D3E37]'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                settings?.reminderEnabled ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {settings?.reminderEnabled && (
          <div className="space-y-3.5 pt-2 border-t border-[#E8E4D9] dark:border-[#3D3E37] animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Time Picker & Display */}
            <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-3.5 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#C97C5D]" />
                  <div>
                    <span className="text-xs font-bold text-[#2D2D2A] dark:text-[#EAE7E0] block">
                      وقت التنبيه اليومي
                    </span>
                    <span className="text-[11px] text-[#8E8E80] dark:text-[#A6A699]">
                      سيصلك الإشعار عند الساعة:{' '}
                      <strong className="text-[#5A5A40] dark:text-[#C8C7B9] font-bold">
                        {formatArabicTime(settings.reminderTime || '21:00')}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Styled Native Time Input */}
                <input
                  type="time"
                  value={settings.reminderTime || '21:00'}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="bg-white dark:bg-[#252622] text-[#2D2D2A] dark:text-[#EAE7E0] border border-[#D1CDC2] dark:border-[#3D3E37] text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40] cursor-pointer"
                  dir="ltr"
                />
              </div>

              {/* Quick Preset Time Chips */}
              <div className="mt-3 pt-3 border-t border-[#E8E4D9]/80 dark:border-[#3D3E37]/80">
                <span className="text-[10px] font-bold text-[#8E8E80] dark:text-[#A6A699] block mb-1.5">
                  أوقات مقترحة سريعة:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {reminderPresets.map((preset) => {
                    const isSelected = settings.reminderTime === preset.time;
                    return (
                      <button
                        key={preset.time}
                        type="button"
                        onClick={() => handleTimeChange(preset.time)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#5A5A40] text-white shadow-sm scale-95'
                            : 'bg-white dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] text-[#2D2D2A] dark:text-[#EAE7E0] hover:bg-[#FAF9F5]'
                        }`}
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Browser Permission Status & Test Notification */}
            <div className="flex items-center justify-between bg-[#F0EEE6] dark:bg-[#1C1D1A] p-3 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37]">
              <div className="flex items-center gap-1.5 text-[11px]">
                {permState === 'granted' ? (
                  <span className="flex items-center gap-1 text-[#5A5A40] dark:text-[#C8C7B9] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    إشعارات النظام مفعّلة ✓
                  </span>
                ) : permState === 'denied' ? (
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    إشعارات المتصفح محظورة
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestPermissionAgain}
                    className="text-xs text-[#C97C5D] font-bold underline hover:opacity-80"
                  >
                    طلب إذن إشعارات النظام
                  </button>
                )}
              </div>

              {/* Test button */}
              <button
                type="button"
                onClick={handleTestReminder}
                disabled={isTestingNotification}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#252622] border border-[#D1CDC2] dark:border-[#3D3E37] text-[#2D2D2A] dark:text-[#EAE7E0] text-[11px] font-bold flex items-center gap-1 hover:bg-[#FAF9F5] active:scale-95 transition-all shadow-xs"
              >
                <Play className="w-3 h-3 text-[#5A5A40] dark:text-[#C8C7B9] fill-current" />
                <span>تجربة التنبيه</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* GROUP 3: APP PREFERENCES */}
      <section className="bg-[#FAF9F5] dark:bg-[#252622] rounded-[28px] p-5 border border-[#E8E4D9] dark:border-[#3D3E37] space-y-3 shadow-[0_4px_16px_rgba(90,90,64,0.04)]">
        <h3 className="text-xs font-bold text-[#5A5A40] dark:text-[#C8C7B9] uppercase tracking-wider mb-2">
          تفضيلات التطبيق
        </h3>

        {/* Theme selection */}
        <div className="p-3 bg-[#F0EEE6] dark:bg-[#1C1D1A] rounded-2xl">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2.5">
              <Moon className="w-4 h-4 text-[#5A5A40] dark:text-[#C8C7B9]" />
              <span className="text-xs font-bold text-[#2D2D2A] dark:text-[#EAE7E0]">
                المظهر (الوضع الليلي)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'light', label: 'فاتح' },
              { id: 'dark', label: 'داكن' },
              { id: 'auto', label: 'تلقائي' },
            ].map((th) => {
              const isSelected = settings?.theme === th.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => updateSettings({ theme: th.id as any })}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#5A5A40] text-white shadow-sm'
                      : 'bg-white dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] text-[#2D2D2A] dark:text-[#EAE7E0]'
                  }`}
                >
                  {th.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sound toggle */}
        <div className="flex items-center justify-between p-3 bg-[#F0EEE6] dark:bg-[#1C1D1A] rounded-2xl">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-[#5A5A40] dark:text-[#C8C7B9]" />
            <span className="text-xs font-bold text-[#2D2D2A] dark:text-[#EAE7E0]">
              المؤثرات الصوتية عند التسجيل
            </span>
          </div>
          <button
            type="button"
            onClick={() => updateSettings({ soundEnabled: !settings?.soundEnabled })}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              settings?.soundEnabled ? 'bg-[#5A5A40]' : 'bg-[#D1CDC2] dark:bg-[#3D3E37]'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                settings?.soundEnabled ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Haptic feedback toggle */}
        <div className="flex items-center justify-between p-3 bg-[#F0EEE6] dark:bg-[#1C1D1A] rounded-2xl">
          <div className="flex items-center gap-2.5">
            <Vibrate className="w-4 h-4 text-[#5A5A40] dark:text-[#C8C7B9]" />
            <span className="text-xs font-bold text-[#2D2D2A] dark:text-[#EAE7E0]">
              الاهتزاز التفاعلي (Haptic)
            </span>
          </div>
          <button
            type="button"
            onClick={() => updateSettings({ hapticsEnabled: !settings?.hapticsEnabled })}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              settings?.hapticsEnabled ? 'bg-[#5A5A40]' : 'bg-[#D1CDC2] dark:bg-[#3D3E37]'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                settings?.hapticsEnabled ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Install PWA Option */}
        <button
          type="button"
          onClick={() => setIsInstallOpen(true)}
          className="w-full flex items-center justify-between p-3.5 bg-[#F0EEE6] dark:bg-[#2A2B26] border border-[#D1CDC2] dark:border-[#3D3E37] rounded-2xl group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#5A5A40]/10 text-[#5A5A40] dark:text-[#C8C7B9] flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="text-right">
              <span className="font-semibold text-xs text-[#5A5A40] dark:text-[#C8C7B9] block">
                تثبيت التطبيق على الشاشة الرئيسية
              </span>
              <span className="text-[10px] text-[#8E8E80] dark:text-[#A6A699]">
                استخدام التطبيق بدون شريط المتصفح وبدون إنترنت
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-[#5A5A40] dark:text-[#C8C7B9]" />
        </button>
      </section>

      {/* GROUP 3: BACKUP & RESTORE */}
      <section className="bg-[#FAF9F5] dark:bg-[#252622] rounded-[28px] p-5 border border-[#E8E4D9] dark:border-[#3D3E37] space-y-3 shadow-[0_4px_16px_rgba(90,90,64,0.04)]">
        <h3 className="text-xs font-bold text-[#5A5A40] dark:text-[#C8C7B9] uppercase tracking-wider mb-2">
          النسخ الاحتياطي ونقل البيانات
        </h3>
        <p className="text-[11px] text-[#8E8E80] dark:text-[#A6A699]">
          نظراً لأن جميع بياناتك محفوظة محلياً على هاتفك فقط، يمكنك تحميل نسخة احتياطية واستيرادها على أي جهاز آخر.
        </p>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Export Button */}
          <button
            type="button"
            onClick={exportBackup}
            className="flex items-center justify-center gap-2 p-3 bg-[#F0EEE6] dark:bg-[#1C1D1A] hover:bg-[#EAE7E0] dark:hover:bg-[#2A2B26] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-2xl text-xs font-bold text-[#2D2D2A] dark:text-[#EAE7E0] transition-colors"
          >
            <Download className="w-4 h-4 text-[#5A5A40] dark:text-[#C8C7B9]" />
            <span>تصدير البيانات</span>
          </button>

          {/* Import Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 p-3 bg-[#F0EEE6] dark:bg-[#1C1D1A] hover:bg-[#EAE7E0] dark:hover:bg-[#2A2B26] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-2xl text-xs font-bold text-[#2D2D2A] dark:text-[#EAE7E0] transition-colors"
          >
            <Upload className="w-4 h-4 text-[#C97C5D]" />
            <span>استيراد البيانات</span>
          </button>
        </div>
      </section>

      {/* GROUP 4: DANGER ZONE (RESET DATA) */}
      <section className="bg-rose-50/60 dark:bg-rose-950/20 rounded-[28px] p-5 border border-rose-200 dark:border-rose-900/50 space-y-2">
        <h3 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
          منطقة الخطر
        </h3>

        <button
          type="button"
          onClick={() => setIsResetConfirmOpen(true)}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/80 dark:bg-[#252622] hover:bg-rose-100 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="text-right">
              <span className="font-bold text-sm text-rose-700 dark:text-rose-300 block">
                إعادة ضبط جميع البيانات
              </span>
              <span className="text-[10px] text-[#8E8E80] dark:text-[#A6A699]">
                مسح جميع السجلات والعدادات والبدء من جديد
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-rose-400 group-hover:text-rose-700" />
        </button>
      </section>

      {/* GROUP 5: APP INFO & RELIGIOUS DISCLAIMER */}
      <section className="p-4 rounded-2xl bg-[#F0EEE6] dark:bg-[#1C1D1A] border border-[#E8E4D9] dark:border-[#3D3E37] text-center space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-xs text-[#8E8E80] dark:text-[#A6A699]">
          <ShieldCheck className="w-4 h-4 text-[#5A5A40] dark:text-[#C8C7B9]" />
          <span>تطبيق محلي 100% يعمل بدون خادم وبدون إنترنت</span>
        </div>
        <p className="text-[11px] text-[#8E8E80] dark:text-[#A6A699] leading-relaxed max-w-xs mx-auto">
          "الأعداد المحسوبة تقديرية لأغراض المتابعة الشخصية، ويُرجى الرجوع إلى عالم موثوق لمعرفة الحكم الشرعي المناسب لحالتك."
        </p>
        <div className="text-[10px] text-[#8E8E80] dark:text-[#A6A699] pt-1">
          قضاء • الإصدار 1.0 (PWA)
        </div>
      </section>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAF9F5] dark:bg-[#252622] border border-rose-200 dark:border-rose-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-rose-700 dark:text-rose-300">
                تأكيد إعادة ضبط البيانات
              </h3>
              <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mt-1 leading-relaxed">
                هل أنت متأكد تماماً من رغبتك في حذف جميع الصلوات المسجلة والعدادات والبدء من شاشة الإعداد الأولية؟ <strong>هذا الإجراء لا يمكن التراجع عنه.</strong>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-3 bg-[#E8E4D9] dark:bg-[#3D3E37] text-[#2D2D2A] dark:text-[#EAE7E0] font-semibold text-xs rounded-2xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleResetConfirm}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-2xl transition-colors shadow-md"
              >
                نعم، احذف الكل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
