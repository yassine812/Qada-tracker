// This module is shared with the Node ESM push worker, not just Vite.
import { getPrayerSettings, type PrayerSettings } from '../utils/prayerTimes.js';
import type { QadaTracking } from './qadaTracking.js';

export const prayerIds = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export const reminderLabels = {
  morning: 'أذكار الصباح', evening: 'أذكار المساء', sleep: 'أذكار النوم',
  istighfar: 'استغفار اليوم', quran: 'ورد القرآن', dua: 'دعاء اليوم', fasting: 'تذكير الصيام',
};
export type ReminderKind = keyof typeof reminderLabels;
export type TimedReminder = { enabled: boolean; time: string };
export interface PushPreferences {
  // Derived from the prayer ledger, never an editable reminder preference.
  qadaTracking?: QadaTracking;
  enabled: boolean;
  prayers: Record<typeof prayerIds[number], boolean>;
  prayerSettings: Pick<PrayerSettings, 'latitude' | 'longitude' | 'method' | 'madhab'>;
  reminders: Record<ReminderKind, TimedReminder>;
  // ISO weekday: Monday=1. Fasting reminders are personal, not a ruling.
  fastingDays: number[];
  fastingHijriDays: number[];
  // Optional devotional support around the selected Hijri white days.
  whiteDayNotifications: boolean;
  beforeMaghrib: { enabled: boolean; minutesBefore: number };
  custom: (TimedReminder & { id: string; days: number[] })[];
}
export function defaultPushPreferences(prayerSettings: PrayerSettings): PushPreferences {
  const { latitude, longitude, method, madhab } = prayerSettings;
  return {
    enabled: true,
    prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
    prayerSettings: { latitude, longitude, method, madhab },
    reminders: {
      morning: { enabled: true, time: '07:00' }, evening: { enabled: true, time: '18:00' },
      sleep: { enabled: true, time: '22:00' }, istighfar: { enabled: true, time: '20:00' },
      quran: { enabled: false, time: '21:00' }, dua: { enabled: false, time: '12:00' },
      fasting: { enabled: false, time: '04:00' },
    },
    fastingDays: [1, 4], fastingHijriDays: [13, 14, 15],
    whiteDayNotifications: true, beforeMaghrib: { enabled: false, minutesBefore: 30 }, custom: [],
  };
}

export function normalizePushPreferences(value: Partial<PushPreferences> | undefined): PushPreferences {
  const fallback = defaultPushPreferences(getPrayerSettings());
  return {
    ...fallback, ...(value || {}),
    prayers: { ...fallback.prayers, ...(value?.prayers || {}) },
    prayerSettings: { ...fallback.prayerSettings, ...(value?.prayerSettings || {}) },
    reminders: { ...fallback.reminders, ...(value?.reminders || {}) },
    fastingDays: Array.isArray(value?.fastingDays) ? value!.fastingDays! : fallback.fastingDays,
    fastingHijriDays: Array.isArray(value?.fastingHijriDays) ? value!.fastingHijriDays! : fallback.fastingHijriDays,
    whiteDayNotifications: typeof value?.whiteDayNotifications === 'boolean' ? value.whiteDayNotifications : fallback.whiteDayNotifications,
    beforeMaghrib: {
      ...fallback.beforeMaghrib,
      ...(value?.beforeMaghrib || {}),
    },
    custom: Array.isArray(value?.custom) ? value!.custom! : fallback.custom,
  };
}
