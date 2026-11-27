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
import { IstighfarProgressCard } from '../components/IstighfarProgressCard';
import { WorshipProgressCard } from '../components/WorshipProgressCard';
import { loadFastingState } from '../storage/fastingState';
import { getSavedMushafPage } from './QuranPage';
import { formatArabicNumber } from '../utils/calculator';
import { DashboardStreak } from '../components/streak/StreakFeatures';

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
    setIbadatSubTab,
    setAdhkarFocus,
    todayIstighfarCount,
    incrementIstighfar,
    recordQuickPrayer,
    istighfarData,
  } = useApp();

  const adhkar = useAdhkar();
  const [fastingState, setFastingState] = useState(loadFastingState);
  useEffect(() => {
    const refreshFasting = (event: StorageEvent) => {
      if (event.key === 'qada_fasting_state' || event.key === null) setFastingState(loadFastingState());
    };
    window.addEventListener('storage', refreshFasting);
    return () => window.removeEventListener('storage', refreshFasting);
  }, []);
  const activeAdhkarCategory = getTimeBasedAdhkarCategory();
  const activeAdhkarMeta = ADHKAR_CATEGORY_LIST.find(category => category.category === activeAdhkarCategory)!;
  const activeAdhkarProgress = adhkar.getCategoryProgress(activeAdhkarCategory);
  const ActiveAdhkarIcon = ADHKAR_ICON_MAP[activeAdhkarCategory];


  // A zero counter without the calculation inputs means this person has not
  // set up their prayer estimate yet. Send them to the profile calculator,
  // rather than opening an empty prayer tracker.
  const needsPrayerCalculation = useMemo(() => {
    if (!settings?.calculationMethod) return true;
    if (settings.calculationMethod === 'exact_period') {
      const period = settings.exactPeriod;
      return !period || (period.mode === 'dates'
        ? !period.startDate || !period.endDate
        : !(Number(period.amount) > 0));
    }
    return !(Number(settings.pubertyAge) > 0 && Number(settings.currentAge) > Number(settings.pubertyAge));
  }, [settings]);

  const openPrayerProgress = () => {
    if (needsPrayerCalculation) {
      window.location.assign('/profile?recalculate=1');
      return;
    }
    setIbadatSubTab('prayers');
    setActiveTab('ibadat');
  };

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
  const istighfarDailyGoal = istighfarData?.dailyTarget || 70;

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

  return <PageTransition className="qada-dashboard qada-unified-dashboard">
    <DashboardStreak />
    <div className="qada-day-opening">
      <div className="qada-guide-prayer-times" data-guide="prayer-times"><PrayerTimesSection /></div>
    </div>
    <section className="qada-guide-progress qada-section-panel" data-guide="progress" aria-labelledby="worship-progress-heading">
      <div className="qada-section-heading"><div><span className="qada-section-kicker">كل خطوة تُحتسب</span><h2 id="worship-progress-heading">رحلتك في العبادة</h2></div><span className="qada-section-caption">تقدّمك، في مكان واحد</span></div>
      <div className="qada-progress-overview">
        <WorshipProgressCard title="الصلوات" unit="صلاة" completed={totalCompleted} remaining={totalRemaining} icon={<Sunrise size={21} />} isSetupRequired={needsPrayerCalculation} onOpen={openPrayerProgress} />
        <WorshipProgressCard title="الصيام" unit="يوم" completed={fastingState.completedDays} remaining={fastingState.remainingDays} icon={<Moon size={21} />} onOpen={() => { setIbadatSubTab('fasting'); setActiveTab('ibadat'); }} />
        <IstighfarProgressCard count={todayIstighfarCount} dailyGoal={istighfarDailyGoal} personalTarget={istighfarData?.hasCompletedSetup ? istighfarData.historicalTotalTarget : undefined} remaining={istighfarData?.hasCompletedSetup ? istighfarData.historicalRemaining : undefined} onIncrement={() => incrementIstighfar()} />
      </div>
    </section>
    <div className="qada-daily-grid">
      <section className="qada-section-panel qada-daily-wird" aria-labelledby="daily-wird-heading">
        <div className="qada-section-heading"><div><span className="qada-section-kicker">لحظات تغذّي الروح</span><h2 id="daily-wird-heading">وردك اليوم</h2></div></div>
        <button type="button" className="qada-wird-row" onClick={() => { setAdhkarFocus(activeAdhkarCategory); setActiveTab('dhikr'); }} aria-label={`ابدأ ${activeAdhkarMeta.title}`}>
          <span className="qada-unified-icon"><ActiveAdhkarIcon className="w-6 h-6" /></span>
          <span className="qada-wird-copy"><small>ورد هذا الوقت</small><strong>{activeAdhkarMeta.title}</strong><span>{activeAdhkarMeta.description}</span></span>
          <span className="qada-wird-trailing"><bdi>{activeAdhkarProgress.completed}/{activeAdhkarProgress.total}</bdi><ArrowUpRight size={18} /></span>
        </button>
        <button type="button" className="qada-wird-row" onClick={() => setActiveTab('quran')} aria-label="متابعة ورد القرآن" data-companion-action="متابعة ورد القرآن">
          <span className="qada-unified-icon"><BookOpen size={23} /></span>
          <span className="qada-wird-copy"><small>المصحف الشريف</small><strong>متابعة ورد القرآن</strong><span>تابع من حيث توقفت</span></span>
          <span className="qada-wird-trailing"><span>صفحة <bdi>{lastReadPage}</bdi></span><ArrowUpRight size={18} /></span>
        </button>
        <p className="qada-wird-footnote">«وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ»</p>
      </section>
    </div>
    <section className="qada-section-panel qada-quick-prayers" aria-labelledby="quick-prayers-heading">
      <div className="qada-section-heading"><div><span className="qada-section-kicker">على مهل، باستمرار</span><h2 id="quick-prayers-heading">تسجيل قضاء الصلوات</h2></div><button type="button" onClick={() => { setIbadatSubTab('prayers'); setActiveTab('ibadat'); }} className="qada-inline-link">التفاصيل <ArrowUpRight size={16} /></button></div>
      <div className="qada-prayer-tiles">
        {PRAYERS_LIST.map(prayer => { const remaining = counters[prayer.key]?.remaining || 0;
          return <TactileButton key={prayer.key} onClick={() => remaining > 0 ? recordQuickPrayer(prayer.key, 1) : openPrayerProgress()} ariaLabel={remaining > 0 ? `قضاء صلاة ${prayer.arabicName}` : `عرض ${prayer.arabicName}`} className="qada-quick-prayer">
            {getPrayerIcon(prayer.key)}<strong>{prayer.arabicName}</strong><span><AnimatedNumber value={remaining} formatCommas={false} /></span>{remaining > 0 && <Plus size={14} />}
          </TactileButton>;
        })}
      </div>
      {totalRemaining > 0 && <div className="qada-next-prayer"><div><span className="qada-section-kicker">خطوتك القادمة</span><p>قضاء صلاة {nextPrayerMeta.arabicName} <small>· متبقي {formatNumber(counters[nextPendingPrayer]?.remaining)}</small></p></div><TactileButton onClick={handleQuickCompleteNext} ariaLabel={`قضاء صلاة ${nextPrayerMeta.arabicName}`} className="qada-primary-action"><Check size={16} />أتممتها</TactileButton></div>}
    </section>
  </PageTransition>;
};
