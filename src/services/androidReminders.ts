import { App } from '@capacitor/app';
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications';
import { DateTime } from 'luxon';
import { planNotifications } from '../../server/push/schedule';
import { getDailyPropheticDua } from '../data/propheticDuas';
import { getPrayerSettings } from '../utils/prayerTimes';
import { getPushClient, pushStorage } from './notificationService';
import type { PushPreferences } from './pushPreferences';
import { hasRequestedNotifications, markNotificationsRequested } from './startupState';
import { QADA_TRACKING_CHANGED } from './qadaTracking';

// Keep pending alarms below Android vendor limits even with all reminder types on.
const reminderDays = 14;
let startup: Promise<void> | undefined;
let queue = Promise.resolve();

function syncReminders(): Promise<void> {
  const update = queue.then(updateReminders);
  queue = update.catch(() => {});
  return update;
}

async function updateReminders() {
  const { display } = await LocalNotifications.checkPermissions();
  const { notifications: pending } = await LocalNotifications.getAll({ state: 'SCHEDULED' });
  const owned = pending.filter(item => typeof item.extra?.qadaReminderKey === 'string');
  if (display !== 'granted') {
    if (owned.length) await LocalNotifications.cancel({ notifications: owned.map(({ id }) => ({ id })) });
    return;
  }

  const { preferences } = await getPushClient();
  const now = new Date();
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = DateTime.fromJSDate(now).setZone(zone).startOf('day');
  const duas: Record<string, string> = {};
  if (preferences.reminders.dua.enabled) {
    for (let offset = 0; offset < reminderDays; offset++) {
      const day = today.plus({ days: offset });
      duas[day.toISODate()!] = getDailyPropheticDua(day.toJSDate()).id;
    }
  }
  const { latitude, longitude, method, madhab } = getPrayerSettings();
  const jobs = planNotifications({
    ...preferences, enabled: true, prayerSettings: { latitude, longitude, method, madhab },
  }, zone, now, duas, reminderDays).filter(job => Date.parse(job.due_at) > now.getTime());

  const plannedKeys = new Set(jobs.map(job => job.notification_id));
  const obsolete = owned.filter(item => !plannedKeys.has(item.extra.qadaReminderKey));
  if (obsolete.length) await LocalNotifications.cancel({ notifications: obsolete.map(({ id }) => ({ id })) });

  const existing = new Map(owned.map(item => [item.extra.qadaReminderKey, item]));
  const reserved = new Set(pending.map(item => item.id));
  const changes: LocalNotificationSchema[] = [];
  let nextId = 1_000_000;
  for (const job of jobs) {
    const { title, body, url } = job.payload;
    const previous = existing.get(job.notification_id);
    const signature = JSON.stringify([job.due_at, title, body, url]);
    if (previous?.extra.qadaReminderSignature === signature) continue;
    while (reserved.has(nextId)) nextId++;
    changes.push({
      id: previous?.id ?? nextId++, title, body,
      schedule: { at: new Date(job.due_at), allowWhileIdle: true },
      isExactNotification: false,
      extra: { qadaReminderKey: job.notification_id, qadaReminderSignature: signature, url },
    });
  }
  if (changes.length) await LocalNotifications.schedule({ notifications: changes });
}

export function startAndroidReminders(): Promise<void> {
  if (startup) return startup;
  startup = (async () => {
    const refresh = () => { void syncReminders().catch(() => {}); };
    await App.addListener('resume', refresh);
    window.addEventListener('qada-prayer-settings-changed', refresh);
    window.addEventListener(QADA_TRACKING_CHANGED, refresh);
    await LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
      const url: unknown = notification.extra?.url;
      if (typeof url === 'string' && /^\/app(?:[/?]|$)/.test(url)) window.location.assign(url);
    });
    const { display } = await LocalNotifications.checkPermissions();
    if ((display === 'prompt' || display === 'prompt-with-rationale') && !hasRequestedNotifications()) {
      await LocalNotifications.requestPermissions();
      markNotificationsRequested();
    }
    await syncReminders();
  })();
  return startup;
}

export async function saveAndroidReminderPreferences(preferences: PushPreferences): Promise<void> {
  const client = await getPushClient();
  await pushStorage({ ...client, preferences });
  await syncReminders();
}
