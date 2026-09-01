export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerMeta {
  key: PrayerKey;
  name: string;
  arabicName: string;
  timeDescription: string;
  iconName: string;
  order: number;
}

export interface PrayerCountItem {
  initial: number;
  remaining: number;
  completed: number;
}

export interface PrayerCounters {
  fajr: PrayerCountItem;
  dhuhr: PrayerCountItem;
  asr: PrayerCountItem;
  maghrib: PrayerCountItem;
  isha: PrayerCountItem;
}

export interface UserSettings {
  hasCompletedOnboarding: boolean;
  pubertyAge: number;
  currentAge: number;
  prayerFrequency: number; // 0 to 100 %
  theme: 'light' | 'dark' | 'auto';
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  reminderEnabled: boolean;
  reminderTime: string; // HH:mm (24h format, e.g. "21:00")
  lastReminderDate?: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface DailyRecord {
  id: string;
  date: string; // YYYY-MM-DD
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  total: number;
  timestamp: number;
  note?: string;
}

export interface StatsSummary {
  totalEstimated: number;
  totalCompleted: number;
  totalRemaining: number;
  completionPercentage: number;
  dailyAverage: number;
  activeDaysCount: number;
  currentStreak: number;
  longestStreak: number;
  estimatedDaysToFinish: number | null;
}

export type TabType = 'dashboard' | 'record' | 'history' | 'statistics' | 'settings';

export interface BackupData {
  version: string;
  exportedAt: string;
  settings: UserSettings;
  counters: PrayerCounters;
  records: DailyRecord[];
}

export const PRAYERS_LIST: PrayerMeta[] = [
  {
    key: 'fajr',
    name: 'Fajr',
    arabicName: 'الفجر',
    timeDescription: 'صلاة الفجر',
    iconName: 'Sunrise',
    order: 1,
  },
  {
    key: 'dhuhr',
    name: 'Dhuhr',
    arabicName: 'الظهر',
    timeDescription: 'صلاة الظهر',
    iconName: 'Sun',
    order: 2,
  },
  {
    key: 'asr',
    name: 'Asr',
    arabicName: 'العصر',
    timeDescription: 'صلاة العصر',
    iconName: 'SunMedium',
    order: 3,
  },
  {
    key: 'maghrib',
    name: 'Maghrib',
    arabicName: 'المغرب',
    timeDescription: 'صلاة المغرب',
    iconName: 'Sunset',
    order: 4,
  },
  {
    key: 'isha',
    name: 'Isha',
    arabicName: 'العشاء',
    timeDescription: 'صلاة العشاء',
    iconName: 'Moon',
    order: 5,
  },
];
