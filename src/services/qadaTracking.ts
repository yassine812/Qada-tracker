import type { DailyRecord, PrayerCounters } from '../types/index.js';

export interface QadaTracking {
  hasRemaining: boolean;
  completedDates: string[];
}

const storageKey = 'qada:prayer-tracking:v1';
export const QADA_TRACKING_CHANGED = 'qada-prayer-tracking-changed';
const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export function qadaTrackingSnapshot(ready: boolean, counters: PrayerCounters | null, records: DailyRecord[]): QadaTracking {
  const completedDates = records
    .filter(record => prayers.some(prayer => record[prayer] > 0))
    .map(record => record.date)
    .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date));
  return {
    hasRemaining: ready && Boolean(counters && prayers.some(prayer => counters[prayer]?.remaining > 0)),
    completedDates: [...new Set(completedDates)].sort().slice(-32),
  };
}

export function readQadaTracking(): QadaTracking | undefined {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (typeof value?.hasRemaining !== 'boolean' || !Array.isArray(value.completedDates)) return;
    return {
      hasRemaining: value.hasRemaining,
      completedDates: value.completedDates.filter((date: unknown) => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)).slice(-32),
    };
  } catch { return; }
}

export function publishQadaTracking(snapshot: QadaTracking): void {
  const value = JSON.stringify(snapshot);
  if (localStorage.getItem(storageKey) === value) return;
  localStorage.setItem(storageKey, value);
  window.dispatchEvent(new Event(QADA_TRACKING_CHANGED));
}
