import { PrayerCounters } from '../types';

export interface CalculationResult {
  years: number;
  days: number;
  totalObligatory: number;
  estimatedMissed: number;
  perPrayer: {
    fajr: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
}

export function calculateMissedPrayers(
  pubertyAge: number,
  currentAge: number,
  prayerFrequencyPercent: number
): CalculationResult {
  const safePuberty = Math.max(7, Math.floor(pubertyAge));
  const safeCurrent = Math.max(safePuberty + 1, Math.floor(currentAge));
  const safeFreq = Math.min(100, Math.max(0, prayerFrequencyPercent));

  const years = safeCurrent - safePuberty;
  const days = years * 365;
  const totalObligatory = days * 5;

  // frequency is 0 -> 100%
  const missedRatio = (100 - safeFreq) / 100;
  const estimatedMissed = Math.round(totalObligatory * missedRatio);

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
