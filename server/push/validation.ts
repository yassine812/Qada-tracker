import { createHash } from 'node:crypto';
import { DateTime } from 'luxon';
import { prayerIds, reminderLabels, type PushPreferences, type TimedReminder } from '../../src/services/pushPreferences.js';

export class HttpError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
function requireValue(condition: unknown, code = 'invalid_payload'): asserts condition {
  if (!condition) throw new HttpError(400, code);
}
const boolean = (v: unknown) => { requireValue(typeof v === 'boolean'); return v; };
const days = (v: unknown): number[] => {
  requireValue(Array.isArray(v) && v.length <= 7 && v.every(n => Number.isInteger(n) && n >= 1 && n <= 7));
  return [...new Set(v)];
};
const hijriDays = (v: unknown): number[] => {
  requireValue(Array.isArray(v) && v.length <= 3 && v.every(n => Number.isInteger(n) && n >= 1 && n <= 30));
  return [...new Set(v)];
};
const minutesBefore = (v: unknown): number => {
  requireValue(Number.isInteger(v) && (v as number) >= 5 && (v as number) <= 180);
  return v as number;
};
const timed = (v: any): TimedReminder => {
  requireValue(v && typeof v.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v.time));
  return { enabled: boolean(v.enabled), time: v.time };
};
export function validateTimezone(value: unknown): string {
  requireValue(typeof value === 'string' && value.length <= 100 && DateTime.now().setZone(value).isValid, 'invalid_timezone');
  return value;
}
export function validatePreferences(v: any): PushPreferences {
  requireValue(v && v.prayers && v.reminders && v.prayerSettings);
  const p = v.prayerSettings;
  requireValue(Number.isFinite(p.latitude) && Math.abs(p.latitude) <= 90 && Number.isFinite(p.longitude) && Math.abs(p.longitude) <= 180);
  requireValue(['MuslimWorldLeague', 'Egyptian', 'UmmAlQura', 'Tunisian', 'NorthAmerica'].includes(p.method));
  requireValue(['shafi', 'hanafi'].includes(p.madhab));
  requireValue(Array.isArray(v.custom) && v.custom.length <= 10);
  const custom = v.custom.map((c: any) => {
    requireValue(c && uuidPattern.test(c.id));
    return { ...timed(c), id: c.id, days: days(c.days) };
  });
  requireValue(new Set(custom.map((c: any) => c.id)).size === custom.length);
  let qadaTracking: PushPreferences['qadaTracking'];
  if (v.qadaTracking !== undefined) {
    requireValue(v.qadaTracking && Array.isArray(v.qadaTracking.completedDates) && v.qadaTracking.completedDates.length <= 32);
    requireValue(v.qadaTracking.completedDates.every((date: unknown) => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && DateTime.fromISO(date).isValid));
    qadaTracking = { hasRemaining: boolean(v.qadaTracking.hasRemaining), completedDates: [...new Set<string>(v.qadaTracking.completedDates)].sort() };
  }
  return {
    ...(qadaTracking ? { qadaTracking } : {}),
    enabled: boolean(v.enabled),
    prayers: Object.fromEntries(prayerIds.map(id => [id, boolean(v.prayers[id])])) as PushPreferences['prayers'],
    prayerSettings: { latitude: p.latitude, longitude: p.longitude, method: p.method, madhab: p.madhab },
    reminders: Object.fromEntries(Object.keys(reminderLabels).map(id => [id, timed(v.reminders[id])])) as PushPreferences['reminders'],
    fastingDays: days(v.fastingDays), fastingHijriDays: hijriDays(v.fastingHijriDays ?? [13, 14, 15]),
    whiteDayNotifications: typeof v.whiteDayNotifications === 'undefined' ? true : boolean(v.whiteDayNotifications),
    beforeMaghrib: {
      enabled: typeof v.beforeMaghrib?.enabled === 'undefined' ? false : boolean(v.beforeMaghrib.enabled),
      minutesBefore: minutesBefore(v.beforeMaghrib?.minutesBefore ?? 30),
    },
    custom,
  };
}
export function validateSubscription(s: any) {
  requireValue(s && typeof s.endpoint === 'string' && s.endpoint.length <= 4096 && s.keys);
  let url: URL;
  try { url = new URL(s.endpoint); } catch { throw new HttpError(400, 'invalid_endpoint'); }
  // This server must not become an SSRF proxy. Only recognized push-service hosts.
  const host = url.hostname;
  const allowed = host === 'fcm.googleapis.com' || host === 'updates.push.services.mozilla.com'
    || host.endsWith('.push.services.mozilla.com') || host === 'web.push.apple.com'
    || host.endsWith('.push.apple.com') || host.endsWith('.notify.windows.com');
  requireValue(url.protocol === 'https:' && !url.username && !url.password && !url.hash && (!url.port || url.port === '443') && allowed, 'unsupported_push_endpoint');
  const key = (value: unknown, bytes: number) => {
    requireValue(typeof value === 'string' && /^[A-Za-z0-9_-]+={0,2}$/.test(value) && value.length < 200);
    const decoded = Buffer.from(value, 'base64url');
    requireValue(decoded.length === bytes && (bytes !== 65 || decoded[0] === 4), 'invalid_subscription_keys');
    return value;
  };
  return { endpoint: url.href, keys: { p256dh: key(s.keys.p256dh, 65), auth: key(s.keys.auth, 16) } };
}
