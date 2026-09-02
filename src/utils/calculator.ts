import { PrayerCounters } from '../types';

export interface CalculationResult {
  years: number;
  days: number;
  totalObligatory: number;
  menstruationDaysExcluded: number;
  estimatedMissed: number;
  perPrayer: {
    fajr: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
}

export interface MenstruationInfo {
  gender: 'male' | 'female';
  menstruationCalculationMode?: 'average' | 'detailed';
  averageMenstruationDays?: number; // days per month (1-15)
  periodHistory?: Array<{ startDate: string; endDate: string }>;
}

/**
 * Estimate total menstruation days for a woman over the given period.
 * Uses average monthly days * total months if mode is 'average'.
 * Falls back to average if no history provided.
 */
function estimateMenstruationDays(
  years: number,
  info: MenstruationInfo
): number {
  if (info.gender === 'male') return 0;

  if (info.menstruationCalculationMode === 'detailed' && info.periodHistory && info.periodHistory.length > 0) {
    let totalDays = 0;
    for (const entry of info.periodHistory) {
      const start = new Date(entry.startDate);
      const end = new Date(entry.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
        const diffMs = end.getTime() - start.getTime();
        totalDays += Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
      }
    }
    return totalDays;
  }

  // Average mode: daysPerMonth * 12 * years
  const daysPerMonth = Math.min(15, Math.max(1, info.averageMenstruationDays || 7));
  const totalMonths = years * 12;
  return daysPerMonth * totalMonths;
}

export function calculateMissedPrayers(
  pubertyAge: number,
  currentAge: number,
  prayerFrequencyPercent: number,
  menstruationInfo?: MenstruationInfo
): CalculationResult {
  const safePuberty = Math.max(7, Math.floor(pubertyAge));
  const safeCurrent = Math.max(safePuberty + 1, Math.floor(currentAge));
  const safeFreq = Math.min(100, Math.max(0, prayerFrequencyPercent));

  const years = safeCurrent - safePuberty;
  const days = years * 365;
  const totalObligatory = days * 5;

  // For women: subtract menstruation days from total days
  const menstruationDaysExcluded = menstruationInfo
    ? estimateMenstruationDays(years, menstruationInfo)
    : 0;

  // Prayer-applicable days
  const prayerApplicableDays = Math.max(0, days - menstruationDaysExcluded);
  const totalObligatoryAdjusted = prayerApplicableDays * 5;

  const missedRatio = (100 - safeFreq) / 100;
  const estimatedMissed = Math.round(totalObligatoryAdjusted * missedRatio);

  const basePerPrayer = Math.floor(estimatedMissed / 5);
  let remainder = estimatedMissed % 5;

  const perPrayer = {
    fajr: basePerPrayer + (remainder-- > 0 ? 1 : 0),
    dhuhr: basePerPrayer + (remainder-- > 0 ? 1 : 0),
    asr: basePerPrayer + (remainder-- > 0 ? 1 : 0),
    maghrib: basePerPrayer + (remainder-- > 0 ? 1 : 0),
    isha: basePerPrayer + (remainder-- > 0 ? 1 : 0),
  };

  return {
    years,
    days,
    totalObligatory,
    menstruationDaysExcluded,
    estimatedMissed,
    perPrayer,
  };
}

export function createInitialCounters(perPrayer: CalculationResult['perPrayer']): PrayerCounters {
  return {
    fajr: {
      initial: perPrayer.fajr,
      remaining: perPrayer.fajr,
      completed: 0,
    },
    dhuhr: {
      initial: perPrayer.dhuhr,
      remaining: perPrayer.dhuhr,
      completed: 0,
    },
    asr: {
      initial: perPrayer.asr,
      remaining: perPrayer.asr,
      completed: 0,
    },
    maghrib: {
      initial: perPrayer.maghrib,
      remaining: perPrayer.maghrib,
      completed: 0,
    },
    isha: {
      initial: perPrayer.isha,
      remaining: perPrayer.isha,
      completed: 0,
    },
  };
}

export function formatArabicNumber(num: number): string {
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US'); // Displays standard arabic numerals with comma separators like 20,075 as in mockup
}
