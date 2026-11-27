import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { encourageProgress } from '../services/companionFeedback';
import { useStreak } from './StreakContext';
import { activityDate } from '../services/streakModel';
import { isValidDailyTarget, normalizeQadaPlan } from '../utils/qadaPlan';
import {
  BackupData,
  AdhkarCategory,
  AdhkarReminderSetting,
  AdhkarReminderSettings,
  DailyRecord,
  DhikrReminderItem,
  IstighfarData,
  IstighfarOperation,
  IstighfarRecord,
  IstighfarStats,
  PrayerCounters,
  PrayerKey,
  StatsSummary,
  TabType,
  UserSettings,
  CalculationMethod,
  ExactPeriodSettings,
} from '../types';
import {
  deleteDailyRecord,
  exportAllData,
  getCounters,
  getDailyRecords,
  getIstighfarData,
  getIstighfarRecords,
  getSettings,
  importAllData,
  resetAllData,
  saveCounters,
  saveDailyRecord,
  saveIstighfarData,
  saveIstighfarRecord,
  saveSettings,
} from '../storage/indexedDb';
import { applyIstighfarTap, DAILY_ISTIGHFAR_TARGET, parseIstighfarAmount } from '../services/istighfarLogic.mjs';
import { calculateMissedPrayers, calculateMissedPrayersForDays, createInitialCounters, MenstruationInfo } from '../utils/calculator';
import {
  computeStatsSummary,
  playSoftClickSound,
  triggerHaptic,
} from '../utils/streak';
import { reconcilePush } from '../services/notificationService';
import { Capacitor } from '@capacitor/core';
import { publishQadaTracking, qadaTrackingSnapshot, QADA_TRACKING_CHANGED } from '../services/qadaTracking';
import { useAuth } from './AuthContext';
import { accountMetadataBackup, fetchAccountBackup, hasAccountBackup, saveAccountBackup, saveAccountMetadataBackup, type AccountBackup } from '../services/accountSync';

const DEFAULT_ADHKAR_REMINDERS: AdhkarReminderSettings = {
  morning: { enabled: false, time: '07:00' },
  evening: { enabled: false, time: '17:00' },
  sleep: { enabled: false, time: '22:00' },
};

