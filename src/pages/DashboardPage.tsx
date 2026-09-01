import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  Sunrise,
  Sun,
  SunMedium,
  Sunset,
  Moon,
  Sparkles,
  AlertTriangle,
  Bell,
  ArrowLeft,
  Flame,
  Heart,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PRAYERS_LIST, PrayerKey } from '../types';
import { formatArabicNumber } from '../utils/calculator';
import { getTodayDateString } from '../utils/streak';
import { formatArabicTime } from '../utils/notifications';
import { DailyDhikrCard } from '../components/DailyDhikrCard';

export const DashboardPage: React.FC = () => {
  const { counters, stats, records, settings, setActiveTab, recordQuickPrayer, todayIstighfarCount, incrementIstighfar, decrementIstighfar, istighfarData, recordIstighfarCompensation } = useApp();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isAlertDismissed, setIsAlertDismissed] = useState<boolean>(false);

  // Keep time updated
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Check if today has any recorded prayers
  const todayPrayersCount = useMemo(() => {
    const todayStr = getTodayDateString();
    const todayRecord = records.find((r) => r.date === todayStr);
    return todayRecord ? todayRecord.total : 0;
  }, [records]);

  // Determine if reminder alert condition is met:
  // 1. Zero prayers recorded today
  // 2. Current time is at or past 6:00 PM (18:00) OR past the user's customized reminder time
  const shouldShowUnrecordedAlert = useMemo(() => {
    if (todayPrayersCount > 0) return false;
    if (isAlertDismissed) return false;

    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const isPast6PM = currentHour >= 18;

    // Also check if user set a reminder schedule
    let isPastUserReminder = false;
    if (settings?.reminderEnabled && settings.reminderTime) {
      const [remHour, remMin] = settings.reminderTime.split(':').map(Number);
      if (!isNaN(remHour) && !isNaN(remMin)) {
        if (currentHour > remHour || (currentHour === remHour && currentMinute >= remMin)) {
          isPastUserReminder = true;
        }
      }
    }

    return isPast6PM || isPastUserReminder;
  }, [todayPrayersCount, isAlertDismissed, currentTime, settings]);

  if (!counters) return null;

  const prayerIcons: Record<PrayerKey, React.ComponentType<{ className?: string }>> = {
    fajr: Sunrise,
    dhuhr: Sun,
    asr: SunMedium,
    maghrib: Sunset,
    isha: Moon,
  };

  const handleQuickAddOne = async (key: PrayerKey, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
    await recordQuickPrayer(key, 1);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-8">
      {/* Alert Banner: 'لم تسجل صلواتك اليوم' if no prayers logged by 6:00 PM / reminder time */}
      {shouldShowUnrecordedAlert && (
        <section className="bg-[#FAF4ED] dark:bg-[#2A231D] border-2 border-[#C97C5D] dark:border-[#C97C5D]/80 rounded-[28px] p-5 shadow-[0_8px_24px_rgba(201,124,93,0.12)] relative overflow-hidden animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#C97C5D] text-white flex items-center justify-center shrink-0 shadow-md">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C97C5D]/20 text-[#A05335] dark:text-[#E89E82]">
                    تنبيه التذكير اليومي
                  </span>
                  <span className="text-[11px] text-[#8E8E80] dark:text-[#A6A699]">
                    {currentTime.getHours() >= 18 ? 'تجاوزت 6:00 مساءً' : 'موعد التذكير'}
                  </span>
                </div>
                <h3 className="font-bold text-lg font-brand-serif text-[#A05335] dark:text-[#F3B39B]">
                  لم تسجل صلواتك اليوم
                </h3>
                <p className="text-xs text-[#6E6E60] dark:text-[#C5C2B8] leading-relaxed">
                  لم تقم بتسجيل أي صلاة مقضية لهذا اليوم حتى الآن. حافظ على استمرارية وردك وسلسلة إنجازك اليومية (
                  {stats.currentStreak} {stats.currentStreak === 1 ? 'يوم' : 'أيام'})!
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#C97C5D]/20 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('record')}
              className="px-5 py-2.5 bg-[#C97C5D] hover:bg-[#B5684A] text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>تسجيل صلوات اليوم الآن</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsAlertDismissed(true)}
              className="text-[11px] font-medium text-[#8E8E80] dark:text-[#A6A699] hover:text-[#2D2D2A] dark:hover:text-white px-2 py-1"
            >
              إخفاء مؤقتاً
            </button>
          </div>
        </section>
      )}

      {/* Hero Card: Total Remaining Prayers with Natural Tones Dark Stone / Olive */}
      <section className="relative overflow-hidden rounded-[28px] p-6 text-center bg-[#5A5A40] dark:bg-[#252622] text-[#FAF9F5] shadow-[0_12px_32px_rgba(90,90,64,0.22)] border border-[#4A4A33] dark:border-[#3D3E37]">
        {/* Soft natural ambient glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#C97C5D]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#7D7D62]/30 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <span className="text-xs font-medium tracking-widest text-[#EAE7E0]/80 mb-1.5 block">
            إجمالي الصلوات المتبقية
          </span>

          <div className="font-extrabold text-5xl font-brand-serif tracking-tight text-[#FFFFFF] my-2">
            {formatArabicNumber(stats.totalRemaining)}
          </div>

          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="text-xs text-[#EAE7E0]/80">نسبة الإنجاز:</span>
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-[#FAF9F5]/20 text-[#FAF9F5] backdrop-blur-sm border border-white/10">
              {stats.completionPercentage}%
            </span>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setActiveTab('record')}
              className="bg-[#C97C5D] hover:bg-[#b86e51] text-white px-7 py-3 rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>تسجيل صلوات اليوم</span>
            </button>
          </div>
        </div>
      </section>

      {/* Daily Dhikr & Spiritual Remembrance Section */}
      <DailyDhikrCard />

      {/* Istighfar Compensation Section */}
      {istighfarData?.hasCompletedSetup && (
        <section className="bg-[#FAF9F5] dark:bg-[#252622] rounded-[28px] p-5 border border-[#E8E4D9] dark:border-[#3D3E37] shadow-[0_4px_16px_rgba(90,90,64,0.04)] relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#C97C5D]/15 text-[#C97C5D] flex items-center justify-center border border-[#C97C5D]/20">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-brand-serif text-[#2D2D2A] dark:text-[#EAE7E0]">
                الاستغفار السابق
              </h3>
              <span className="text-[11px] text-[#8E8E80] dark:text-[#A6A699]">
                تقدير شخصي وليس حكم شرعي
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-3 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37] text-center">
              <div className="text-lg font-extrabold font-brand-serif text-[#C97C5D]">
                {formatArabicNumber(istighfarData.totalEstimated)}
              </div>
              <div className="text-[10px] text-[#8E8E80] dark:text-[#A6A699] font-semibold">
                الإجمالي
              </div>
            </div>
            <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-3 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37] text-center">
              <div className="text-lg font-extrabold font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
                {formatArabicNumber(istighfarData.completed)}
              </div>
              <div className="text-[10px] text-[#8E8E80] dark:text-[#A6A699] font-semibold">
                المقضي
              </div>
            </div>
            <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-3 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37] text-center">
              <div className="text-lg font-extrabold font-brand-serif text-[#C97C5D]">
                {formatArabicNumber(istighfarData.remaining)}
              </div>
              <div className="text-[10px] text-[#8E8E80] dark:text-[#A6A699] font-semibold">
                المتبقي
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full h-2 bg-[#E8E4D9] dark:bg-[#3D3E37] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 bg-[#5A5A40] dark:bg-[#C8C7B9]"
                style={{ width: `${istighfarData.totalEstimated > 0 ? Math.min(100, (istighfarData.completed / istighfarData.totalEstimated) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8E8E80] dark:text-[#A6A699]">
              سجّل استغفار:
            </span>
            <div className="flex items-center gap-2">
              {[10, 50, 100].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => recordIstighfarCompensation(amount)}
                  disabled={istighfarData.remaining <= 0}
                  className="px-4 py-2 rounded-full bg-[#F0EEE6] dark:bg-[#1C1D1A] border border-[#E8E4D9] dark:border-[#3D3E37] text-[#5A5A40] dark:text-[#C8C7B9] text-xs font-bold disabled:opacity-30 hover:bg-[#E8E4D9] dark:hover:bg-[#2A2B26] transition-all active:scale-95"
                >
                  +{amount}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  const amount = prompt('أدخل عدد الاستغفار:');
                  if (amount) {
                    const num = parseInt(amount, 10);
                    if (!isNaN(num) && num > 0) recordIstighfarCompensation(num);
                  }
                }}
                disabled={istighfarData.remaining <= 0}
                className="px-4 py-2 rounded-full bg-[#5A5A40] hover:bg-[#484833] dark:bg-[#C8C7B9] dark:hover:bg-[#B8B7A8] text-white dark:text-[#1C1D1A] text-xs font-bold disabled:opacity-30 transition-all active:scale-95 shadow-sm"
              >
                مخصص
              </button>
            </div>
          </div>

          {/* Completion State */}
          {istighfarData.remaining <= 0 && (
            <div className="mt-3 text-center">
              <span className="text-sm font-semibold text-[#5A5A40] dark:text-[#C8C7B9]">
                أكملت جميع الاستغفار السابق 🤍
              </span>
            </div>
          )}
        </section>
      )}

      {/* 5 Prayer Cards Grid */}
      <section className="space-y-3.5">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-bold text-base text-[#2D2D2A] dark:text-[#EAE7E0]">
            تفاصيل الصلوات الخمس
          </h2>
          <span className="text-xs text-[#8E8E80] dark:text-[#A6A699]">
            اضغط (+) للقضاء السريع
          </span>
        </div>

        <div className="space-y-3">
          {PRAYERS_LIST.map((prayer) => {
            const countItem = counters[prayer.key];
            const Icon = prayerIcons[prayer.key];
            const totalForPrayer = countItem.initial || (countItem.remaining + countItem.completed);
            const prayerProgressPct =
              totalForPrayer > 0
                ? Math.min(100, Math.round((countItem.completed / totalForPrayer) * 100))
                : 0;

            // Circular progress calculation: circumference = 2 * PI * 38 ≈ 238.76
            const radius = 38;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (prayerProgressPct / 100) * circumference;

            return (
              <article
                key={prayer.key}
                className="bg-[#FAF9F5] dark:bg-[#252622] rounded-[24px] p-5 shadow-[0_4px_16px_rgba(90,90,64,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] relative overflow-hidden border border-[#E8E4D9] dark:border-[#3D3E37] flex justify-between items-center transition-all hover:border-[#5A5A40]/40"
              >
                {/* Background Prayer Icon Silhouette */}
                <div className="absolute -left-3 -bottom-3 text-[#E8E4D9] dark:text-[#1C1D1A] opacity-50 dark:opacity-40 pointer-events-none select-none">
                  <Icon className="w-28 h-28" />
                </div>

                {/* Prayer Info */}
                <div className="flex flex-col z-10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-lg text-[#2D2D2A] dark:text-[#EAE7E0]">
                      {prayer.arabicName}
                    </h3>
                    {countItem.remaining === 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAE7E0] text-[#5A5A40] dark:bg-[#3D3E37] dark:text-[#C8C7B9]">
                        مكتمل ✓
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#8E8E80] dark:text-[#A6A699]">
                    <div className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#C97C5D]" />
                      <span>متبقي: <strong className="text-[#2D2D2A] dark:text-[#EAE7E0]">{formatArabicNumber(countItem.remaining)}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#5A5A40] dark:text-[#C8C7B9]" />
                      <span>أنجز: <strong className="text-[#2D2D2A] dark:text-[#EAE7E0]">{formatArabicNumber(countItem.completed)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Circular Progress & Quick Increment (+) Button */}
                <div className="relative w-16 h-16 flex items-center justify-center z-10 shrink-0">
                  <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 100 100">
                    <circle
                      className="text-[#E8E4D9] dark:text-[#3D3E37]"
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="7"
                    />
                    <circle
                      className="text-[#5A5A40] dark:text-[#C8C7B9] progress-ring__circle"
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="7"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>

                  <button
                    type="button"
                    onClick={(e) => handleQuickAddOne(prayer.key, e)}
                    disabled={countItem.remaining === 0}
                    aria-label={`تسجيل صلاة ${prayer.arabicName}`}
                    title={`تسجيل صلاة واحدة لـ ${prayer.arabicName} (+1)`}
                    className="w-12 h-12 bg-[#5A5A40]/10 dark:bg-[#C8C7B9]/15 hover:bg-[#5A5A40] hover:text-white dark:hover:bg-[#C8C7B9] dark:hover:text-[#1C1D1A] text-[#5A5A40] dark:text-[#C8C7B9] disabled:opacity-30 disabled:pointer-events-none rounded-full flex items-center justify-center transition-all duration-150 active:scale-85 shadow-sm cursor-pointer z-20 touch-manipulation focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/50"
                  >
                    <Plus className="w-6 h-6 stroke-[2.5]" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
