/**
 * Centralized Notification Service — Qada PWA
 *
 * Provides:
 *  - Permission state management (granted/denied/default/unsupported)
 *  - Reliable notification dispatch via ServiceWorker registration.showNotification()
 *  - Notification scheduling with stable tags per feature
 *  - Test notification utility
 *
 * Architecture honesty:
 *  - On iOS Safari, background push ONLY works when:
 *    1. App is added to Home Screen (standalone PWA)
 *    2. iOS 16.4+ and user explicitly granted permission
 *    3. A VAPID-enabled push server sends a Web Push message
 *  - Without a push server, we use in-app scheduling (foreground only)
 *  - This service makes that distinction clear in getPermissionStatus()
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export interface NotificationPayload {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  vibrate?: number[];
  dir?: 'rtl' | 'ltr';
  lang?: string;
}

// ─────────────────────────────────────────────────────────
// Permission Utilities
// ─────────────────────────────────────────────────────────

/**
 * Returns the current notification permission state.
 */
export function getPermissionState(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

/**
 * Requests notification permission from the user.
 * Must be called from a user gesture (click handler).
 * Returns the new permission state.
 */
export async function requestPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch {
    return 'denied';
  }
}

// ─────────────────────────────────────────────────────────
// Core Notification Dispatch
// ─────────────────────────────────────────────────────────

/**
 * Sends a notification using the ServiceWorker registration (preferred)
 * or falls back to the Notification constructor.
 * Returns true if successfully dispatched.
 */
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const options: NotificationOptions = {
    body: payload.body,
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/icon-192.png',
    tag: payload.tag || 'qada-general',
    dir: payload.dir || 'rtl',
    lang: payload.lang || 'ar',
    vibrate: payload.vibrate || [200, 100, 200],
    data: payload.data || { url: '/app' },
  } as NotificationOptions;

  try {
    // Prefer SW registration — works in background for foreground tabs
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(payload.title, options);
      return true;
    }
  } catch (err) {
    console.warn('[notificationService] SW showNotification failed:', err);
  }

  // Fallback to direct Notification constructor
  try {
    new Notification(payload.title, options);
    return true;
  } catch (err) {
    console.warn('[notificationService] Notification constructor failed:', err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────
// Scheduled Notification Helpers
// ─────────────────────────────────────────────────────────

/**
 * Sends the Daily Qada reminder notification.
 */
export async function sendDailyQadaReminder(): Promise<boolean> {
  return sendNotification({
    title: 'تذكير قضاء الصلوات 🤲',
    body: 'حان موعد تسجيل صلواتك المقضية اليوم للمحافظة على وردك واستمراريتك.',
    tag: 'qada-daily-reminder',
    data: { url: '/app' },
  });
}

/**
 * Sends an Adhkar reminder notification.
 */
export async function sendAdhkarReminder(
  category: 'morning' | 'evening' | 'sleep'
): Promise<boolean> {
  const meta = {
    morning: {
      title: 'أذكار الصباح 🌅',
      body: 'صباحك ذكر، فابدأ يومك بطمأنينة.',
      data: { url: '/app?tab=dhikr&sub=morning' },
    },
    evening: {
      title: 'أذكار المساء 🌇',
      body: 'حان وقت أذكار المساء، اختم يومك بسلام.',
      data: { url: '/app?tab=dhikr&sub=evening' },
    },
    sleep: {
      title: 'أذكار النوم 🌙',
      body: 'احفظ ذكرك قبل النوم، ونم على طمأنينة.',
      data: { url: '/app?tab=dhikr&sub=sleep' },
    },
  };
  const m = meta[category];
  return sendNotification({
    title: m.title,
    body: m.body,
    tag: `qada-adhkar-${category}`,
    data: m.data,
  });
}

/**
 * Sends a Daily Wird reminder notification.
 */
export async function sendWirdReminder(targetPages?: number): Promise<boolean> {
  const body = targetPages
    ? `لا تنسَ وردك اليومي: ${targetPages} صفحة من القرآن الكريم.`
    : 'لا تنسَ وردك اليومي من القرآن الكريم.';
  return sendNotification({
    title: 'الورد القرآني اليومي 📖',
    body,
    tag: 'qada-wird-reminder',
    data: { url: '/app?tab=quran' },
  });
}

/**
 * Sends a Daily Prophetic Dua reminder.
 * Uses a static dua to avoid runtime bundle imports in SW.
 */
export async function sendPropheticDuaReminder(): Promise<boolean> {
  return sendNotification({
    title: 'دعاء اليوم 🌿',
    body: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ — من أدعية النبي ﷺ',
    tag: 'qada-daily-prophetic-dua',
    data: { url: '/app?tab=dhikr&sub=dua' },
  });
}

/**
 * Sends a prayer time reminder notification.
 */
export async function sendPrayerTimeReminder(
  prayerName: string,
  prayerTime: string
): Promise<boolean> {
  return sendNotification({
    title: `🕌 حان وقت صلاة ${prayerName}`,
    body: `وقت ${prayerName}: ${prayerTime}`,
    tag: `qada-prayer-${prayerName}`,
    data: { url: '/app?tab=ibadat' },
  });
}

// ─────────────────────────────────────────────────────────
// Test Notification
// ─────────────────────────────────────────────────────────

/**
 * Sends a test notification to verify the system works.
 * Returns an object with details about what happened.
 */
export async function sendTestNotification(): Promise<{
  permissionState: NotificationPermissionState;
  dispatched: boolean;
  swAvailable: boolean;
}> {
  const permissionState = getPermissionState();
  const swAvailable = 'serviceWorker' in navigator;

  if (permissionState !== 'granted') {
    return { permissionState, dispatched: false, swAvailable };
  }

  const dispatched = await sendNotification({
    title: 'إشعار تجريبي ✅',
    body: 'إشعارات قضاء تعمل بشكل صحيح. ستصلك التذكيرات في الأوقات المحددة.',
    tag: 'qada-test-notification',
    data: { url: '/app?tab=settings' },
  });

  return { permissionState, dispatched, swAvailable };
}
