import React, { useMemo, useState, useEffect } from 'react';
import {
  Sunrise,
  Sun,
  SunMedium,
  Sunset,
  Moon,
  Check,
  ArrowUpRight,
  Flame,
  Sparkles,
  BookOpen,
  Heart,
  Calendar,
  Compass,
  ArrowRight,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { PRAYERS_LIST, AdhkarCategory, PrayerKey } from '../types';
import { formatNumber } from '../utils/formatters';
import { getTodayDateString } from '../utils/streak';
import { ADHKAR_CATEGORY_LIST } from '../data/adhkar';
import { useAdhkar } from '../hooks/useAdhkar';
import {
  PageTransition,
  AnimatedNumber,
  TactileButton,
  CircularProgressRing,
  AnimatedProgressBar
} from '../components/ui/MotionPrimitives';
import { StarEightPoint, SubtleArch } from '../components/landing/IslamicOrnaments';
import { PrayerTimesSection } from '../components/PrayerTimesSection';
import { getFormattedHijriDate, getFormattedGregorianDate } from '../utils/prayerTimes';
import { getSavedMushafPage } from './QuranPage';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 4 && h < 12) return 'صباح السكينة والبركة';
  if (h >= 12 && h < 16) return 'طاب يومك بذكر الله';
  if (h >= 16 && h < 20) return 'مساء النور والرضا';
  return 'مساء الطمأنينة والمغفرة';
}

function getTimeBasedAdhkarCategory(): AdhkarCategory {
  const h = new Date().getHours();
  if (h >= 4 && h < 12) return 'morning';
  if (h >= 12 && h < 20) return 'evening';
  return 'sleep';
}

// The three adhkar collections use dedicated Lucide icons (NOT prayer-time icons)
const ADHKAR_ICON_MAP: Record<AdhkarCategory, React.ComponentType<{ className?: string }>> = {
  morning: Sunrise,
  evening: Sunset,
  sleep: Moon,
};

