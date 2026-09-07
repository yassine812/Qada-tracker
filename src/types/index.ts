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

export interface DhikrReminderItem {
  time: string; // HH:mm (24h format)
  enabled: boolean;
}

// ────────────────────────────────────────────────────────────
// ADHKAR (الأذكار) — verified collections feature
// ────────────────────────────────────────────────────────────
export type AdhkarCategory = 'morning' | 'evening' | 'sleep';

export interface AdhkarItem {
  id: string;
  category: AdhkarCategory;
  title: string; // short descriptive label (not religious text)
  arabicText: string;
  repetitions: number;
  source: string; // e.g. "صحيح مسلم" / "القرآن الكريم"
  sourceReference: string; // e.g. "2693" / "سورة البقرة: 255"
  sourceInfo?: string; // short verified note shown in the ⓘ source sheet
  isQuran?: boolean; // render with mushaf typography
  audioUrl?: string; // optional recitation URL; empty = no audio for this dhikr
}

export type AdhkarView = 'home' | 'reader';

export interface AdhkarCategoryProgress {
  items: Record<string, { count: number; completed: boolean }>;
}

export interface AdhkarDailyState {
  date: string; // YYYY-MM-DD
  byCategory: Partial<Record<AdhkarCategory, AdhkarCategoryProgress | undefined>>;
}

export interface AdhkarHistoryEntry {
  id: string;
  date: string; // YYYY-MM-DD this state belongs to
  category: AdhkarCategory;
  completedCount: number;
  totalCount: number;
}

export interface AdhkarReminderSetting {
  enabled: boolean;
  time: string; // HH:mm (24h format)
}

export type AdhkarReminderSettings = Record<AdhkarCategory, AdhkarReminderSetting>;

export type Gender = 'male' | 'female';

export interface PeriodEntry {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface UserSettings {
  hasCompletedOnboarding: boolean;
  userName?: string;
  gender: Gender;
  pubertyAge: number;
  currentAge: number;
  prayerFrequency: number; // 0 to 100 %
  // Menstruation settings (women only)
  menstruationCalculationMode?: 'average' | 'detailed';
  averageMenstruationDays?: number; // days per month (default 7)
  periodHistory?: PeriodEntry[];
  // Theme
  theme: 'light' | 'dark' | 'auto';
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  // Reminders
  reminderEnabled: boolean;
  reminderTime: string; // HH:mm (24h format, e.g. "21:00")
  lastReminderDate?: string; // YYYY-MM-DD
  dhikrRemindersEnabled: boolean;
  dhikrReminderTimes: DhikrReminderItem[];
  lastDhikrReminderDates?: Record<string, string>; // time -> date last sent
  // Adhkar collection reminders (independent toggles + custom times)
  adhkarReminders?: AdhkarReminderSettings;
  lastAdhkarReminderDates?: Partial<Record<AdhkarCategory, string>>; // category -> date last sent
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

// New navigation: الرئيسية، العبادات، القرآن، الذكر، المزيد
export type TabType = 'dashboard' | 'ibadat' | 'quran' | 'dhikr' | 'settings';

// Sub-tabs within العبادات
export type IbadatSubTab = 'prayers' | 'fasting' | 'zakat';

export interface IstighfarRecord {
  id: string;
  date: string; // YYYY-MM-DD
  count: number; // number of istighfar completed this session
  timestamp: number;
}

export interface IstighfarData {
  hasCompletedSetup: boolean;
  startAge: number; // age when started istighfar
  currentAge: number;
  dailyTarget: number; // default 70
  totalEstimated: number; // calculated: years * 365 * dailyTarget
  completed: number; // total compensated so far
  remaining: number; // totalEstimated - completed
  createdAt: string;
  updatedAt: string;
}

export interface IstighfarStats {
  totalCount: number;
  completedDays: number;
  dailyAverage: number;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  settings: UserSettings;
  counters: PrayerCounters;
  records: DailyRecord[];
  istighfarRecords?: IstighfarRecord[];
  istighfarData?: IstighfarData;
  adhkarDailyStates?: AdhkarDailyState[];
  adhkarHistory?: AdhkarHistoryEntry[];
}

// Zakat configuration
export interface ZakatConfig {
  country: string;
  currency: string;
  currencySymbol: string;
  currentHijriYear: number;
  nisab: number;
  rate: number;
  hawlMonths: number;
  goldPricePerGram?: number;
  silverPricePerGram?: number;
  lastUpdated?: string;
}

// Zakat asset types
export interface ZakatAssets {
  cash: number;
  bankAccounts: number;
  gold: number; // current gold value in TND
  silver: number; // current silver value in TND
  investments: number;
  moneyOwed: number; // money owed TO the user
  businessInventory: number;
  liabilities: number; // deductible debts (subtracted)
}

// Persisted Zakat calculator state (local-first)
export interface ZakatSavedState {
  assets: ZakatAssets;
  hawlSatisfied: boolean;
}

export const DEFAULT_ZAKAT_ASSETS: ZakatAssets = {
  cash: 0,
  bankAccounts: 0,
  gold: 0,
  silver: 0,
  investments: 0,
  moneyOwed: 0,
  businessInventory: 0,
  liabilities: 0,
};

export const DEFAULT_ZAKAT_CONFIG: ZakatConfig = {
  country: 'TN',
  currency: 'TND',
  currencySymbol: 'د.ت',
  currentHijriYear: 1448,
  nisab: 34369.356,
  rate: 0.025,
  hawlMonths: 12,
  goldPricePerGram: undefined,
  silverPricePerGram: undefined,
};

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
