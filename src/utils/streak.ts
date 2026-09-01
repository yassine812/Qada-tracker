import { DailyRecord, PrayerCounters, StatsSummary } from '../types';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatArabicDate(dateStr: string): string {
  const today = getTodayDateString();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

  if (dateStr === today) {
    return 'اليوم';
  }
  if (dateStr === yesterdayStr) {
    return 'أمس';
  }

  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function calculateStreak(records: DailyRecord[]): { currentStreak: number; longestStreak: number } {
  if (!records || records.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Filter records with total > 0 and get unique dates in ascending order
  const validRecords = records.filter((r) => r.total > 0);
  if (validRecords.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const dateSet = new Set(validRecords.map((r) => r.date));
  const sortedDates = Array.from(dateSet).sort();

  let longest = 0;
  let currentStreakCount = 0;

  // Convert to Date objects
  const dateObjs = sortedDates.map((d) => {
    const [year, month, day] = d.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  // Calculate longest streak
  let tempStreak = 1;
  longest = 1;
  for (let i = 1; i < dateObjs.length; i++) {
    const prev = dateObjs[i - 1];
    const curr = dateObjs[i];
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
      if (tempStreak > longest) longest = tempStreak;
    } else if (diffDays > 1) {
      tempStreak = 1;
    }
  }

  // Calculate current streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = getTodayDateString();

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const hasToday = dateSet.has(todayStr);
  const hasYesterday = dateSet.has(yesterdayStr);

  if (!hasToday && !hasYesterday) {
    currentStreakCount = 0;
  } else {
    // Walk backwards from the most recent active date (either today or yesterday)
    let checkDate = hasToday ? today : yesterday;
    let count = 0;

    while (true) {
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkDate.getDate()).padStart(2, '0');
      const str = `${year}-${month}-${day}`;

      if (dateSet.has(str)) {
        count++;
        // Move back 1 day
        checkDate = new Date(checkDate);
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    currentStreakCount = count;
  }

  return {
    currentStreak: currentStreakCount,
    longestStreak: Math.max(longest, currentStreakCount),
  };
}

export function computeStatsSummary(
  counters: PrayerCounters | null,
  records: DailyRecord[]
): StatsSummary {
  if (!counters) {
    return {
      totalEstimated: 0,
      totalCompleted: 0,
      totalRemaining: 0,
      completionPercentage: 0,
      dailyAverage: 0,
      activeDaysCount: 0,
      currentStreak: 0,
      longestStreak: 0,
      estimatedDaysToFinish: null,
    };
  }

  const totalEstimated =
    counters.fajr.initial +
    counters.dhuhr.initial +
    counters.asr.initial +
    counters.maghrib.initial +
    counters.isha.initial;

  const totalCompleted =
    counters.fajr.completed +
    counters.dhuhr.completed +
    counters.asr.completed +
    counters.maghrib.completed +
    counters.isha.completed;

  const totalRemaining =
    counters.fajr.remaining +
    counters.dhuhr.remaining +
    counters.asr.remaining +
    counters.maghrib.remaining +
    counters.isha.remaining;

  const completionPercentage =
    totalEstimated > 0
      ? Number(((totalCompleted / totalEstimated) * 100).toFixed(1))
      : 0;

  const validRecords = records.filter((r) => r.total > 0);
  const activeDaysCount = new Set(validRecords.map((r) => r.date)).size;

  const dailyAverage =
    activeDaysCount > 0
      ? Number((totalCompleted / activeDaysCount).toFixed(1))
      : 0;

  const { currentStreak, longestStreak } = calculateStreak(records);

  const estimatedDaysToFinish =
    dailyAverage > 0 && totalRemaining > 0
      ? Math.ceil(totalRemaining / dailyAverage)
      : null;

  return {
    totalEstimated,
    totalCompleted,
    totalRemaining,
    completionPercentage,
    dailyAverage,
    activeDaysCount,
    currentStreak,
    longestStreak,
    estimatedDaysToFinish,
  };
}

// Light auditory and haptic feedback
export function triggerHaptic() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(15);
    } catch {}
  }
}

export function playSoftClickSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.06);
  } catch {}
}
