import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { build } from 'esbuild';
import { IDBFactory } from 'fake-indexeddb';
import { DateTime } from 'luxon';
import { readFile } from 'node:fs/promises';
import { planNotifications } from '../server/push/schedule';
import { defaultPushPreferences } from '../src/services/pushPreferences';
import { getPrayerSettings } from '../src/utils/prayerTimes';

const compiled = (await build({
  stdin: {
    contents: `export * from './src/services/androidReminders'; export * from './src/services/qadaTracking'; export {getPushClient} from './src/services/notificationService';`,
    resolveDir: process.cwd(),
  },
  bundle: true, write: false, format: 'cjs', platform: 'browser',
  external: ['@capacitor/app', '@capacitor/local-notifications'], define: { 'import.meta.env': '{}' },
})).outputFiles[0].text;

async function nativeFixture() {
  const values = new Map<string, string>();
  const pending = new Map<number, any>();
  const events = new EventTarget();
  const appListeners = new Map<string, Function>();
  const notificationListeners = new Map<string, Function>();
  const navigations: string[] = [];
  let permission = 'granted';
  let failures = 0;
  let writes = 0;
  let time = Date.parse('2026-11-27T10:00:00Z');
  class Clock extends Date {
    constructor(value?: string | number) { super(value === undefined ? time : value); }
    static now() { return time; }
  }
  const localStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
  const LocalNotifications = {
    checkPermissions: async () => ({ display: permission }),
    requestPermissions: async () => { throw new Error('Already granted permission must not be requested again'); },
    getAll: async () => ({ notifications: [...pending.values()] }),
    addListener: async (name: string, handler: Function) => { notificationListeners.set(name, handler); },
    cancel: async ({ notifications }: any) => notifications.forEach(({ id }: any) => pending.delete(id)),
    schedule: async ({ notifications }: any) => {
      if (failures > 0) { failures--; throw new Error('temporary native scheduling error'); }
      writes++;
      for (const item of notifications) pending.set(item.id, item);
    },
  };
  const context = vm.createContext({
    module: { exports: {} }, indexedDB: new IDBFactory(), localStorage, crypto: globalThis.crypto,
    Date: Clock, Intl, Event, console,
    window: {
      addEventListener: events.addEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events),
      location: { assign: (url: string) => navigations.push(url) },
    },
    require: (name: string) => name === '@capacitor/app'
      ? { App: { addListener: async (event: string, handler: Function) => { appListeners.set(event, handler); } } }
      : { LocalNotifications },
  });
  vm.runInContext(compiled, context);
  const service = context.module.exports as any;
  const today = DateTime.fromMillis(time).toISODate()!;
  service.publishQadaTracking({ hasRemaining: true, completedDates: [] });
  await service.startAndroidReminders();
  return {
    service, today, pending, navigations, appListeners, notificationListeners,
    writes: () => writes,
    setPermission: (value: string) => { permission = value; },
    failNextSchedule: () => { failures = 1; },
    advance: (milliseconds: number) => { time += milliseconds; },
  };
}

