import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  BackupData,
  DailyRecord,
  IstighfarData,
  IstighfarRecord,
  IstighfarStats,
  PrayerCounters,
  PrayerKey,
  StatsSummary,
  TabType,
  UserSettings,
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
import { calculateMissedPrayers, createInitialCounters } from '../utils/calculator';
import {
  computeStatsSummary,
  getTodayDateString,
  playSoftClickSound,
  triggerHaptic,
} from '../utils/streak';
import { sendNotification } from '../utils/notifications';

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
    customCounters?: PrayerCounters
  ) => Promise<void>;
  recordTodayPrayers: (counts: Record<PrayerKey, number>) => Promise<boolean>;
  recordQuickPrayer: (prayerKey: PrayerKey, count: number) => Promise<boolean>;
  updatePrayerRemainingCount: (prayerKey: PrayerKey, newRemaining: number) => Promise<boolean>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  exportBackup: () => Promise<void>;
  importBackup: (file: File) => Promise<boolean>;
  resetAll: () => Promise<void>;
  recalculatePrayers: (
    pubertyAge: number,
    currentAge: number,
    prayerFrequency: number
  ) => Promise<void>;
  istighfarRecords: IstighfarRecord[];
  todayIstighfarCount: number;
  istighfarStats: IstighfarStats;
  incrementIstighfar: () => Promise<void>;
  decrementIstighfar: () => Promise<void>;
  istighfarData: IstighfarData | null;
  setupIstighfar: (startAge: number, currentAge: number, dailyTarget: number) => Promise<void>;
  recordIstighfarCompensation: (count: number) => Promise<boolean>;
  updateIstighfarEstimate: (newTotal: number) => Promise<void>;
  recalculateIstighfar: (startAge: number, currentAge: number, dailyTarget: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [counters, setCounters] = useState<PrayerCounters | null>(null);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [istighfarRecords, setIstighfarRecords] = useState<IstighfarRecord[]>([]);
  const [istighfarData, setIstighfarData] = useState<IstighfarData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showReminderDialog, setShowReminderDialog] = useState<boolean>(false);

  // Initialize and load from IndexedDB
  const loadData = async () => {
    try {
      setLoading(true);
      const [savedSettings, savedCounters, savedRecords, savedIstighfar, savedIstighfarData] = await Promise.all([
        getSettings(),
        getCounters(),
        getDailyRecords(),
        getIstighfarRecords(),
        getIstighfarData(),
      ]);

      if (savedSettings) {
        // Ensure reminder defaults for backward compatibility
        const sanitized: UserSettings = {
          ...savedSettings,
          reminderEnabled: savedSettings.reminderEnabled ?? false,
          reminderTime: savedSettings.reminderTime || '21:00',
        };
        setSettings(sanitized);
      } else {
        setSettings(null);
      }
      setCounters(savedCounters);
      setRecords(savedRecords);
      setIstighfarRecords(savedIstighfar);
      setIstighfarData(savedIstighfarData);
    } catch (error) {
      console.error('Failed to load local data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Daily reminder background check interval
  useEffect(() => {
    if (!settings || !settings.reminderEnabled || !settings.reminderTime) return;

    const checkReminder = async () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayDate = getTodayDateString();

      // Trigger if today has not been notified and current time is equal or past configured reminder time
      if (
        settings.lastReminderDate !== todayDate &&
        currentTimeStr >= settings.reminderTime
      ) {
        // Send Web/PWA Notification
        sendNotification(
          'تذكير قضاء الصلوات 🤲',
          'حان موعد تسجيل صلواتك المقضية اليوم للمحافظة على وردك واستمراريتك.'
        );

        if (settings.soundEnabled) playSoftClickSound();
        if (settings.hapticsEnabled) triggerHaptic();

        setShowReminderDialog(true);

        const updatedSettings: UserSettings = {
          ...settings,
          lastReminderDate: todayDate,
          updatedAt: new Date().toISOString(),
        };
        await saveSettings(updatedSettings);
        setSettings(updatedSettings);
      }
    };

    checkReminder();
    const interval = setInterval(checkReminder, 30000);
    return () => clearInterval(interval);
  }, [
    settings?.reminderEnabled,
    settings?.reminderTime,
    settings?.lastReminderDate,
    settings?.soundEnabled,
    settings?.hapticsEnabled,
  ]);

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
    return computeStatsSummary(counters, records);
  }, [counters, records]);

  // Setup istighfar historical tracking
  const setupIstighfar = async (startAge: number, currentAge: number, dailyTarget: number) => {
    const years = currentAge - startAge;
    const totalEstimated = years * 365 * dailyTarget;
    const data: IstighfarData = {
      hasCompletedSetup: true,
      startAge,
      currentAge,
      dailyTarget,
      totalEstimated,
      completed: 0,
      remaining: totalEstimated,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveIstighfarData(data);
    setIstighfarData(data);
  };

  // Record istighfar compensation
  const recordIstighfarCompensation = async (count: number): Promise<boolean> => {
    if (!istighfarData) return false;
    if (typeof count !== 'number' || isNaN(count) || !Number.isInteger(count) || count <= 0) {
      showToast('يرجى إدخال عدد صحيح أكبر من صفر', 'error');
      return false;
    }
    if (count > istighfarData.remaining) {
      showToast(`لا يمكنك تسجيل أكثر من المتبقي (${istighfarData.remaining})`, 'error');
      return false;
    }

    const newCompleted = istighfarData.completed + count;
    const newRemaining = istighfarData.totalEstimated - newCompleted;
    const updated: IstighfarData = {
      ...istighfarData,
      completed: newCompleted,
      remaining: newRemaining,
      updatedAt: new Date().toISOString(),
    };

    await saveIstighfarData(updated);
    setIstighfarData(updated);

    // Also add to daily istighfar records
    const todayStr = getTodayDateString();
    const existing = istighfarRecords.find((r) => r.date === todayStr);
    const dailyRecord: IstighfarRecord = {
      id: existing ? existing.id : `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: todayStr,
      count: (existing ? existing.count : 0) + count,
      timestamp: Date.now(),
    };
    setIstighfarRecords((prev) => {
      const filtered = prev.filter((r) => r.date !== todayStr);
      return [dailyRecord, ...filtered];
    });
    try {
      await saveIstighfarRecord(dailyRecord);
    } catch (err) {
      console.warn('Storage sync error:', err);
    }

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
      remaining: newTotal - istighfarData.completed,
      updatedAt: new Date().toISOString(),
    };
    await saveIstighfarData(updated);
    setIstighfarData(updated);
    showToast('تم تحديث تقدير الاستغفار', 'success');
  };

  // Recalculate istighfar
  const recalculateIstighfar = async (startAge: number, currentAge: number, dailyTarget: number) => {
    const years = currentAge - startAge;
    const totalEstimated = years * 365 * dailyTarget;
    const updated: IstighfarData = {
      ...istighfarData!,
      startAge,
      currentAge,
      dailyTarget,
      totalEstimated,
      remaining: totalEstimated - (istighfarData?.completed || 0),
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
    return todayRecord ? todayRecord.count : 0;
  }, [istighfarRecords]);

  // Compute istighfar stats
  const istighfarStats = useMemo((): IstighfarStats => {
    const totalCount = istighfarRecords.reduce((sum, r) => sum + r.count, 0);
    const completedDays = istighfarRecords.filter((r) => r.count >= 70).length;
    const uniqueDays = new Set(istighfarRecords.filter((r) => r.count > 0).map((r) => r.date)).size;
    const dailyAverage = uniqueDays > 0 ? Number((totalCount / uniqueDays).toFixed(1)) : 0;
    return { totalCount, completedDays, dailyAverage };
  }, [istighfarRecords]);

  // Increment istighfar counter
  const incrementIstighfar = async () => {
    if (todayIstighfarCount >= 70) return;

    const todayStr = getTodayDateString();
    const newCount = todayIstighfarCount + 1;
    const existing = istighfarRecords.find((r) => r.date === todayStr);

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
    } catch (err) {
      console.warn('Storage sync error:', err);
    }

    if (newCount === 70) {
      showToast('أكملت 70 استغفارًا اليوم 🤍', 'success');
    }
  };

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
    customCounters?: PrayerCounters
  ) => {
    let initialCounters: PrayerCounters;
    if (customCounters) {
      initialCounters = customCounters;
    } else {
      const calc = calculateMissedPrayers(pubertyAge, currentAge, prayerFrequency);
      initialCounters = createInitialCounters(calc.perPrayer);
    }

    const newSettings: UserSettings = {
      hasCompletedOnboarding: true,
      pubertyAge,
      currentAge,
      prayerFrequency,
      theme: 'light',
      hapticsEnabled: true,
      soundEnabled: true,
      reminderEnabled: false,
      reminderTime: '21:00',
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
    prayerFrequency: number
  ) => {
    const calc = calculateMissedPrayers(pubertyAge, currentAge, prayerFrequency);
    const newCounters = createInitialCounters(calc.perPrayer);

    if (settings) {
      const updatedSettings: UserSettings = {
        ...settings,
        pubertyAge,
        currentAge,
        prayerFrequency,
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
        deleteRecord,
        exportBackup,
        importBackup,
        resetAll,
        recalculatePrayers,
        istighfarRecords,
        todayIstighfarCount,
        istighfarStats,
        incrementIstighfar,
        decrementIstighfar,
        istighfarData,
        setupIstighfar,
        recordIstighfarCompensation,
        updateIstighfarEstimate,
        recalculateIstighfar,
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
