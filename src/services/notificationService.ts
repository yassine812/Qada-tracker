import { defaultPushPreferences, normalizePushPreferences, type PushPreferences } from './pushPreferences';
import { getPrayerSettings } from '../utils/prayerTimes';
import { markNotificationsRequested } from './startupState';
import { readQadaTracking } from './qadaTracking';

export type NotificationPermissionState = NotificationPermission | 'unsupported';
export type PushClient = { id: string; token: string; enabled: boolean; api: string; publicKey?: string; preferences: PushPreferences; timezone: string; pendingDisable?: boolean; pendingPreferencesSync?: boolean };
export const PUSH_API = (import.meta.env.VITE_PUSH_API_URL || '/api/notifications').replace(/\/$/, '');
// Shared schema with sw.js; never include this capability in worship-data backups.
export async function pushStorage(value?: PushClient): Promise<PushClient | undefined> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('qada-web-push', 1);
    open.onupgradeneeded = () => { open.result.createObjectStore('state'); open.result.createObjectStore('seen'); };
    open.onerror = () => reject(new Error('storage_unavailable'));
    open.onsuccess = () => {
      const db = open.result; const tx = db.transaction('state', value ? 'readwrite' : 'readonly');
      const request = value ? tx.objectStore('state').put(value, 'client') : tx.objectStore('state').get('client');
      tx.oncomplete = () => { db.close(); resolve(value || request.result); };
      tx.onerror = () => { db.close(); reject(new Error('storage_unavailable')); };
    };
  });
}
export const getPermissionState = (): NotificationPermissionState => 'Notification' in window ? Notification.permission : 'unsupported';
// Traditional Web Push is exposed through the worker registration. Do not
// require a window-level PushManager constructor when that API is available.
export const hasPushManager = () => {
  const pushWindow = window as unknown as { PushManager?: unknown; ServiceWorkerRegistration?: { prototype: object } };
  return 'PushManager' in pushWindow || Boolean(pushWindow.ServiceWorkerRegistration && 'pushManager' in pushWindow.ServiceWorkerRegistration.prototype);
};
export const supportsPush = () => window.isSecureContext && 'Notification' in window && 'serviceWorker' in navigator && hasPushManager();
export const timezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
// Diagnostic label only. API feature detection determines support.
export const platform = () => /Android/i.test(navigator.userAgent) ? 'Android' : /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'iOS' : 'Desktop';
export const standalone = () => window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
/** Explain the missing capability without mislabelling Safari as incompatible. */
export function getPushSupportMessage(): string | null {
  if (supportsPush()) return null;
  if (!window.isSecureContext) return 'افتح قضاء من رابطه الآمن https لتفعيل الإشعارات.';
  if (platform() === 'iOS') {
    const version = navigator.userAgent.match(/OS (\d+)[._](\d+)/i);
    if (version && (Number(version[1]) < 16 || (Number(version[1]) === 16 && Number(version[2]) < 4))) {
      return 'إشعارات قضاء تحتاج iOS أو iPadOS 16.4 أو أحدث. حدّث الجهاز إن كان التحديث متاحًا.';
    }
    if (!standalone()) return 'على iPhone وiPad، أضف قضاء إلى الشاشة الرئيسية ثم افتحه من أيقونته لتفعيل الإشعارات. فتحه في Safari وحده لا يكفي.';
    return 'الإشعارات غير متاحة في هذه النسخة على جهازك. تحقق من تحديث iOS أو iPadOS إلى 16.4 أو أحدث، ومن فتح قضاء كتطبيق من الشاشة الرئيسية.';
  }
  return 'الإشعارات غير متاحة في هذا المتصفح. جرّب فتح قضاء في متصفح محدّث يدعم إشعارات الويب.';
}
export class PushError extends Error { constructor(public code: string) { super(code); } }
export async function pushRequest(action: string, client?: PushClient, body?: unknown) {
  const response = await fetch(PUSH_API + '/' + action, {
    method: body === undefined ? 'GET' : 'POST', cache: 'no-store', credentials: 'omit',
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(client ? { Authorization: 'Bearer ' + client.token, 'X-Qada-Device': client.id } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(20000),
  });
  let result: any;
  try { result = await response.json(); } catch { throw new PushError('backend_unavailable'); }
  if (!response.ok) throw new PushError(result.error || 'backend_unavailable');
  return result;
}
const keyBytes = (key: string) => Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const newClient = (): PushClient => ({ id: crypto.randomUUID(), token: Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join(''),
  api: PUSH_API, enabled: false, timezone: timezone(), preferences: defaultPushPreferences(getPrayerSettings()) });
export async function getPushClient() {
  const stored = await pushStorage();
  const client = stored || newClient();
  const tracking = readQadaTracking();
  return { ...client, preferences: { ...normalizePushPreferences(client.preferences), ...(tracking ? { qadaTracking: tracking } : {}) } };
}
async function syncClient(client: PushClient, subscription: PushSubscription) {
  const tracking = readQadaTracking();
  const next = { ...client, pendingPreferencesSync: false,
    preferences: { ...client.preferences, ...(tracking ? { qadaTracking: tracking } : {}) } };
  await pushRequest('subscribe', next, { subscription: subscription.toJSON(), platform: platform(), timezone: next.timezone, preferences: next.preferences });
  await pushStorage(next);
}
let enableTask: Promise<PushClient> | null = null;
export function enablePush(preferences: PushPreferences): Promise<PushClient> {
  if (enableTask) return enableTask;
  if (!supportsPush()) return Promise.reject(new PushError('unsupported'));
  // Must run before network/IDB awaits, directly inside the explicit user click.
  markNotificationsRequested();
  const permissionRequest = requestPushPermission();
  enableTask = (async () => {
    const permission = await permissionRequest;
    if (permission !== 'granted') throw new PushError(permission === 'denied' ? 'permission_denied' : 'permission_dismissed');
    const client = await getPushClient();
    const next = { ...client, api: PUSH_API, enabled: true, pendingDisable: false, timezone: timezone(), preferences: { ...preferences, enabled: true } };
    // Save consent before contacting the server. A temporary outage is not an opt-out.
    await pushStorage(next);
    return completePushRegistration(next);
  })().finally(() => { enableTask = null; });
  return enableTask;
}
let permissionTask: Promise<NotificationPermissionState> | null = null;
function requestPushPermission(): Promise<NotificationPermissionState> {
  const current = getPermissionState();
  if (current !== 'default') return Promise.resolve(current);
  if (permissionTask) return permissionTask;
  try {
    // Start immediately within the click; do not defer behind storage/network.
    permissionTask = Promise.resolve(Notification.requestPermission())
      .catch(() => { throw new PushError('permission_unavailable'); })
      .finally(() => { permissionTask = null; });
    return permissionTask;
  } catch { return Promise.reject(new PushError('permission_unavailable')); }
}
let registrationTask: Promise<PushClient> | null = null;
function completePushRegistration(client: PushClient): Promise<PushClient> {
  if (registrationTask) return registrationTask;
  registrationTask = registerPushClient(client).finally(() => { registrationTask = null; });
  return registrationTask;
}
async function registerPushClient(client: PushClient): Promise<PushClient> {
  const config = await pushRequest('config');
  if (!config.publicKey) throw new PushError('backend_unavailable');
  await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (subscription && client.publicKey && client.publicKey !== config.publicKey) {
    await subscription.unsubscribe(); subscription = null;
  }
  if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(config.publicKey) });
  // Respect a disable action made while registration was awaiting the network.
  const latest = await pushStorage();
  if (!latest?.enabled || latest.pendingDisable) return latest || client;
  const next = { ...latest, api: PUSH_API, publicKey: config.publicKey, timezone: timezone() };
  try { await syncClient(next, subscription); }
  catch (error) {
    // Browser storage may have been cleared while the push-service subscription
    // survived. Never take over its old DB row without the original capability.
    if (error instanceof PushError && error.code === 'subscription_already_registered') {
      await subscription.unsubscribe();
      const fresh = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(config.publicKey) });
      try { await syncClient(next, fresh); }
      catch (retryError) { throw retryError; }
    } else { throw error; }
  }
  return next;
}
export async function disablePush() {
  const client = await getPushClient();
  const next = { ...client, enabled: false, pendingDisable: true };
  await pushStorage(next); // Worker observes disabled state even when backend is unreachable.
  const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration('/') : undefined;
  await (await registration?.pushManager.getSubscription())?.unsubscribe();
  try { await pushRequest('unsubscribe', client, {}); }
  catch (error) { if (!(error instanceof PushError && error.code === 'device_not_registered')) throw error; }
  await pushStorage({ ...next, pendingDisable: false });
}
export async function savePushPreferences(preferences: PushPreferences) {
  const client = await getPushClient();
  const next = { ...client, preferences, timezone: timezone() };
  if (client.enabled) {
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription || getPermissionState() !== 'granted') throw new PushError('subscription_missing');
    await syncClient(next, subscription);
  } else await pushStorage(next);
}
let reconciliation = Promise.resolve();
export function reconcilePush(): Promise<void> {
  const update = reconciliation.then(reconcileDevice);
  reconciliation = update.catch(() => {});
  return update;
}
async function reconcileDevice() {
  let client = await pushStorage();
  if (!client) return;
  const tracking = readQadaTracking();
  if (tracking && JSON.stringify(tracking) !== JSON.stringify(client.preferences.qadaTracking)) {
    client = { ...client, pendingPreferencesSync: true, preferences: { ...client.preferences, qadaTracking: tracking } };
    // The worker can suppress an already-queued reminder even while offline.
    await pushStorage(client);
  }
  if (!navigator.onLine) return;
  if (client.pendingDisable) { await disablePush(); return; }
  if (!client.enabled || !supportsPush()) return;
  if (getPermissionState() !== 'granted') { await disablePush(); return; }
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) { await completePushRegistration(client); return; }
  const config = await pushRequest('config');
  if (client.publicKey !== config.publicKey) { await completePushRegistration(client); return; }
  let active = false;
  try { active = Boolean((await pushRequest('status', client)).subscriptionActive); }
  catch (error) { if (!(error instanceof PushError && error.code === 'device_not_registered')) throw error; }
  const settings = getPrayerSettings();
  const preferences = { ...normalizePushPreferences(client.preferences), prayerSettings: { latitude: settings.latitude, longitude: settings.longitude, method: settings.method, madhab: settings.madhab } };
  const next = { ...client, api: PUSH_API, timezone: timezone(), preferences };
  if (!active || client.pendingPreferencesSync || JSON.stringify(next) !== JSON.stringify(client)) await syncClient(next, subscription);
}
export async function notificationStatus() {
  const supported = supportsPush(); const permission = getPermissionState();
  const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration('/') : undefined;
  const subscription = supported ? await registration?.pushManager?.getSubscription() : null;
  const client = await getPushClient();
  let backend: any = null, config: any = null, error: string | null = null;
  try {
    config = await pushRequest('config');
    backend = await pushRequest('status?supported=' + supported + '&permission=' + permission + '&subscribed=' + Boolean(subscription), client);
  } catch (e) { error = e instanceof PushError ? e.code : 'backend_unavailable'; }
  const keyMatches = Boolean(config?.publicKey && client.publicKey === config.publicKey);
  return { supported, permission, worker: Boolean(registration?.active), pushApi: hasPushManager(), subscribed: Boolean(subscription),
    requestedEnabled: client.enabled,
    enabled: Boolean(supported && permission === 'granted' && registration?.active && subscription && client.enabled && backend?.subscriptionActive && keyMatches),
    backend, config, error, platform: platform(), standalone: standalone(), timezone: timezone(), needsResubscribe: Boolean(client.enabled && (!subscription || !backend?.subscriptionActive || !keyMatches)) };
}
// These requests create durable server jobs, never page timers.
export async function sendTestNotification(delaySeconds: 0 | 60) {
  const client = await getPushClient();
  const pendingKey = 'qada-push-test-' + delaySeconds;
  const requestId = sessionStorage.getItem(pendingKey) || crypto.randomUUID();
  sessionStorage.setItem(pendingKey, requestId);
  const result = await pushRequest('test', client, { delaySeconds, requestId });
  sessionStorage.removeItem(pendingKey);
  return result;
}