export const DashboardPage: React.FC = () => {
  const {
    counters,
    stats,
    records,
    settings,
    setActiveTab,
    setAdhkarFocus,
    todayIstighfarCount,
    incrementIstighfar,
    recordQuickPrayer
  } = useApp();

  const adhkar = useAdhkar();
  const activeAdhkarCategory = getTimeBasedAdhkarCategory();
  const adhkarCompletedToday = ADHKAR_CATEGORY_LIST.filter(
    (c) => {
      const p = adhkar.getCategoryProgress(c.category);
      return p.completed === p.total && p.total > 0;
    }
  ).length;

  const userName = settings?.userName || 'يا عبد الله';
  const greeting = useMemo(() => getGreeting(), []);
  const hijriDate = useMemo(() => getFormattedHijriDate(), []);
  const gregorianDate = useMemo(() => getFormattedGregorianDate(), []);

  // Today's reading page in Mushaf
  const [lastReadPage, setLastReadPage] = useState(() => getSavedMushafPage());
  useEffect(() => {
    setLastReadPage(getSavedMushafPage());
  }, []);

  // Today's recorded prayers count
  const todayPrayersCount = useMemo(() => {
    const todayStr = getTodayDateString();
    const todayRecord = records.find((r) => r.date === todayStr);
    return todayRecord ? todayRecord.total : 0;
  }, [records]);

  if (!counters) return null;

  const prayerKeys: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const totalRemaining = prayerKeys.reduce(
    (sum, key) => sum + (counters[key]?.remaining || 0),
    0
  );
  const totalCompleted = prayerKeys.reduce(
    (sum, key) => sum + (counters[key]?.completed || 0),
    0
  );

  // Next pending prayer for contextual recommendation
  const nextPendingPrayer = prayerKeys.find((k) => counters[k]?.remaining > 0) || 'fajr';
  const nextPrayerMeta = PRAYERS_LIST.find((p) => p.key === nextPendingPrayer)!;

  const getPrayerIcon = (key: PrayerKey) => {
    switch (key) {
      case 'fajr':
        return <Sunrise className="w-4 h-4 text-[#C6A15B]" />;
      case 'dhuhr':
        return <Sun className="w-4 h-4 text-[#C6A15B]" />;
      case 'asr':
        return <SunMedium className="w-4 h-4 text-[#C6A15B]" />;
      case 'maghrib':
        return <Sunset className="w-4 h-4 text-[#C6A15B]" />;
      case 'isha':
        return <Moon className="w-4 h-4 text-[#C6A15B]" />;
    }
  };

  const handleQuickCompleteNext = async () => {
    if (nextPendingPrayer) {
      await recordQuickPrayer(nextPendingPrayer, 1);
    }
  };

  return (
    <PageTransition className="space-y-6 pb-28 text-right select-none" dir="rtl">
      {/* ═══════ 1. GREETING & DATES HEADER ═══════ */}
      <div className="pt-2 px-1">
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Dual Calendar Dates Badge */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7E8C7F] dark:text-[#A9B7A3]">
            <Calendar className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>{hijriDate}</span>
            <span className="opacity-40">•</span>
            <span className="text-[11px] opacity-80">{gregorianDate}</span>
          </div>

          {stats.currentStreak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6A15B]/10 border border-[#C6A15B]/30 text-xs text-[#C6A15B] font-semibold">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{stats.currentStreak} أيام متتالية</span>
            </div>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">
          {greeting} يا {userName} 🌿
        </h1>
        <p className="text-xs sm:text-sm text-[#4A584C] dark:text-[#A9B7A3] mt-1 font-spiritual-serif">
          «وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ» • خطوة صادقة مستمرة تُقرّبك إلى الله.
        </p>
      </div>

      {/* ═══════ 2. AWKAT SALAT (PRAYER TIMES TIMELINE) ═══════ */}
      <PrayerTimesSection />

      {/* ═══════ 3. QADA PROGRESS COMMAND CENTER ═══════ */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white/90 to-[#F6F1E7]/70 dark:from-[#26352A]/90 dark:to-[#18231C]/90 border border-[#C6A15B]/25 shadow-lg shadow-black/5 backdrop-blur-sm">
        <div className="absolute -top-4 -left-4 opacity-10 pointer-events-none">
          <SubtleArch className="w-20 h-28 text-[#C6A15B]" color="#C6A15B" />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="text-center sm:text-right">
            <span className="text-xs uppercase tracking-wider text-[#7E8C7F] dark:text-[#A9B7A3] font-semibold block mb-1">
              الصلوات الفائتة المتبقية
            </span>
            <div className="text-4xl sm:text-5xl font-extrabold font-landing-display text-[#1D211E] dark:text-[#F6F1E7] tracking-tight mb-2">
              <AnimatedNumber value={totalRemaining} />
              <span className="text-base sm:text-lg font-normal text-[#C6A15B] mr-2">صلاة</span>
            </div>
            <p className="text-xs text-[#4A584C] dark:text-[#A9B7A3] flex items-center justify-center sm:justify-start gap-1.5">
              <StarEightPoint size={10} color="#C6A15B" />
              <span>أنجزت حتى الآن: </span>
              <strong className="text-[#C6A15B] font-bold">
                <AnimatedNumber value={totalCompleted} />
              </strong>
              <span> صلاة مباركة</span>
            </p>
          </div>

          <div className="flex flex-col items-center">
            <CircularProgressRing
              percentage={stats.completionPercentage}
              size={96}
              strokeWidth={8}
              progressColor="#C6A15B"
              circleColor="rgba(198, 161, 91, 0.15)"
            >
              <div className="text-center">
                <span className="text-lg font-bold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">
                  {stats.completionPercentage}%
                </span>
                <span className="block text-[9px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                  إنجاز
                </span>
              </div>
            </CircularProgressRing>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-black/5 dark:border-white/5">
          <div className="flex justify-between text-xs text-[#7E8C7F] dark:text-[#A9B7A3] mb-1.5">
            <span>مسار التعويض الكلي</span>
            <span>{stats.completionPercentage}% مكتمل</span>
          </div>
          <AnimatedProgressBar percentage={stats.completionPercentage} height="h-2" />
        </div>
      </div>

      {/* ═══════ 4. CONTEXTUAL NEXT ACTION (ماذا أفعل الآن؟) ═══════ */}
      <div className="relative rounded-2xl p-5 bg-[#26352A] text-[#F6F1E7] border border-[#C6A15B]/30 shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#18231C] border border-[#C6A15B]/30 flex items-center justify-center shrink-0">
              {getPrayerIcon(nextPendingPrayer)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C6A15B]/20 text-[#C6A15B]">
                  الخطوة القادمة
                </span>
                <span className="text-xs text-[#A9B7A3]">
                  متبقي {formatNumber(counters[nextPendingPrayer]?.remaining)}
                </span>
              </div>
              <h3 className="text-base font-bold font-landing-display text-[#F6F1E7] mt-0.5">
                قضاء صلاة {nextPrayerMeta.arabicName}
              </h3>
            </div>
          </div>

          <TactileButton
            onClick={handleQuickCompleteNext}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F6F1E7] text-[#26352A] font-bold text-xs hover:bg-white shadow-sm cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>أتممتها</span>
          </TactileButton>
        </div>
      </div>

      {/* ═══════ 5. QUICK LOG PRAYERS BAR (+1 صلاة) ═══════ */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <StarEightPoint size={11} color="#C6A15B" />
            <h2 className="text-sm font-bold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">
              تسجيل سريع لقضاء الصلوات
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('ibadat')}
            className="text-xs text-[#C6A15B] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>تفاصيل العبادات</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {PRAYERS_LIST.map((prayer) => {
            const count = counters[prayer.key]?.remaining || 0;
            return (
              <TactileButton
                key={prayer.key}
                onClick={() => recordQuickPrayer(prayer.key, 1)}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/15 hover:border-[#C6A15B]/50 transition-all shadow-sm group cursor-pointer"
              >
                <span className="text-[#C6A15B] mb-1 group-hover:scale-110 transition-transform">
                  {getPrayerIcon(prayer.key)}
                </span>
                <span className="text-[11px] font-bold text-[#1D211E] dark:text-[#F6F1E7]">
                  {prayer.arabicName}
                </span>
                <span className="text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3] font-mono mt-0.5">
                  <AnimatedNumber value={count} formatCommas={false} />
                </span>
                <span className="mt-1 text-[9px] px-1.5 py-0.5 rounded-md bg-[#26352A]/5 dark:bg-[#C6A15B]/10 text-[#C6A15B] font-bold">
                  +1
                </span>
              </TactileButton>
            );
          })}
        </div>
      </div>

      {/* ═══════ 6. TODAY'S WORSHIP PULSE & WIRD RESTORATION ═══════ */}
      <div>
        <h2 className="text-sm font-bold font-landing-display text-[#1D211E] dark:text-[#F6F1E7] mb-3 px-1">
          عبادات اليوم والورد
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Continue Quran / Wird Card */}
          <div
            onClick={() => setActiveTab('quran')}
            className="p-5 rounded-2xl bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm flex flex-col justify-between cursor-pointer hover:border-[#C6A15B]/50 transition-all"
            role="button"
            tabIndex={0}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#C6A15B]/15 text-[#C6A15B] flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]">
                      متابعة ورد القرآن
                    </h4>
                    <span className="text-[10px] text-[#7E8C7F]">
                      المصحف الشريف الموثق
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#C6A15B]" />
              </div>

              <div className="my-2 p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#18231C] border border-[#C6A15B]/15">
                <span className="text-xs font-bold text-[#C6A15B] block font-sans">
                  متابعة القراءة: الصفحة {lastReadPage} من 604
                </span>
                <span className="text-[10px] text-[#7E8C7F]">
                  فتح المصحف الشريف بالموضع المحفوظ
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#C6A15B] font-bold pt-2 border-t border-black/5 dark:border-white/5">
              <span>فتح المصحف الآن</span>
              <StarEightPoint size={12} color="#C6A15B" />
            </div>
          </div>

          {/* Daily Istighfar Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#C6A15B]/15 text-[#C6A15B] flex items-center justify-center">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]">
                      الاستغفار اليومي
                    </h4>
                    <span className="text-[10px] text-[#7E8C7F]">
                      الهدف: 70 مرة
                    </span>
                  </div>
                </div>
                <span className="text-sm font-bold font-landing-display text-[#C6A15B]">
                  <AnimatedNumber value={todayIstighfarCount} /> / 70
                </span>
              </div>

              <AnimatedProgressBar
                percentage={(todayIstighfarCount / 70) * 100}
                height="h-1.5"
                className="my-3"
              />
            </div>

            <TactileButton
              onClick={() => incrementIstighfar()}
              className="w-full py-2.5 rounded-xl bg-[#26352A]/10 dark:bg-[#C6A15B]/15 text-[#26352A] dark:text-[#C6A15B] text-xs font-bold hover:bg-[#C6A15B] hover:text-white transition-colors cursor-pointer"
            >
              استغفر الله (+1)
            </TactileButton>
          </div>
        </div>

        {/* Daily Adhkar — Three compact icon actions (صباح / مساء / نوم) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <StarEightPoint size={13} color="#C6A15B" />
              <h3 className="text-sm font-bold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">
                الأذكار اليومية
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C6A15B]/10 border border-[#C6A15B]/25 text-[10px] text-[#C6A15B] font-bold">
              {adhkarCompletedToday} من 3 أوراد
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {ADHKAR_CATEGORY_LIST.map((cat) => {
              const progress = adhkar.getCategoryProgress(cat.category);
              const isComplete = progress.completed === progress.total && progress.total > 0;
              const isActive = cat.category === activeAdhkarCategory;
              const Icon = ADHKAR_ICON_MAP[cat.category];

              return (
                <motion.button
                  key={cat.category}
                  type="button"
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                  onClick={() => {
                    setAdhkarFocus(cat.category);
                    setActiveTab('dhikr');
                  }}
                  className="relative flex flex-col items-center gap-2 rounded-2xl px-2 py-3.5 transition-all cursor-pointer text-center select-none group"
                  style={{
                    background: isActive
                      ? 'linear-gradient(180deg, rgba(198,161,91,0.14), rgba(198,161,91,0.05))'
                      : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(198,161,91,0.4)' : 'rgba(198,161,91,0.12)'}`,
                  }}
                  aria-label={`${cat.title} (${progress.completed}/${progress.total})`}
                >
                  {/* subtle geometric flourish */}
                  <span className="absolute inset-1 rounded-xl pointer-events-none opacity-[0.07] islamic-pattern-bg" aria-hidden="true" />

                  <span
                    className="relative flex items-center justify-center w-12 h-12 rounded-full text-[#C6A15B] border transition-all group-hover:scale-105"
                    style={{
                      background: isActive
                        ? 'linear-gradient(160deg, #C6A15B, #a9854a)'
                        : 'rgba(198,161,91,0.12)',
                      color: isActive ? '#18231C' : '#C6A15B',
                      borderColor: isActive ? '#C6A15B' : 'rgba(198,161,91,0.3)',
                      boxShadow: isActive
                        ? '0 0 0 1px rgba(198,161,91,0.25), 0 6px 18px rgba(198,161,91,0.25)'
                        : '0 2px 8px rgba(24,35,28,0.06)',
                    }}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                    {/* completed checkmark badge */}
                    {isComplete && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 16 }}
                        className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-[#3C6E47] text-[#F6F1E7] flex items-center justify-center border-2 border-white dark:border-[#1F2E24]"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </motion.span>
                    )}
                  </span>

                  <span className="relative flex items-center gap-1 text-[11px] font-bold text-[#1D211E] dark:text-[#F6F1E7] whitespace-nowrap">
                    <span className="text-[#C6A15B]">{cat.icon}</span>
                    {cat.title}
                  </span>

                  <span
                    className={`relative text-[10px] font-mono ${
                      isComplete
                        ? 'text-[#3C6E47] dark:text-[#6BA06B] font-bold'
                        : progress.completed > 0
                          ? 'text-[#C6A15B] font-bold'
                          : 'text-[#7E8C7F] dark:text-[#A9B7A3]'
                    }`}
                  >
                    {progress.completed}/{progress.total}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-3 text-center text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3]">
            الأكثر أهمية حسب وقتك الآن أُبرز تلقائيًا
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