function newIstighfarOperation(amount: number): IstighfarOperation {
  const operationId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return { operationId, amount, createdAt: new Date().toISOString() };
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  settings: UserSettings | null;
  counters: PrayerCounters | null;
  records: DailyRecord[];
  stats: StatsSummary;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  ibadatSubTab: 'prayers' | 'fasting' | 'zakat';
  setIbadatSubTab: (tab: 'prayers' | 'fasting' | 'zakat') => void;
  loading: boolean;
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  showReminderDialog: boolean;
  setShowReminderDialog: (show: boolean) => void;
  completeOnboarding: (
    pubertyAge: number,
    currentAge: number,
    prayerFrequency: number,
    options?: {
      userName?: string;
      gender?: 'male' | 'female';
      customCounters?: PrayerCounters;
      menstruationCalculationMode?: 'average' | 'detailed';
      averageMenstruationDays?: number;
      periodHistory?: Array<{ startDate: string; endDate: string }>;
      calculationMethod?: CalculationMethod;
      exactPeriod?: ExactPeriodSettings;
    }
  ) => Promise<void>;
  recordTodayPrayers: (counts: Record<PrayerKey, number>) => Promise<boolean>;
  recordQuickPrayer: (prayerKey: PrayerKey, count: number) => Promise<boolean>;
  updatePrayerRemainingCount: (prayerKey: PrayerKey, newRemaining: number) => Promise<boolean>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  updateQadaPlan: (prayer: PrayerKey, target: number) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  exportBackup: () => Promise<void>;
  importBackup: (file: File) => Promise<boolean>;
  resetAll: () => Promise<void>;
  recalculatePrayers: (
    pubertyAge: number,
    currentAge: number,
    prayerFrequency: number,
    options?: {
      gender?: 'male' | 'female';
      menstruationCalculationMode?: 'average' | 'detailed';
      averageMenstruationDays?: number;
      periodHistory?: Array<{ startDate: string; endDate: string }>;
    }
  ) => Promise<void>;
  istighfarRecords: IstighfarRecord[];
  todayIstighfarCount: number;
  istighfarStats: IstighfarStats;
  incrementIstighfar: () => Promise<void>;
  recordIstighfarBatch: (amount: number | string) => Promise<boolean>;
  decrementIstighfar: () => Promise<void>;
  istighfarData: IstighfarData | null;
  setupIstighfar: (startAge: number, currentAge: number, dailyTarget: number, options?: { estimatedPreviousDaily?: number; trackedYears?: number }) => Promise<void>;
  recordIstighfarCompensation: (count: number) => Promise<boolean>;
  updateIstighfarEstimate: (newTotal: number) => Promise<void>;
  recalculateIstighfar: (startAge: number, currentAge: number, dailyTarget: number, options?: { estimatedPreviousDaily?: number; trackedYears?: number }) => Promise<void>;
  applyTodayToHistorical: (count: number) => Promise<boolean>;
  dhikrReminderTimes: DhikrReminderItem[];
  updateDhikrReminderTimes: (times: DhikrReminderItem[]) => Promise<void>;
  toggleDhikrReminders: (enabled: boolean) => Promise<void>;
  adhkarReminders: AdhkarReminderSettings;
  updateAdhkarReminder: (category: AdhkarCategory, setting: AdhkarReminderSetting) => Promise<void>;
  adhkarFocus: AdhkarCategory | null;
  setAdhkarFocus: (category: AdhkarCategory | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

type LocalAppData = {
  settings: UserSettings | null;
  counters: PrayerCounters | null;
  records: DailyRecord[];
  istighfarRecords: IstighfarRecord[];
  istighfarData: IstighfarData | null;
};

function accountSnapshot(data: LocalAppData): AccountBackup | null {
  if (!hasAccountBackup(data.settings, data.counters)) return null;
  return {
    version: '1.3',
    exportedAt: new Date().toISOString(),
    settings: data.settings,
    counters: data.counters,
    records: data.records,
    istighfarRecords: data.istighfarRecords,
    istighfarData: data.istighfarData || undefined,
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { recordDailyActivity, cache: streakCache, today: streakToday, summary: dailyStreak } = useStreak();
  const getTodayDateString = () => activityDate(new Date(), streakCache.timezone);
  const { session, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const latestPlanSettings = useRef(settings);
  latestPlanSettings.current = settings;
  const planSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const [counters, setCounters] = useState<PrayerCounters | null>(null);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [istighfarRecords, setIstighfarRecords] = useState<IstighfarRecord[]>([]);
  const [istighfarData, setIstighfarData] = useState<IstighfarData | null>(null);
  const [dhikrReminderTimes, setDhikrReminderTimes] = useState<DhikrReminderItem[]>([
    { time: '08:00', enabled: true },
    { time: '12:00', enabled: true },
    { time: '16:00', enabled: true },
    { time: '20:00', enabled: true },
  ]);
  const [adhkarReminders, setAdhkarReminders] = useState<AdhkarReminderSettings>(DEFAULT_ADHKAR_REMINDERS);
  const [adhkarFocus, setAdhkarFocus] = useState<AdhkarCategory | null>(() => {
    const category = new URLSearchParams(window.location.search).get('category');
    return ['morning', 'evening', 'sleep'].includes(category || '') ? category as AdhkarCategory : null;
  });
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const path = window.location.pathname;
    if (['/app/prayer', '/app/prayers', '/app/fasting', '/app/zakat'].includes(path)) return 'ibadat';
    if (path === '/app/quran') return 'quran';
    if (['/app/dua', '/app/istighfar', '/app/adhkar'].includes(path)) return 'dhikr';
    if (['/app/notifications', '/app/settings'].includes(path)) return 'settings';
    return 'dashboard';
  });
  const [ibadatSubTab, setIbadatSubTab] = useState<'prayers' | 'fasting' | 'zakat'>(() => {
    const path = window.location.pathname;
    const section = new URLSearchParams(window.location.search).get('section');
    return path === '/app/zakat' || section === 'zakat' ? 'zakat' : path === '/app/fasting' || section === 'fasting' ? 'fasting' : 'prayers';
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showReminderDialog, setShowReminderDialog] = useState<boolean>(false);
  const cloudSyncReady = useRef(false);

  const readLocalData = async (): Promise<LocalAppData> => {
    const [settings, counters, records, istighfarRecords, istighfarData] = await Promise.all([
      getSettings(),
      getCounters(),
      getDailyRecords(),
      getIstighfarRecords(),
      getIstighfarData(),
    ]);
    return { settings, counters, records, istighfarRecords, istighfarData };
  };

  const applyLocalData = (data: LocalAppData) => {
    if (data.settings) {
      // Ensure reminder defaults for backward compatibility.
      const sanitized: UserSettings = {
        ...data.settings,
        gender: data.settings.gender || 'male',
        reminderEnabled: data.settings.reminderEnabled ?? false,
        reminderTime: data.settings.reminderTime || '21:00',
        dhikrRemindersEnabled: data.settings.dhikrRemindersEnabled ?? false,
        dhikrReminderTimes: data.settings.dhikrReminderTimes ?? [
          { time: '08:00', enabled: true },
          { time: '12:00', enabled: true },
          { time: '16:00', enabled: true },
          { time: '20:00', enabled: true },
        ],
        adhkarReminders: {
          ...DEFAULT_ADHKAR_REMINDERS,
          ...(data.settings.adhkarReminders || {}),
        },
      };
      setSettings(sanitized);
      setDhikrReminderTimes(sanitized.dhikrReminderTimes);
      setAdhkarReminders(sanitized.adhkarReminders || DEFAULT_ADHKAR_REMINDERS);
    } else {
      setSettings(null);
    }
    setCounters(data.counters);
    setRecords(data.records);
    setIstighfarRecords(data.istighfarRecords);
    setIstighfarData(data.istighfarData);
  };

  // Signed-in users restore their private backup before onboarding can render.
  // A blank device never uploads an empty snapshot over an existing account.
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    cloudSyncReady.current = false;
    const initialize = async () => {
      setLoading(true);
      try {
        let local = await readLocalData();
        const localBackup = accountSnapshot(local);
        if (session?.user.id) {
          let remote: Awaited<ReturnType<typeof fetchAccountBackup>> = null;
          try {
            remote = await fetchAccountBackup(session.access_token);
          } catch (error) {
            console.warn('Full account backup is temporarily unavailable.', error);
          }
          const metadataBackup = accountMetadataBackup(session.user.user_metadata);
          if (remote) {
            // A server row is authoritative on login. A local snapshot may
            // still contain a legitimate newer historical count from an
            // offline session; submit it only as a monotonic migration
            // candidate, then hydrate again from the merged server response.
            const localCompleted = localBackup?.istighfarData?.historicalCompleted ?? 0;
            const remoteCompleted = remote.backup.istighfarData?.historicalCompleted ?? 0;
            if (localBackup && localCompleted > remoteCompleted) {
              await saveAccountBackup(session.access_token, localBackup).catch((error) => {
                console.warn('Could not submit offline account progress.', error);
              });
              remote = await fetchAccountBackup(session.access_token).catch(() => remote);
            }
            await importAllData(remote.backup);
            local = await readLocalData();
          } else if (!localBackup && metadataBackup) {
            await importAllData(metadataBackup);
            local = await readLocalData();
          } else if (metadataBackup) {
            // If the API is temporarily unavailable, prefer the authenticated
            // metadata recovery copy when it carries the newer history.
            const localCompleted = localBackup?.istighfarData?.historicalCompleted ?? 0;
            const metadataCompleted = metadataBackup.istighfarData?.historicalCompleted ?? 0;
            if (metadataCompleted >= localCompleted) {
              await importAllData(metadataBackup);
              local = await readLocalData();
            }
          } else if (localBackup) {
            await Promise.allSettled([
              saveAccountBackup(session.access_token, localBackup),
              saveAccountMetadataBackup(localBackup),
            ]);
          }
        }
        if (active) applyLocalData(local);
      } catch (error) {
        // Offline or a temporarily unavailable cloud backup must never block local use.
        console.warn('Account backup sync failed; using device data instead.', error);
        if (active) {
          try { applyLocalData(await readLocalData()); } catch {}
        }
      } finally {
        if (active) {
          cloudSyncReady.current = true;
          setLoading(false);
        }
      }
    };
    void initialize();
    return () => { active = false; cloudSyncReady.current = false; };
  }, [authLoading, session?.user.id, session?.access_token]);

  // Save after local changes. This keeps onboarding, profile fields and progress
  // attached to the same authenticated account on every device.
  useEffect(() => {
    if (!cloudSyncReady.current || !session?.user.id) return;
    const backup = accountSnapshot({ settings, counters, records, istighfarRecords, istighfarData });
    if (!backup) return;
    const timer = window.setTimeout(() => {
      void Promise.allSettled([
        saveAccountBackup(session.access_token, backup),
        saveAccountMetadataBackup(backup),
      ]).then((results) => {
        if (results.every((result) => result.status === 'rejected')) {
          console.warn('Could not save account backup.', results);
        }
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [session?.user.id, session?.access_token, settings, counters, records, istighfarRecords, istighfarData]);

  // Reload local state after a manual backup restore without re-downloading cloud data.
  const loadData = async () => {
    try {
      setLoading(true);
      applyLocalData(await readLocalData());
    } catch (error) {
      console.error('Failed to load local data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reconcile web subscriptions on reconnect or travel. Android uses local alarms.
  useEffect(() => {
    if (Capacitor.getPlatform() === 'android') return;
    const refresh = () => { if (document.visibilityState !== 'hidden') void reconcilePush().catch(() => {}); };
    refresh();
    window.addEventListener('online', refresh);
    window.addEventListener('qada-prayer-settings-changed', refresh);
    window.addEventListener(QADA_TRACKING_CHANGED, refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('online', refresh);
      window.removeEventListener('qada-prayer-settings-changed', refresh);
      window.removeEventListener(QADA_TRACKING_CHANGED, refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  useEffect(() => {
    if (loading || authLoading) return;
    try {
      publishQadaTracking(qadaTrackingSnapshot(Boolean(settings?.hasCompletedOnboarding), counters, records));
    } catch (error) {
      console.warn('Could not update daily prayer reminder', error);
    }
  }, [loading, authLoading, settings?.hasCompletedOnboarding, counters, records]);

  // Sync theme immediately and listen for system changes in auto mode
  useEffect(() => {
    if (!settings) return;

    const applyTheme = () => {
      const isDark =
        settings.theme === 'dark' ||
        (settings.theme === 'auto' &&
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for system preference changes when in auto mode
    if (settings.theme === 'auto' && typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings?.theme]);

  // Update dhikr reminder times
  const updateDhikrReminderTimes = async (times: DhikrReminderItem[]) => {
    setDhikrReminderTimes(times);
    if (settings) {
      const updated: UserSettings = {
        ...settings,
        dhikrReminderTimes: times,
        updatedAt: new Date().toISOString(),
      };
      await saveSettings(updated);
      setSettings(updated);
    }
  };

  // Toggle dhikr reminders
  const toggleDhikrReminders = async (enabled: boolean) => {
    if (settings) {
      const updated: UserSettings = {
        ...settings,
        dhikrRemindersEnabled: enabled,
        lastDhikrReminderDates: {},
        updatedAt: new Date().toISOString(),
      };
      await saveSettings(updated);
      setSettings(updated);
    }
  };

  // Update a single adhkar category reminder setting
  const updateAdhkarReminder = async (category: AdhkarCategory, setting: AdhkarReminderSetting) => {
    if (!settings) return;
    const updatedReminders: AdhkarReminderSettings = {
      ...(settings.adhkarReminders || DEFAULT_ADHKAR_REMINDERS),
      [category]: setting,
    };
    const updatedSettings: UserSettings = {
      ...settings,
      adhkarReminders: updatedReminders,
      updatedAt: new Date().toISOString(),
    };
    await saveSettings(updatedSettings);
    setSettings(updatedSettings);
    setAdhkarReminders(updatedReminders);
    showToast(setting.enabled ? 'تم تفعيل تذكير الأذكار' : 'تم إيقاف تذكير الأذكار', 'success');
  };

  // Sync adhkar reminders state with settings whenever settings change
  useEffect(() => {
    if (settings?.adhkarReminders) {
      setAdhkarReminders({
        ...DEFAULT_ADHKAR_REMINDERS,
        ...settings.adhkarReminders,
      });
    }
  }, [settings?.adhkarReminders]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const stats = useMemo(() => {
    return { ...computeStatsSummary(counters, records), currentStreak: dailyStreak.currentStreak, longestStreak: dailyStreak.longestStreak };
  }, [counters, records, dailyStreak.currentStreak, dailyStreak.longestStreak]);

  // Setup istighfar historical tracking
  const setupIstighfar = async (
    startAge: number,
    currentAge: number,
    dailyTarget: number,
    options?: { estimatedPreviousDaily?: number; trackedYears?: number }
  ) => {
    const years = currentAge - startAge;
    const totalEstimated = years * 365 * dailyTarget;
    const estimatedPreviousDaily = options?.estimatedPreviousDaily ?? 0;
    const trackedYears = options?.trackedYears ?? years;
    const historicalTotalTarget = trackedYears * 365 * dailyTarget;
    const historicalCompleted = trackedYears * 365 * estimatedPreviousDaily;
    const historicalRemaining = Math.max(
      0,
      historicalTotalTarget - historicalCompleted
    );
    const data: IstighfarData = {
      hasCompletedSetup: true,
      startAge,
      currentAge,
      dailyTarget,
      totalEstimated,
      completed: 0,
      remaining: totalEstimated,
      estimatedPreviousDaily,
      trackedYears,
      historicalTotalTarget,
      historicalCompleted,
      historicalRemaining,
      operations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveIstighfarData(data);
    setIstighfarData(data);
  };

  // Record istighfar compensation (historical personal target)
  const recordIstighfarCompensation = async (count: number): Promise<boolean> => {
    if (!istighfarData) return false;
    if (typeof count !== 'number' || isNaN(count) || !Number.isInteger(count) || count <= 0) {
      showToast('يرجى إدخال عدد صحيح أكبر من صفر', 'error');
      return false;
    }
    if (count > istighfarData.historicalRemaining) {
      showToast(`لا يمكنك تسجيل أكثر من المتبقي التاريخي (${istighfarData.historicalRemaining})`, 'error');
      return false;
    }

    const newCompleted = istighfarData.completed + count;
    const newRemaining = Math.max(0, istighfarData.totalEstimated - newCompleted);
    const newHistoricalRemaining = Math.max(
      0,
      istighfarData.historicalRemaining - count
    );
    const updated: IstighfarData = {
      ...istighfarData,
      completed: newCompleted,
      remaining: newRemaining,
      historicalCompleted: istighfarData.historicalCompleted + count,
      historicalRemaining: newHistoricalRemaining,
      operations: [...(istighfarData.operations || []), newIstighfarOperation(count)],
      updatedAt: new Date().toISOString(),
    };

    await saveIstighfarData(updated);
    setIstighfarData(updated);

    if (settings?.soundEnabled) playSoftClickSound();
    if (settings?.hapticsEnabled) triggerHaptic();

    showToast(`تم تسجيل ${count} استغفار بنجاح`, 'success');
    return true;
  };

  // Update istighfar estimate manually
  const updateIstighfarEstimate = async (newTotal: number) => {
    if (!istighfarData) return;
    if (typeof newTotal !== 'number' || isNaN(newTotal) || newTotal < 0) return;
    const updated: IstighfarData = {
      ...istighfarData,
      totalEstimated: newTotal,
      remaining: Math.max(0, newTotal - istighfarData.completed),
      updatedAt: new Date().toISOString(),
    };
    await saveIstighfarData(updated);
    setIstighfarData(updated);
    showToast('تم تحديث تقدير الاستغفار', 'success');
  };

  // Recalculate istighfar
  const recalculateIstighfar = async (
    startAge: number,
    currentAge: number,
    dailyTarget: number,
    options?: { estimatedPreviousDaily?: number; trackedYears?: number }
  ) => {
    const years = currentAge - startAge;
    const totalEstimated = years * 365 * dailyTarget;
    const estimatedPreviousDaily = options?.estimatedPreviousDaily ?? istighfarData?.estimatedPreviousDaily ?? 0;
    const trackedYears = options?.trackedYears ?? istighfarData?.trackedYears ?? years;
    const historicalTotalTarget = trackedYears * 365 * dailyTarget;
    const historicalCompleted = trackedYears * 365 * estimatedPreviousDaily;
    const historicalRemaining = Math.max(
      0,
      historicalTotalTarget - historicalCompleted - (istighfarData?.completed || 0)
    );
    const alreadyCompleted = istighfarData?.completed || 0;
    const updated: IstighfarData = {
      ...istighfarData!,
      startAge,
      currentAge,
      dailyTarget,
      totalEstimated,
      completed: alreadyCompleted,
      remaining: Math.max(0, totalEstimated - alreadyCompleted),
      estimatedPreviousDaily,
      trackedYears,
      historicalTotalTarget,
      historicalCompleted,
      historicalRemaining,
      updatedAt: new Date().toISOString(),
    };
    await saveIstighfarData(updated);
    setIstighfarData(updated);
    showToast('تمت إعادة حساب الاستغفار', 'success');
  };

  // Compute today's istighfar count
  const todayIstighfarCount = useMemo(() => {
    const todayStr = getTodayDateString();
    const todayRecord = istighfarRecords.find((r) => r.date === todayStr);
    return todayRecord ? Math.min(DAILY_ISTIGHFAR_TARGET, Math.max(0, todayRecord.count)) : 0;
  }, [istighfarRecords, streakToday]);

  // Compute istighfar stats
  const istighfarStats = useMemo((): IstighfarStats => {
    const totalCount = istighfarRecords.reduce((sum, r) => sum + r.count, 0);
    const completedDays = istighfarRecords.filter((r) => r.count >= 70).length;
    const uniqueDays = new Set(istighfarRecords.filter((r) => r.count > 0).map((r) => r.date)).size;
    const dailyAverage = uniqueDays > 0 ? Number((totalCount / uniqueDays).toFixed(1)) : 0;
    return { totalCount, completedDays, dailyAverage };
  }, [istighfarRecords]);

  // Increment istighfar counter. The daily 70 are a separate practice:
  // once they are complete, the same tap advances the personal goal ledger.
  const incrementIstighfar = async () => {
    const todayStr = getTodayDateString();
    const existing = istighfarRecords.find((r) => r.date === todayStr);
    const currentCount = existing?.count || 0;
    if (currentCount >= DAILY_ISTIGHFAR_TARGET) {
      if (istighfarData?.hasCompletedSetup && istighfarData.historicalRemaining > 0) {
        const transition = applyIstighfarTap({
          todayCount: currentCount,
          historicalRemaining: istighfarData.historicalRemaining,
          historicalCompleted: istighfarData.historicalCompleted,
        });
        await recordIstighfarBatch(transition.historicalPortion || 1);
      } else {
        showToast('أكملت هدف اليوم: 70 استغفارًا 🤍', 'info');
      }
      return;
    }
    const transition = applyIstighfarTap({
      todayCount: currentCount,
      historicalRemaining: istighfarData?.historicalRemaining ?? 0,
      historicalCompleted: istighfarData?.historicalCompleted ?? 0,
    });

    const newCount = transition.todayCount;

    const record: IstighfarRecord = {
      id: existing ? existing.id : `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: todayStr,
      count: newCount,
      timestamp: Date.now(),
    };

    setIstighfarRecords((prev) => {
      const filtered = prev.filter((r) => r.date !== todayStr);
      return [record, ...filtered];
    });

    if (settings?.soundEnabled) playSoftClickSound();
    if (settings?.hapticsEnabled) triggerHaptic();

    try {
      await saveIstighfarRecord(record);
      encourageProgress(newCount === DAILY_ISTIGHFAR_TARGET ? 'ما شاء الله! أكملت هدف اليوم: 70 استغفارًا!' : 'أحسنت! زاد استغفارك اليوم. واصل بهدوء!', newCount % 10 === 0);
    } catch (err) {
      console.warn('Storage sync error:', err);
    }

    if (newCount === DAILY_ISTIGHFAR_TARGET) {
      void recordDailyActivity('istighfar');
      showToast('أكملت 70 استغفارًا اليوم 🤍', 'success');
    }
  };

  // Record a batch performed away from the phone in the historical personal
  // ledger. This action is completely independent from today's 70 taps.
  async function recordIstighfarBatch(amount: number | string): Promise<boolean> {
    const parsedAmount = parseIstighfarAmount(amount);
    if (parsedAmount <= 0) {
      showToast('يرجى إدخال عدد صحيح أكبر من صفر', 'error');
      return false;
    }
    if (!istighfarData) return false;
    const historicalRemaining = Math.max(0, istighfarData.historicalRemaining || 0);
    if (historicalRemaining <= 0) {
      showToast('اكتمل هدفك الشخصي للاستغفار', 'info');
      return false;
    }
    const appliedAmount = Math.min(parsedAmount, historicalRemaining);
    const updated: IstighfarData = {
      ...istighfarData,
      completed: istighfarData.completed + appliedAmount,
      remaining: Math.max(0, istighfarData.totalEstimated - istighfarData.completed - appliedAmount),
      historicalCompleted: istighfarData.historicalCompleted + appliedAmount,
      historicalRemaining: historicalRemaining - appliedAmount,
      operations: [...(istighfarData.operations || []), newIstighfarOperation(appliedAmount)],
      updatedAt: new Date().toISOString(),
    };
    try {
      await saveIstighfarData(updated);
      setIstighfarData(updated);
    } catch (err) {
      console.warn('Storage sync error:', err);
      showToast('تعذر حفظ العدد، حاول مرة أخرى', 'error');
      return false;
    }
    if (settings?.soundEnabled) playSoftClickSound();
    if (settings?.hapticsEnabled) triggerHaptic();
    showToast(`تمت إضافة ${appliedAmount} استغفارًا إلى الهدف الشخصي`, 'success');
    const completedPersonalGoal = updated.historicalRemaining === 0;
    encourageProgress(completedPersonalGoal ? 'مبارك! وصلت إلى هدفك الشخصي للاستغفار!' : 'رائع! تقدّمت في هدفك الشخصي للاستغفار.', completedPersonalGoal);
    return true;
  }

  // Decrement istighfar counter
  const decrementIstighfar = async () => {
    if (todayIstighfarCount <= 0) return;

    const todayStr = getTodayDateString();
    const newCount = todayIstighfarCount - 1;
    const existing = istighfarRecords.find((r) => r.date === todayStr);

    if (!existing) return;

    const record: IstighfarRecord = {
      id: existing.id,
      date: todayStr,
      count: newCount,
      timestamp: Date.now(),
    };

    setIstighfarRecords((prev) => {
      const filtered = prev.filter((r) => r.date !== todayStr);
      if (newCount > 0) {
        return [record, ...filtered];
      }
      return filtered;
    });

    try {
      if (newCount > 0) {
        await saveIstighfarRecord(record);
      } else {
        // Remove record if count goes to 0
        const local = localStorage.getItem('qada_istighfar');
        if (local) {
          const list: IstighfarRecord[] = JSON.parse(local);
          localStorage.setItem('qada_istighfar', JSON.stringify(list.filter((r) => r.id !== existing.id)));
        }
      }
    } catch (err) {
      console.warn('Storage sync error:', err);
    }
  };

  // Complete Initial Onboarding
  const completeOnboarding = async (
    pubertyAge: number,
    currentAge: number,
    prayerFrequency: number,
    options?: {
      userName?: string;
      gender?: 'male' | 'female';
      customCounters?: PrayerCounters;
      menstruationCalculationMode?: 'average' | 'detailed';
      averageMenstruationDays?: number;
      periodHistory?: Array<{ startDate: string; endDate: string }>;
      calculationMethod?: CalculationMethod;
      exactPeriod?: ExactPeriodSettings;
    }
  ) => {
    const gender = options?.gender || 'male';

    let initialCounters: PrayerCounters;
    if (options?.customCounters) {
      initialCounters = options.customCounters;
    } else {
      const method = options?.calculationMethod || 'age_estimate';
      const menstruationInfo: MenstruationInfo | undefined = gender === 'female' && method !== 'exact_period'
        ? {
            gender: 'female',
            menstruationCalculationMode: options?.menstruationCalculationMode || 'average',
            averageMenstruationDays: options?.averageMenstruationDays || 7,
            periodHistory: options?.periodHistory,
          }
        : undefined;
      let calc;
      if (method === 'exact_period') {
        const period = options?.exactPeriod;
        let days = 0;
        if (period?.mode === 'dates' && period.startDate && period.endDate) {
          const start = new Date(`${period.startDate}T00:00:00Z`).getTime();
          const end = new Date(`${period.endDate}T00:00:00Z`).getTime();
          days = Number.isFinite(start) && Number.isFinite(end) && end >= start ? Math.floor((end - start) / 86400000) + 1 : 0;
        } else if (period?.mode === 'duration') {
          const amount = Math.max(0, Number(period.amount) || 0);
          days = amount * (period.unit === 'weeks' ? 7 : period.unit === 'months' ? 30 : period.unit === 'years' ? 365 : 1);
        }
        let excludedDays = 0;
        if (gender === 'female' && options?.periodHistory?.length) {
          const rangeStart = period?.startDate ? new Date(`${period.startDate}T00:00:00Z`).getTime() : 0;
          const rangeEnd = period?.endDate ? new Date(`${period.endDate}T00:00:00Z`).getTime() : Number.MAX_SAFE_INTEGER;
          excludedDays = options.periodHistory.reduce((sum, entry) => {
            const start = new Date(`${entry.startDate}T00:00:00Z`).getTime();
            const end = new Date(`${entry.endDate}T00:00:00Z`).getTime();
            if (!Number.isFinite(start) || !Number.isFinite(end)) return sum;
            const overlapStart = Math.max(start, rangeStart);
            const overlapEnd = Math.min(end, rangeEnd);
            return overlapEnd >= overlapStart ? sum + Math.floor((overlapEnd - overlapStart) / 86400000) + 1 : sum;
          }, 0);
        }
        calc = calculateMissedPrayersForDays(days, 0, excludedDays);
      } else {
        calc = calculateMissedPrayers(pubertyAge, currentAge, prayerFrequency, menstruationInfo);
      }
      initialCounters = createInitialCounters(calc.perPrayer);
    }

    const newSettings: UserSettings = {
      hasCompletedOnboarding: true,
      userName: options?.userName || undefined,
      gender,
      pubertyAge,
      currentAge,
      prayerFrequency,
      calculationMethod: options?.calculationMethod || 'age_estimate',
      exactPeriod: options?.exactPeriod,
      menstruationCalculationMode: options?.menstruationCalculationMode || 'average',
      averageMenstruationDays: options?.averageMenstruationDays || 7,
      periodHistory: options?.periodHistory || [],
      theme: 'light',
      hapticsEnabled: true,
      soundEnabled: true,
      reminderEnabled: false,
      reminderTime: '21:00',
      dhikrRemindersEnabled: false,
      dhikrReminderTimes: [
        { time: '08:00', enabled: true },
        { time: '12:00', enabled: true },
        { time: '16:00', enabled: true },
        { time: '20:00', enabled: true },
      ],
      adhkarReminders: DEFAULT_ADHKAR_REMINDERS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await Promise.all([
      saveSettings(newSettings),
      saveCounters(initialCounters),
    ]);

    setSettings(newSettings);
    setCounters(initialCounters);
    showToast('تم إعداد الحساب بنجاح، بالتوفيق في رحلة القضاء', 'success');
  };

  // Record Today's Prayers (submitting multi-prayer form)
  const recordTodayPrayers = async (counts: Record<PrayerKey, number>): Promise<boolean> => {
    if (!counters) return false;

    const totalToday = Object.values(counts).reduce((acc, v) => acc + (v || 0), 0);
    if (totalToday === 0) {
      showToast('الرجاء تحديد عدد الصلوات التي تم قضاؤها', 'info');
      return false;
    }

    // Validation: must be positive integer and cannot exceed remaining
    const prayerKeys: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    for (const key of prayerKeys) {
      const val = counts[key];
      if (val !== undefined && val !== null) {
        if (typeof val !== 'number' || isNaN(val) || !Number.isInteger(val) || val < 0) {
          showToast('يرجى إدخال أعداد صحيحة موجبة فقط بدون كسور أو أرقام عشرية', 'error');
          return false;
        }
        if (val > counters[key].remaining) {
          showToast(`لا يمكنك تسجيل عدد أكبر من الصلوات المتبقية (${counters[key].remaining})`, 'error');
          return false;
        }
      }
    }

    // Calculate updated counters
    const newCounters: PrayerCounters = {
      fajr: {
        ...counters.fajr,
        remaining: counters.fajr.remaining - (counts.fajr || 0),
        completed: counters.fajr.completed + (counts.fajr || 0),
      },
      dhuhr: {
        ...counters.dhuhr,
        remaining: counters.dhuhr.remaining - (counts.dhuhr || 0),
        completed: counters.dhuhr.completed + (counts.dhuhr || 0),
      },
      asr: {
        ...counters.asr,
        remaining: counters.asr.remaining - (counts.asr || 0),
        completed: counters.asr.completed + (counts.asr || 0),
      },
      maghrib: {
        ...counters.maghrib,
        remaining: counters.maghrib.remaining - (counts.maghrib || 0),
        completed: counters.maghrib.completed + (counts.maghrib || 0),
      },
      isha: {
        ...counters.isha,
        remaining: counters.isha.remaining - (counts.isha || 0),
        completed: counters.isha.completed + (counts.isha || 0),
      },
    };

    const todayDate = getTodayDateString();
    const newRecord: DailyRecord = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: todayDate,
      fajr: counts.fajr || 0,
      dhuhr: counts.dhuhr || 0,
      asr: counts.asr || 0,
      maghrib: counts.maghrib || 0,
      isha: counts.isha || 0,
      total: totalToday,
      timestamp: Date.now(),
    };

    // Optimistic UI updates
    setCounters(newCounters);
    const updatedRecords = [newRecord, ...records];
    setRecords(updatedRecords);

    if (settings?.soundEnabled) playSoftClickSound();
    if (settings?.hapticsEnabled) triggerHaptic();

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#0c5252', '#3e6658', '#c0ecda', '#ebe2c8'],
      });
    } catch {}

    showToast(`تم تسجيل ${totalToday} صلوات بنجاح تقبل الله منك`, 'success');

    // Persist data
    try {
      await saveCounters(newCounters);
      await saveDailyRecord(newRecord);
      void recordDailyActivity('qada_prayer');
      const finished = Object.values(newCounters).every(counter => counter.remaining === 0);
      encourageProgress(finished ? 'ما شاء الله! أكملت قضاء الصلوات المسجّلة. تقبّل الله منك!' : 'أحسنت! سجّلت قضاء الصلاة. خطوة جميلة في طريقك!', finished || totalToday >= 5);
    } catch (err) {
      console.warn('Storage sync error:', err);
    }

    return true;
  };

  // Record Quick Prayer (single prayer direct count)
  const recordQuickPrayer = async (prayerKey: PrayerKey, count: number): Promise<boolean> => {
    if (!counters) return false;
    if (typeof count !== 'number' || isNaN(count) || !Number.isInteger(count) || count <= 0) {
      showToast('الرجاء إدخال عدد صحيح أكبر من صفر وبدون كسور', 'error');
      return false;
    }

    if (count > counters[prayerKey].remaining) {
      showToast(`لا يمكنك تسجيل أكثر من المتبقي (${counters[prayerKey].remaining})`, 'error');
      return false;
    }

    const newCounters: PrayerCounters = {
      ...counters,
      [prayerKey]: {
        ...counters[prayerKey],
        remaining: counters[prayerKey].remaining - count,
        completed: counters[prayerKey].completed + count,
      },
    };

    const prayerArabicNames: Record<PrayerKey, string> = {
      fajr: 'الفجر',
      dhuhr: 'الظهر',
      asr: 'العصر',
      maghrib: 'المغرب',
      isha: 'العشاء',
    };

    const todayDate = getTodayDateString();
    const newRecord: DailyRecord = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: todayDate,
      fajr: prayerKey === 'fajr' ? count : 0,
      dhuhr: prayerKey === 'dhuhr' ? count : 0,
      asr: prayerKey === 'asr' ? count : 0,
      maghrib: prayerKey === 'maghrib' ? count : 0,
      isha: prayerKey === 'isha' ? count : 0,
      total: count,
      timestamp: Date.now(),
    };

    // Optimistic UI updates
    setCounters(newCounters);
    setRecords((prev) => [newRecord, ...prev]);

    if (settings?.soundEnabled) playSoftClickSound();
    if (settings?.hapticsEnabled) triggerHaptic();

    showToast(
      count === 1
        ? `تم تسجيل صلاة ${prayerArabicNames[prayerKey]} (+1) بنجاح 🌿`
        : `تم تسجيل ${count} صلوات ${prayerArabicNames[prayerKey]} بنجاح 🌿`,
      'success'
    );

    // Persist data
    try {
      await saveCounters(newCounters);
      await saveDailyRecord(newRecord);
      void recordDailyActivity('qada_prayer');
      const finished = newCounters[prayerKey].remaining === 0;
      encourageProgress(finished ? `ما شاء الله! أكملت قضاء صلاة ${prayerArabicNames[prayerKey]} المسجّلة!` : `أحسنت في قضاء صلاة ${prayerArabicNames[prayerKey]}! تقبّل الله منك.`, finished || newCounters[prayerKey].completed % 10 === 0);
    } catch (err) {
      console.warn('Storage sync error:', err);
    }

    return true;
  };

  // Edit Remaining Count Manually
  const updatePrayerRemainingCount = async (
    prayerKey: PrayerKey,
    newRemaining: number
  ): Promise<boolean> => {
    if (!counters) return false;
    if (typeof newRemaining !== 'number' || isNaN(newRemaining) || !Number.isInteger(newRemaining) || newRemaining < 0) {
      showToast('لا يمكن إدخال قيمة سالبة أو كسرية', 'error');
      return false;
    }

    const currentItem = counters[prayerKey];
    const diff = newRemaining - currentItem.remaining;
    const newInitial = Math.max(0, currentItem.initial + diff);

    const newCounters: PrayerCounters = {
      ...counters,
      [prayerKey]: {
        ...currentItem,
        remaining: newRemaining,
        initial: newInitial,
      },
    };

    await saveCounters(newCounters);
    setCounters(newCounters);
    showToast('تم تعديل العدد المتبقي بنجاح', 'success');
    return true;
  };

  // Update Settings
  const updateQadaPlan = async (prayer: PrayerKey, target: number) => {
    const current = latestPlanSettings.current;
    if (!current || !isValidDailyTarget(target)) return;
    const updated: UserSettings = {
      ...current,
      qadaPlan: { ...normalizeQadaPlan(current.qadaPlan), [prayer]: target },
      updatedAt: new Date().toISOString(),
    };
    latestPlanSettings.current = updated;
    setSettings(updated);
    // Serialize rapid taps so an older IndexedDB write cannot win the race.
    planSaveQueue.current = planSaveQueue.current.catch(() => {}).then(() => saveSettings(updated));
    await planSaveQueue.current;
  };

  const updateSettings = async (newSettingsObj: Partial<UserSettings>) => {
    if (!settings) return;
    const updated: UserSettings = {
      ...settings,
      ...newSettingsObj,
      updatedAt: new Date().toISOString(),
    };
    await saveSettings(updated);
    setSettings(updated);
    showToast('تم حفظ الإعدادات', 'success');
  };

  // Delete Record from History
  const deleteRecord = async (id: string) => {
    const target = records.find((r) => r.id === id);
    if (!target || !counters) return;

    // Rollback counters
    const newCounters: PrayerCounters = {
      fajr: {
        ...counters.fajr,
        remaining: counters.fajr.remaining + target.fajr,
        completed: Math.max(0, counters.fajr.completed - target.fajr),
      },
      dhuhr: {
        ...counters.dhuhr,
        remaining: counters.dhuhr.remaining + target.dhuhr,
        completed: Math.max(0, counters.dhuhr.completed - target.dhuhr),
      },
      asr: {
        ...counters.asr,
        remaining: counters.asr.remaining + target.asr,
        completed: Math.max(0, counters.asr.completed - target.asr),
      },
      maghrib: {
        ...counters.maghrib,
        remaining: counters.maghrib.remaining + target.maghrib,
        completed: Math.max(0, counters.maghrib.completed - target.maghrib),
      },
      isha: {
        ...counters.isha,
        remaining: counters.isha.remaining + target.isha,
        completed: Math.max(0, counters.isha.completed - target.isha),
      },
    };

    await deleteDailyRecord(id);
    await saveCounters(newCounters);

    setCounters(newCounters);
    setRecords(records.filter((r) => r.id !== id));
    showToast('تم حذف السجل وتحديث العدادات', 'info');
  };

  // Export JSON Backup
  const exportBackup = async () => {
    try {
      const data = await exportAllData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qada_backup_${getTodayDateString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('تم تحميل ملف النسخ الاحتياطي بنجاح', 'success');
    } catch (error) {
      console.error(error);
      showToast('فشل في تصدير البيانات', 'error');
    }
  };

  // Import JSON Backup
  const importBackup = async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupData;
      if (!parsed.settings || !parsed.counters) {
        showToast('ملف النسخ الاحتياطي غير صالح', 'error');
        return false;
      }
      await importAllData(parsed);
      await loadData();
      showToast('تم استعادة البيانات بنجاح', 'success');
      return true;
    } catch (error) {
      console.error('Error importing backup:', error);
      showToast('حدث خطأ أثناء قراءة ملف النسخ الاحتياطي', 'error');
      return false;
    }
  };

  // Reset All Application Data
  const resetAll = async () => {
    await resetAllData();
    setSettings(null);
    setCounters(null);
    setRecords([]);
    setIstighfarRecords([]);
    setIstighfarData(null);
    setActiveTab('dashboard');
    showToast('تمت إعادة ضبط جميع البيانات بنجاح', 'info');
  };

  // Recalculate Missed Prayers
  const recalculatePrayers = async (
    pubertyAge: number,
    currentAge: number,
    prayerFrequency: number,
    options?: {
      gender?: 'male' | 'female';
      menstruationCalculationMode?: 'average' | 'detailed';
      averageMenstruationDays?: number;
      periodHistory?: Array<{ startDate: string; endDate: string }>;
    }
  ) => {
    const gender = options?.gender || settings?.gender || 'male';
    const menstruationInfo: MenstruationInfo | undefined = gender === 'female'
      ? {
          gender: 'female',
          menstruationCalculationMode: options?.menstruationCalculationMode || settings?.menstruationCalculationMode || 'average',
          averageMenstruationDays: options?.averageMenstruationDays ?? settings?.averageMenstruationDays ?? 7,
          periodHistory: options?.periodHistory ?? settings?.periodHistory,
        }
      : undefined;

    const calc = calculateMissedPrayers(pubertyAge, currentAge, prayerFrequency, menstruationInfo);
    const newCounters = createInitialCounters(calc.perPrayer);

    if (settings) {
      const updatedSettings: UserSettings = {
        ...settings,
        pubertyAge,
        currentAge,
        prayerFrequency,
        gender,
        ...(gender === 'female' ? {
          menstruationCalculationMode: options?.menstruationCalculationMode || settings?.menstruationCalculationMode || 'average',
          averageMenstruationDays: options?.averageMenstruationDays ?? settings?.averageMenstruationDays ?? 7,
          periodHistory: options?.periodHistory ?? settings?.periodHistory,
        } : {}),
        updatedAt: new Date().toISOString(),
      };
      await saveSettings(updatedSettings);
      setSettings(updatedSettings);
    }
    await saveCounters(newCounters);
    setCounters(newCounters);
    showToast('تمت إعادة حساب الصلوات بنجاح', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        counters,
        records,
        stats,
        activeTab,
        setActiveTab,
        ibadatSubTab,
        setIbadatSubTab,
        loading,
        toast,
        showToast,
        hideToast,
        showReminderDialog,
        setShowReminderDialog,
        completeOnboarding,
        recordTodayPrayers,
        recordQuickPrayer,
        updatePrayerRemainingCount,
        updateSettings,
        updateQadaPlan,
        deleteRecord,
        exportBackup,
        importBackup,
        resetAll,
        recalculatePrayers,
        istighfarRecords,
        todayIstighfarCount,
        istighfarStats,
        incrementIstighfar,
        recordIstighfarBatch,
        decrementIstighfar,
        istighfarData,
        setupIstighfar,
        recordIstighfarCompensation,
        updateIstighfarEstimate,
        recalculateIstighfar,
        applyTodayToHistorical: async (count: number) => {
          if (!istighfarData) return false;
          if (typeof count !== 'number' || isNaN(count) || !Number.isInteger(count) || count <= 0) {
            showToast('يرجى إدخال عدد صحيح أكبر من صفر', 'error');
            return false;
          }
          if (count > todayIstighfarCount) {
            showToast(`لا يمكن تطبيق عدد أكبر من استغفار اليوم (${todayIstighfarCount})`, 'error');
            return false;
          }
          if (count > istighfarData.historicalRemaining) {
            showToast(`لا يمكن تطبيق أكثر من المتبقي التاريخي (${istighfarData.historicalRemaining})`, 'error');
            return false;
          }
          const newHistoricalRemaining = Math.max(0, istighfarData.historicalRemaining - count);
          // We do NOT reduce daily remaining here; this is about applying today's count to the historical ledger
          const updated: IstighfarData = {
            ...istighfarData,
            historicalCompleted: istighfarData.historicalCompleted + count,
            historicalRemaining: newHistoricalRemaining,
            operations: [...(istighfarData.operations || []), newIstighfarOperation(count)],
            updatedAt: new Date().toISOString(),
          };
          await saveIstighfarData(updated);
          setIstighfarData(updated);
          if (settings?.soundEnabled) playSoftClickSound();
          if (settings?.hapticsEnabled) triggerHaptic();
          showToast(`تم تطبيق ${count} استغفار على الهدف التاريخي`, 'success');
          return true;
        },
        dhikrReminderTimes,
        updateDhikrReminderTimes,
        toggleDhikrReminders,
        adhkarReminders,
        updateAdhkarReminder,
        adhkarFocus,
        setAdhkarFocus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