async function eventually(condition: () => boolean) {
  for (let attempt = 0; attempt < 200; attempt++) {
    if (condition()) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.fail('Native event did not reach the expected state');
}

function trackers(fixture: Awaited<ReturnType<typeof nativeFixture>>) {
  return [...fixture.pending.values()].filter(item => item.extra.qadaReminderKey.endsWith(':qada-tracker'));
}

test('logging and undo immediately cancel and restore the pending Android reminder through the real event listener', async () => {
  const f = await nativeFixture();
  const key = `${f.today}:qada-tracker`;
  assert.ok(trackers(f).some(item => item.extra.qadaReminderKey === key));
  const before = f.writes();
  f.service.publishQadaTracking({ hasRemaining: true, completedDates: [f.today] });
  await eventually(() => !trackers(f).some(item => item.extra.qadaReminderKey === key));
  assert.equal(f.writes(), before, 'cancellation does not recreate unrelated alarms');
  f.service.publishQadaTracking({ hasRemaining: true, completedDates: [] });
  await eventually(() => trackers(f).some(item => item.extra.qadaReminderKey === key));
  assert.equal(trackers(f).filter(item => item.extra.qadaReminderKey === key).length, 1);
  f.service.publishQadaTracking({ hasRemaining: false, completedDates: [f.today] });
  await eventually(() => trackers(f).length === 0);
  assert.ok(f.pending.size > 0, 'prayer-time and adhkar alarms continue independently');
});

test('resuming tomorrow refreshes the day and keeps one alarm per date without replaying past alarms', async () => {
  const f = await nativeFixture();
  f.service.publishQadaTracking({ hasRemaining: true, completedDates: [f.today] });
  await eventually(() => trackers(f).length === 13);
  f.advance(24 * 3600_000);
  f.appListeners.get('resume')!();
  await eventually(() => trackers(f).length === 14);
  const keys = trackers(f).map(item => item.extra.qadaReminderKey);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(keys.every(key => !key.startsWith(f.today)));
});

test('concurrent ledger updates converge on the latest state and scheduling recovers from a plugin error', async () => {
  const f = await nativeFixture();
  f.service.publishQadaTracking({ hasRemaining: false, completedDates: [] });
  await eventually(() => trackers(f).length === 0);
  f.failNextSchedule();
  f.service.publishQadaTracking({ hasRemaining: true, completedDates: [] });
  await new Promise(resolve => setTimeout(resolve, 50));
  f.appListeners.get('resume')!();
  await eventually(() => trackers(f).length === 14);
  f.service.publishQadaTracking({ hasRemaining: false, completedDates: [] });
  f.service.publishQadaTracking({ hasRemaining: true, completedDates: [] });
  f.service.publishQadaTracking({ hasRemaining: false, completedDates: [f.today] });
  await eventually(() => trackers(f).length === 0);
});

test('native notification taps open prayer entry and reject outside destinations', async () => {
  const f = await nativeFixture();
  const action = f.notificationListeners.get('localNotificationActionPerformed')!;
  action({ notification: { extra: { url: '/app/prayer' } } });
  action({ notification: { extra: { url: 'https://example.test/' } } });
  assert.deepEqual(f.navigations, ['/app/prayer']);
  f.setPermission('denied');
  f.appListeners.get('resume')!();
  await eventually(() => f.pending.size === 0);
});

test('fixed reminders follow local dates and 21:00 across timezones, daylight saving and the date line', () => {
  const preferences = defaultPushPreferences(getPrayerSettings());
  preferences.qadaTracking = { hasRemaining: true, completedDates: [] };
  const zones = ['Africa/Tunis', 'Africa/Lagos', 'Europe/Paris', 'America/New_York', 'Asia/Tokyo', 'Pacific/Kiritimati'];
  for (const zone of zones) {
    for (const instant of ['2026-03-28T23:45:00Z', '2026-10-24T23:45:00Z', '2026-11-27T22:30:00Z']) {
      const now = new Date(instant);
      const jobs = planNotifications(preferences, zone, now, {}, 14).filter(job => job.kind === 'qada-tracker');
      const ids = new Set<string>();
      for (const job of jobs) {
        const local = DateTime.fromISO(job.due_at).setZone(zone);
        assert.equal(local.hour, 21, zone);
        assert.equal(local.minute, 0, zone);
        assert.ok(job.notification_id.startsWith(local.toISODate()!));
        assert.ok(!ids.has(job.notification_id));
        assert.ok(Date.parse(job.due_at) >= now.getTime() - 60_000);
        ids.add(job.notification_id);
      }
    }
  }
});

test('the tracker is absent from settings and remains active when editable reminder types are switched off', async () => {
  const source = await readFile('src/components/NotificationSettings.tsx', 'utf8');
  assert.doesNotMatch(source, /qadaTracking|qada-tracker|21:00/);
  const f = await nativeFixture();
  const client = await f.service.getPushClient();
  Object.keys(client.preferences.prayers).forEach(key => { client.preferences.prayers[key] = false; });
  Object.values(client.preferences.reminders).forEach((reminder: any) => { reminder.enabled = false; });
  client.preferences.custom = [];
  await f.service.saveAndroidReminderPreferences(client.preferences);
  assert.equal(trackers(f).length, 14);
});
