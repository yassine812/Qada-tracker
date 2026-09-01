import { playSoftClickSound, triggerHaptic } from './streak';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Checks current browser notification permission
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Requests notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Sends a notification using Web Notification API or Service Worker
 */
export async function sendNotification(
  title: string,
  body: string,
  tag = 'qada-daily-reminder'
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Check if browser notifications supported & granted
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      // Try service worker first if available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon: '/icons/icon-192.png?v=3',
          badge: '/icons/icon-192.png?v=3',
          tag,
          dir: 'rtl',
          lang: 'ar',
        } as NotificationOptions);
        return true;
      } else {
        // Fallback to standard Notification constructor
        new Notification(title, {
          body,
          icon: '/icons/icon-192.png?v=3',
          tag,
          dir: 'rtl',
          lang: 'ar',
        });
        return true;
      }
    } catch (err) {
      console.warn('Direct notification failed, relying on in-app reminder:', err);
    }
  }

  return false;
}

/**
 * Formats a 24-hour time string (e.g., "21:30" or "06:15") into localized 12-hour Arabic text
 */
export function formatArabicTime(timeStr: string): string {
  if (!timeStr || !timeStr.includes(':')) return timeStr;

  const [hStr, mStr] = timeStr.split(':');
  let hours = parseInt(hStr, 10);
  const minutes = mStr.padStart(2, '0');

  if (isNaN(hours)) return timeStr;

  const period = hours >= 12 ? 'مساءً' : 'صباحاً';
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;

  return `${hours}:${minutes} ${period}`;
}

/**
 * Triggers a test reminder
 */
export async function triggerTestReminder(
  soundEnabled = true,
  hapticsEnabled = true
): Promise<{ success: boolean; browserNotified: boolean }> {
  if (soundEnabled) playSoftClickSound();
  if (hapticsEnabled) triggerHaptic();

  const browserNotified = await sendNotification(
    'تذكير قضاء الصلوات 🤲',
    'هذا تنبيه تجريبي لتذكيرك بتسجيل صلواتك الفائتة المقضية اليوم.'
  );

  return {
    success: true,
    browserNotified,
  };
}
