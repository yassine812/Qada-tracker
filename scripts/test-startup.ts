import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { build } from 'esbuild';
import { IDBFactory } from 'fake-indexeddb';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const storage = () => {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
};
const compile = async (entry: string) => (await build({ entryPoints: [entry], bundle: true, write: false, format: 'cjs', platform: 'browser', define: { 'import.meta.env': '{}' } })).outputFiles[0].text;

test('iPhone guidance distinguishes Safari tab, old iOS, installed app and actual API support', async () => {
  const code = await compile('src/services/notificationService.ts');
  const detect = ({ ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', home = false, api = false, workerApi = false, secure = true, ipad = false } = {}) => {
    const context = vm.createContext({ module: { exports: {} },
      window: { isSecureContext: secure, matchMedia: () => ({ matches: false }), ...(api ? { Notification: {}, PushManager: {} } : {}), ...(workerApi ? { Notification: {}, ServiceWorkerRegistration: { prototype: { pushManager: {} } } } : {}) },
      navigator: { userAgent: ua, platform: ipad ? 'MacIntel' : 'iPhone', maxTouchPoints: ipad ? 5 : 1, standalone: home, serviceWorker: {} },
    });
    vm.runInContext(code, context);
    return context.module.exports.getPushSupportMessage();
  };
  assert.match(detect(), /Safari وحده لا يكفي/);
  assert.match(detect({ ua: 'iPhone OS 16_3 like Mac OS X' }), /حدّث الجهاز/);
  assert.match(detect({ home: true }), /غير متاحة في هذه النسخة/);
  assert.equal(detect({ home: true, api: true }), null);
  assert.equal(detect({ home: true, workerApi: true }), null, 'worker push API works without a window-level PushManager constructor');
  assert.equal(detect({ api: true }), null, 'available APIs take precedence over diagnostic user agent labels');
  assert.match(detect({ ipad: true, ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Version/18.0 Safari/605.1.15' }), /Safari وحده لا يكفي/);
  assert.match(detect({ secure: false }), /https/);
});

test('Android asks once through the phone and schedules real reminders after consent', async () => {
  const code = (await build({
    entryPoints: ['src/services/androidReminders.ts'], bundle: true, write: false, format: 'cjs',
    platform: 'browser', external: ['@capacitor/app', '@capacitor/local-notifications'], define: { 'import.meta.env': '{}' },
  })).outputFiles[0].text;
  const localStorage = storage(), indexedDB = new IDBFactory();
  const trackingKey = 'qada:prayer-tracking:v1';
  localStorage.setItem(trackingKey, JSON.stringify({ hasRemaining: true, completedDates: [] }));
  const pending = new Map<number, any>();
  let permission = 'prompt', requests = 0, writes = 0;
  const localNotifications = {
    checkPermissions: async () => ({ display: permission }),
    requestPermissions: async () => { requests++; permission = 'granted'; return { display: permission }; },
    addListener: async () => {},
    getAll: async () => ({ notifications: Array.from(pending.values()) }),
    schedule: async ({ notifications }: { notifications: any[] }) => {
      writes++;
      for (const item of notifications) {
        assert.ok(item.schedule.at.getTime() > Date.now());
        assert.equal(item.isExactNotification, false, 'no second permission for exact alarms');
        pending.set(item.id, item);
      }
    },
    cancel: async ({ notifications }: { notifications: { id: number }[] }) => notifications.forEach(({ id }) => pending.delete(id)),
  };
  const launch = () => {
    const context = vm.createContext({ module: { exports: {} }, localStorage, indexedDB, crypto: globalThis.crypto, Intl, Date,
      window: { addEventListener() {} },
      require: (id: string) => id === '@capacitor/app' ? { App: { addListener: async () => {} } } : { LocalNotifications: localNotifications },
    });
    vm.runInContext(code, context);
    return context.module.exports;
  };
  const first = launch();
  await Promise.all([first.startAndroidReminders(), first.startAndroidReminders()]);
  assert.equal(requests, 1);
  assert.ok(Array.from(pending.values()).some(item => item.extra.qadaReminderKey.endsWith(':fajr')));
  assert.ok(Array.from(pending.values()).some(item => item.extra.qadaReminderKey.endsWith(':sleep')));
  assert.ok(pending.size < 400);
  const initialTrackers = Array.from(pending.values()).filter(item => item.extra.qadaReminderKey.endsWith(':qada-tracker'));
  assert.ok(initialTrackers.length >= 13);
  await launch().startAndroidReminders();
  assert.equal(writes, 1, 'reopening leaves existing alarms in place');
  const firstDate = initialTrackers[0].extra.qadaReminderKey.slice(0, 10);
  localStorage.setItem(trackingKey, JSON.stringify({ hasRemaining: true, completedDates: [firstDate] }));
  await launch().startAndroidReminders();
  assert.ok(!Array.from(pending.values()).some(item => item.extra.qadaReminderKey === firstDate + ':qada-tracker'));
  localStorage.setItem(trackingKey, JSON.stringify({ hasRemaining: true, completedDates: [] }));
  await launch().startAndroidReminders();
  assert.ok(Array.from(pending.values()).some(item => item.extra.qadaReminderKey === firstDate + ':qada-tracker'), 'undo restores the daily reminder');
  localStorage.setItem(trackingKey, JSON.stringify({ hasRemaining: false, completedDates: [] }));
  await launch().startAndroidReminders();
  assert.ok(!Array.from(pending.values()).some(item => item.extra.qadaReminderKey.endsWith(':qada-tracker')));
  permission = 'denied';
  await launch().startAndroidReminders();
  assert.equal(pending.size, 0, 'revoking permission cancels app alarms');
  permission = 'prompt';
  await launch().startAndroidReminders();
  assert.equal(requests, 1, 'a recorded permission request is not repeated on relaunch');
  assert.equal(pending.size, 0, 'no alarms until the phone grants permission');
});

test('entry prompts survive remounts and internal reloads; notification choice survives new launches', async () => {
  const code = await compile('src/services/startupState.ts');
  const sessionStorage = storage(), localStorage = storage();
  const load = (session = sessionStorage) => {
    const context = vm.createContext({ module: { exports: {} }, sessionStorage: session, localStorage });
    vm.runInContext(code, context);
    return context.module.exports;
  };
  const first = load();
  assert.equal(first.hasSeenLaunchPrompt('welcome'), false);
  first.markLaunchPromptSeen('welcome'); first.markLaunchPromptSeen('streak:user-a'); first.markNotificationsRequested();
  const reloaded = load();
  assert.equal(reloaded.hasSeenLaunchPrompt('welcome'), true);
  assert.equal(reloaded.hasSeenLaunchPrompt('streak:user-a'), true);
  assert.equal(reloaded.hasSeenLaunchPrompt('streak:user-b'), false);
  const newLaunch = load(storage());
  assert.equal(newLaunch.hasSeenLaunchPrompt('welcome'), false);
  assert.equal(newLaunch.hasSeenLaunchPrompt('streak:user-a'), false);
  assert.equal(newLaunch.hasRequestedNotifications(), true);
});

test('daily streak reminder survives new launches, resets tomorrow, and isolates accounts', async () => {
  const code = await compile('src/services/startupState.ts');
  const localStorage = storage();
  const load = () => {
    const context = vm.createContext({ module: { exports: {} }, localStorage, sessionStorage: storage() });
    vm.runInContext(code, context);
    return context.module.exports;
  };
  const first = load();
  assert.equal(first.hasSeenDailyPrompt('streak:a', '2026-10-30'), false);
  first.markDailyPromptSeen('streak:a', '2026-10-30');
  const reopened = load();
  assert.equal(reopened.hasSeenDailyPrompt('streak:a', '2026-10-30'), true);
  assert.equal(reopened.hasSeenDailyPrompt('streak:b', '2026-10-30'), false);
  assert.equal(reopened.hasSeenDailyPrompt('streak:a', '2026-10-31'), false);
  reopened.markDailyPromptSeen('streak:a', '2026-10-31');
  // A stale tab/clock must not overwrite the newer daily dismissal.
  first.markDailyPromptSeen('streak:a', '2026-10-30');
  assert.equal(load().hasSeenDailyPrompt('streak:a', '2026-10-31'), true);
});

test('daily reminder still deduplicates component remounts when storage is unavailable', async () => {
  const code = await compile('src/services/startupState.ts');
  const context = vm.createContext({ module: { exports: {} }, localStorage: {
    getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); },
  } });
  vm.runInContext(code, context);
  const prompts = context.module.exports as any;
  prompts.markDailyPromptSeen('streak:a', '2026-10-30');
  assert.equal(prompts.hasSeenDailyPrompt('streak:a', '2026-10-30'), true);
  assert.equal(prompts.hasSeenDailyPrompt('streak:a', '2026-10-31'), false);
});
test('granted notifications survive server failure and recover without a second permission request', async () => {
  const code = await compile('src/services/notificationService.ts');
  let online = false, prompts = 0, subscriptions = 0, subscription: any = null;
  const registration = { active: {}, pushManager: {
    getSubscription: async () => subscription,
    subscribe: async () => { subscriptions++; subscription = { toJSON: () => ({ endpoint: 'https://push.example.test/device' }), unsubscribe: async () => { subscription = null; return true; } }; return subscription; },
  } };
  const Notification = { permission: 'default', requestPermission: () => { prompts++; Notification.permission = 'granted'; return Promise.resolve('granted'); } };
  const localStorage = storage();
  const context = vm.createContext({ module: { exports: {} }, indexedDB: new IDBFactory(), crypto: globalThis.crypto, Intl, Date, AbortSignal, Uint8Array,
    atob: (value: string) => Buffer.from(value, 'base64').toString('binary'), localStorage,
    window: { isSecureContext: true, Notification, PushManager: {} }, Notification,
    navigator: { onLine: true, userAgent: 'test', serviceWorker: { register: async () => registration, ready: Promise.resolve(registration), getRegistration: async () => registration } },
    fetch: async (url: string) => {
      if (!online) throw new Error('temporary server outage');
      return { ok: true, json: async () => url.endsWith('/config') ? { publicKey: 'AQID' } : { subscriptionActive: true } };
    },
  });
  vm.runInContext(code, context);
  const service = context.module.exports;
  const client = await service.getPushClient();
  client.preferences.prayers.fajr = false;
  await assert.rejects(service.enablePush(client.preferences), /temporary server outage/);
  assert.equal(prompts, 1);
  assert.equal((await service.pushStorage()).enabled, true, 'an outage must not erase consent');
  online = true;
  await service.reconcilePush();
  assert.equal(prompts, 1);
  assert.equal(subscriptions, 1);
  assert.equal((await service.pushStorage()).preferences.prayers.fajr, false);
  await service.reconcilePush();
  assert.equal(prompts, 1); assert.equal(subscriptions, 1);
  context.navigator.onLine = false;
  localStorage.setItem('qada:prayer-tracking:v1', JSON.stringify({ hasRemaining: true, completedDates: ['2026-11-27'] }));
  await service.reconcilePush();
  assert.equal((await service.pushStorage()).pendingPreferencesSync, true);
  assert.equal((await service.pushStorage()).preferences.qadaTracking.completedDates[0], '2026-11-27');
  context.navigator.onLine = true;
  await service.reconcilePush();
  assert.equal((await service.pushStorage()).pendingPreferencesSync, false);
  // An expired browser subscription is silently repaired with existing permission.
  subscription = null;
  await service.reconcilePush();
  assert.equal(prompts, 1); assert.equal(subscriptions, 2);
  await service.disablePush();
  await service.reconcilePush();
  assert.equal(subscriptions, 2, 'an explicit opt-out must remain off');
});

test('blocked Android permission can be retried explicitly without repeated automatic requests', async () => {
  const code = await compile('src/services/notificationService.ts');
  let allow = false, requests = 0, fetches = 0, subscriptions = 0;
  let subscription: any = null;
  const registration = { active: {}, pushManager: {
    getSubscription: async () => subscription,
    subscribe: async () => { subscriptions++; return subscription = { toJSON: () => ({ endpoint: 'https://push.example.test/android' }) }; },
  } };
  const Notification = { permission: 'default', requestPermission: () => {
    requests++;
    if (!allow) return Promise.reject(new Error('Native permission UI unavailable'));
    Notification.permission = 'granted'; return Promise.resolve('granted');
  } };
  const localStorage = storage();
  const context = vm.createContext({ module: { exports: {} }, indexedDB: new IDBFactory(), crypto: globalThis.crypto, Intl, Date, AbortSignal, Uint8Array,
    atob: (value: string) => Buffer.from(value, 'base64').toString('binary'), localStorage,
    window: { isSecureContext: true, Notification, PushManager: {} }, Notification,
    navigator: { onLine: true, userAgent: 'Android', serviceWorker: { register: async () => registration, ready: Promise.resolve(registration), getRegistration: async () => registration } },
    fetch: async (url: string) => { fetches++; return { ok: true, json: async () => url.endsWith('/config') ? { publicKey: 'AQID' } : { subscriptionActive: true } }; },
  });
  vm.runInContext(code, context);
  const service = context.module.exports as any;
  const preferences = (await service.getPushClient()).preferences;
  const blocked = service.enablePush(preferences);
  assert.equal(requests, 1, 'native request starts in the tap, before any awaited work');
  assert.equal(service.enablePush(preferences), blocked, 'double taps share the complete activation');
  await assert.rejects(blocked, (e: any) => e.code === 'permission_unavailable');
  assert.equal(Boolean((await service.pushStorage())?.enabled), false);
  assert.equal(fetches, 0, 'blocked permission must not register a device');
  await service.reconcilePush();
  assert.equal(requests, 1, 'reopening must never retry native permission automatically');
  allow = true;
  await Promise.all([service.enablePush(preferences), service.enablePush(preferences)]);
  assert.equal(requests, 2); assert.equal(subscriptions, 1);
  assert.equal((await service.pushStorage()).enabled, true);
  await service.enablePush(preferences);
  assert.equal(requests, 2, 'granted permission is reused');
});

test('dismissed or denied permission never enables reminders or pretends consent was granted', async () => {
  const code = await compile('src/services/notificationService.ts');
  for (const permission of ['default', 'denied']) {
    let calls = 0;
    const Notification = { permission, requestPermission: () => { calls++; return Promise.resolve('default'); } };
    const context = vm.createContext({ module: { exports: {} }, localStorage: storage(),
      window: { isSecureContext: true, Notification, PushManager: {} }, Notification,
      navigator: { serviceWorker: {} },
    });
    vm.runInContext(code, context);
    const service = context.module.exports as any;
    await assert.rejects(service.enablePush({}), (e: any) => e.code === (permission === 'denied' ? 'permission_denied' : 'permission_dismissed'));
    assert.equal(calls, permission === 'denied' ? 0 : 1);
  }
});

test('permission handoff closes Qada dialog before native UI and waits before the next startup dialog', async () => {
  let open = false, completed = 0, nativeRequests = 0;
  let accept!: () => void;
  const effects: Array<() => void> = [];
  const dialog = { showModal: () => { open = true; }, close: () => { open = false; } };
  const react = {
    createElement: (type: any, props: any, ...children: any[]) => ({ type, props: { ...props, children } }),
    useState: (initial: any) => [typeof initial === 'function' ? initial() : initial, () => {}],
    useRef: (value: any) => ({ current: value === null ? dialog : value }),
    useEffect: (callback: () => void) => effects.push(callback),
  };
  const dependencies: Record<string, any> = {
    react, 'react-dom': { createPortal: (tree: any) => tree },
    'motion/react': { motion: { div: 'div' }, useReducedMotion: () => true },
    'lucide-react': {}, '../context/AppContext': { useApp: () => ({ showToast: () => {} }) },
    '../services/startupState': { hasRequestedNotifications: () => false, markNotificationsRequested: () => {} },
    '../services/pushPreferences': { defaultPushPreferences: () => ({}) },
    '../utils/prayerTimes': { getPrayerSettings: () => ({}) },
    '../services/notificationService': {
      supportsPush: () => true, getPermissionState: () => 'default', platform: () => 'Android',
      enablePush: () => {
        assert.equal(open, false, 'custom dialog must already be closed');
        assert.equal(completed, 0, 'next startup prompt must not mount over native permission');
        nativeRequests++;
        return new Promise<void>(resolve => { accept = resolve; });
      },
    },
  };
  const source = await readFile('src/components/NotificationPrompt.tsx', 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} as any };
  vm.runInNewContext(compiled, { module, exports: module.exports, React: react, require: (name: string) => dependencies[name], document: { body: {}, activeElement: null } });
  const tree = module.exports.NotificationPrompt({ onComplete: () => { completed++; } });
  effects.forEach(effect => effect());
  assert.equal(open, true);
  const buttons = (node: any): any[] => node && typeof node === 'object'
    ? [...(node.type === 'button' ? [node] : []), ...(node.props?.children || []).flatMap(buttons)] : [];
  const allow = buttons(tree).find(button => button.props.className?.includes('streak-primary'));
  assert.ok(allow);
  allow.props.onClick(); allow.props.onClick();
  assert.equal(nativeRequests, 1); assert.equal(completed, 0);
  accept(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(completed, 1);
});
