import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { IDBFactory } from 'fake-indexeddb';
import { PGlite } from '@electric-sql/pglite';
import { DateTime } from 'luxon';
import { defaultPushPreferences, normalizePushPreferences } from '../src/services/pushPreferences';
import { getPrayerSettings, calculateTodayPrayerTimes } from '../src/utils/prayerTimes';
import { planNotifications, payloadFor, currentPrayerPayload } from '../server/push/schedule';
import { validateSubscription, validatePreferences, validateTimezone, hash } from '../server/push/validation';
import { deliveryFailure } from '../server/push/backend';
import { PROPHETIC_DUAS } from '../src/data/propheticDuas';
import { build } from 'esbuild';
import { qadaTrackingSnapshot } from '../src/services/qadaTracking';

const prefs = () => defaultPushPreferences(getPrayerSettings());
const at = (text: string) => new Date(text);

test('daily Qada tracker is fixed at 21:00, suppressed by recorded prayer, and independent of editable reminders', () => {
  const p = prefs();
  for (const key of Object.keys(p.prayers)) p.prayers[key] = false;
  for (const reminder of Object.values(p.reminders)) reminder.enabled = false;
  p.qadaTracking = { hasRemaining: true, completedDates: [] };
  const tracker = () => planNotifications(validatePreferences(p), 'Africa/Tunis', at('2026-11-27T10:00:00Z'), {}).filter(job => job.kind === 'qada-tracker');
  const jobs = tracker();
  assert.equal(jobs.length, 3);
  assert.equal(jobs[0].due_at, '2026-11-27T20:00:00.000Z');
  assert.equal(jobs[0].payload.url, '/app/prayer');
  p.qadaTracking.completedDates = ['2026-11-27'];
  assert.ok(tracker().every(job => !job.notification_id.startsWith('2026-11-27:')));
  p.qadaTracking.hasRemaining = false;
  assert.equal(tracker().length, 0);
  p.enabled = false;
  assert.equal(planNotifications(p, 'Africa/Tunis', new Date(), {}).length, 0);
  assert.throws(() => validatePreferences({ ...prefs(), qadaTracking: { hasRemaining: true, completedDates: ['2026-99-42'] } }));
});

test('tracking reads actual prayer records and resets after undo or completion', () => {
  const counters = { fajr: { remaining: 3 } } as any;
  const record = { date: '2026-11-27', fajr: 1, total: 1 } as any;
  assert.deepEqual(qadaTrackingSnapshot(true, counters, [record]), { hasRemaining: true, completedDates: ['2026-11-27'] });
  assert.deepEqual(qadaTrackingSnapshot(true, counters, [{ ...record, fajr: 0, total: 0 }]), { hasRemaining: true, completedDates: [] });
  assert.equal(qadaTrackingSnapshot(false, counters, []).hasRemaining, false);
  assert.equal(qadaTrackingSnapshot(true, { fajr: { remaining: 0 } } as any, [record]).hasRemaining, false);
});
test('already queued prayer reminders use the current concise copy without altering delivery metadata', () => {
  const old = payloadFor('2026-10-29:dhuhr', 'حان وقت صلاة الظهر 🕌', 'حان وقت الظهر بحسب إعدادات حساب الصلاة لديك.', '/app/prayer');
  const updated = currentPrayerPayload(old, 'dhuhr');
  assert.equal(updated.body, 'حان وقت صلاة الظهر.');
  assert.deepEqual({ ...updated, body: old.body }, old);
  assert.equal(currentPrayerPayload(old, 'test'), old);
});
test('reconcile restores an inactive server registration without prompting or overriding opt-outs', async () => {
  const compiled = await build({ entryPoints: ['src/services/notificationService.ts'], bundle: true, write: false, format: 'cjs', platform: 'browser', define: { 'import.meta.env': '{}' } });
  const requests: { action: string; body: any }[] = [];
  let prompts = 0;
  const context = vm.createContext({ module: { exports: {} }, indexedDB: new IDBFactory(), crypto: globalThis.crypto, Intl, Date, AbortSignal,
    window: { isSecureContext: true, Notification: {}, PushManager: {} },
    Notification: { permission: 'granted', requestPermission: () => { prompts++; return 'granted'; } },
    navigator: { onLine: true, userAgent: 'test', serviceWorker: { getRegistration: async () => ({ pushManager: { getSubscription: async () => ({ toJSON: () => ({ endpoint: 'https://push.example.test/existing' }) }) } }) } },
    fetch: async (url: string, options: any) => {
      const action = url.split('/').pop()!;
      requests.push({ action, body: options.body ? JSON.parse(options.body) : null });
      return { ok: true, json: async () => action === 'config' ? { publicKey: 'matching-key' } : action === 'status' ? { subscriptionActive: false } : {} };
    },
  });
  vm.runInContext(compiled.outputFiles[0].text, context);
  const service = context.module.exports;
  const preferences = prefs(); preferences.prayers.fajr = false;
  const client = { id: randomUUID(), token: 'test-capability', api: '/api/notifications', enabled: true, publicKey: 'matching-key', timezone: 'Africa/Tunis', preferences };
  await service.pushStorage(client);
  await service.reconcilePush();
  assert.equal(prompts, 0);
  assert.equal(requests.filter(r => r.action === 'subscribe').length, 1);
  assert.equal(requests.find(r => r.action === 'subscribe')!.body.preferences.prayers.fajr, false);
  requests.length = 0;
  await service.pushStorage({ ...client, enabled: false });
  await service.reconcilePush();
  assert.equal(requests.length, 0, 'an opted-out device must never be silently re-enabled');
});

test('Tunis local reminders become UTC instants with deterministic IDs', () => {
  const p = prefs();
  const result = planNotifications(p, 'Africa/Tunis', at('2026-09-15T00:00:00Z'), {});
  for (const kind of ['morning', 'evening', 'sleep', 'istighfar', 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    assert.equal(result.filter(job => job.kind === kind).length, 3, kind);
  }
  const morning = result.find(job => job.kind === 'morning' && job.notification_id.startsWith('2026-09-15:'))!;
  const fajr = calculateTodayPrayerTimes(new Date(2026, 8, 15), getPrayerSettings()).prayers.find(prayer => prayer.id === 'fajr')!;
  assert.equal(morning.due_at, new Date(fajr.time.getTime() + 15 * 60_000).toISOString());
  assert.match(morning.payload.url, /category=morning/);
  assert.deepEqual(result, planNotifications(p, 'Africa/Tunis', at('2026-09-15T00:00:00Z'), {}));
});

test('essential reminders default on without overriding an explicit opt-out', () => {
  const defaults = normalizePushPreferences(undefined);
  assert.ok(Object.values(defaults.prayers).every(Boolean));
  assert.ok(defaults.reminders.istighfar.enabled);
  assert.ok(defaults.reminders.morning.enabled && defaults.reminders.evening.enabled && defaults.reminders.sleep.enabled);
  const saved = prefs();
  saved.enabled = false;
  saved.prayers.fajr = false;
  saved.reminders.istighfar.enabled = false;
  const restored = normalizePushPreferences(saved);
  assert.equal(restored.enabled, false);
  assert.equal(restored.prayers.fajr, false);
  assert.equal(restored.reminders.istighfar.enabled, false);
});
test('multiple timezones and calendar dates, travel, midnight, disabled types', () => {
  const p = prefs(); p.reminders.quran = { enabled: true, time: '00:15' };
  const ny = planNotifications(p, 'America/New_York', at('2026-09-15T03:00:00Z'), {});
  const tokyo = planNotifications(p, 'Asia/Tokyo', at('2026-09-15T03:00:00Z'), {});
  assert.equal(ny.find(job => job.kind === 'quran')?.due_at, '2026-09-15T04:15:00.000Z');
  assert.equal(tokyo.find(job => job.kind === 'quran')?.due_at, '2026-09-15T15:15:00.000Z');
  p.enabled = false; assert.equal(planNotifications(p, 'Africa/Tunis', new Date(), {}).length, 0);
});
test('DST gap advances safely; repeated local hour schedules only once', () => {
  const p = prefs();
  const spring = planNotifications(p, 'Europe/Paris', at('2026-03-29T00:00:00Z'), {});
  assert.ok(spring.find(j => j.notification_id === '2026-03-29:sleep'));
  const fall = planNotifications(p, 'Europe/Paris', at('2026-10-24T23:00:00Z'), {});
  assert.ok(fall.find(j => j.notification_id === '2026-10-25:sleep'));
  assert.equal(fall.filter(j => j.notification_id === '2026-10-25:sleep').length, 1);
});
test('daily adhkar are automatic and follow Fajr, Asr and Isha', () => {
  const p = prefs();
  p.reminders.morning = { enabled: false, time: '23:59' };
  p.reminders.evening = { enabled: false, time: '23:59' };
  p.reminders.sleep = { enabled: false, time: '23:59' };
  const jobs = planNotifications(p, 'Africa/Tunis', at('2026-09-15T00:00:00Z'), {});
  for (const kind of ['morning', 'evening', 'sleep']) assert.equal(jobs.filter(job => job.kind === kind).length, 3);
  const expected = calculateTodayPrayerTimes(new Date(2026, 8, 15), getPrayerSettings()).prayers;
  for (const [kind, prayerId] of [['morning', 'fajr'], ['evening', 'asr'], ['sleep', 'isha']] as const) {
    const prayer = expected.find(item => item.id === prayerId)!;
    assert.equal(jobs.find(job => job.notification_id === `2026-09-15:${kind}`)?.due_at, new Date(prayer.time.getTime() + 15 * 60_000).toISOString());
  }
});
test('prayer instants match existing calculation method and location', () => {
  const p = prefs(); Object.keys(p.prayers).forEach(id => p.prayers[id] = true);
  const jobs = planNotifications(p, 'Africa/Tunis', at('2026-09-15T00:00:00Z'), {});
  const expected = calculateTodayPrayerTimes(new Date(2026, 8, 15), getPrayerSettings()).prayers;
  for (const prayer of expected.filter(x => x.id !== 'sunrise')) {
    assert.equal(jobs.find(x => x.notification_id === `2026-09-15:${prayer.id}`)?.due_at, prayer.time.toISOString());
  }
});
test('custom/fasting weekdays and persisted verified Dua reference, no arbitrary text', () => {
  const p = prefs(); const id = randomUUID();
  p.custom = [{ id, enabled: true, time: '12:00', days: [2] }];
  p.reminders.dua.enabled = true; p.reminders.fasting.enabled = true;
  const jobs = planNotifications(p, 'Africa/Tunis', at('2026-09-15T00:00:00Z'), { '2026-09-15': PROPHETIC_DUAS[0].id });
  assert.equal(jobs.filter(x => x.kind === 'dua').length, 1);
  assert.ok(jobs.find(x => x.kind === 'dua')!.payload.url.includes(PROPHETIC_DUAS[0].id));
  assert.equal(jobs.find(x => x.kind === 'dua')!.payload.body, PROPHETIC_DUAS[0].arabic.slice(0, 1000));
  assert.equal(jobs.filter(x => x.kind.startsWith('custom')).length, 1);
  assert.ok(jobs.find(x => x.kind === 'fasting')!.notification_id.startsWith('2026-09-17'));
});
test('fasting reminders include the configured Hijri white days without relying on weekday', () => {
  const p = prefs(); p.reminders.fasting.enabled = true; p.fastingDays = []; p.fastingHijriDays = [13, 14, 15];
  const jobs = planNotifications(p, 'Africa/Tunis', at('2026-09-24T00:00:00Z'), {});
  const whiteDayJobs = jobs.filter(x => x.kind === 'fasting');
  assert.equal(whiteDayJobs.length, 3);
  assert.match(whiteDayJobs[0].payload.body, /أيام البيض/);
  assert.equal(planNotifications(p, 'Africa/Tunis', at('2026-09-27T00:00:00Z'), {}).filter(x => x.kind === 'fasting').length, 0);
});
test('white-day support is automatic: preparation, daily dua/advice, congratulations and pre-Maghrib guidance', () => {
  const p = prefs();
  const jobs = planNotifications(p, 'Africa/Tunis', at('2026-09-23T00:00:00Z'), {});
  assert.ok(jobs.some(x => x.notification_id === '2026-09-23:white-day-prep'));
  assert.ok(jobs.some(x => x.notification_id === '2026-09-24:white-day-dua' && /دعاء/.test(x.payload.title)));
  assert.ok(jobs.some(x => x.notification_id === '2026-09-24:white-day-advice' && /نصيحة/.test(x.payload.title)));
  assert.ok(jobs.some(x => x.notification_id === '2026-09-24:white-day-congrats' && /مبارك/.test(x.payload.title)));
  assert.ok(jobs.some(x => x.notification_id === '2026-09-24:before-maghrib' && /القرآن/.test(x.payload.body)));
});
test('reject invalid timezone, time, coordinates, boolean coercion and oversized schedules', () => {
  assert.throws(() => validateTimezone('not/a-zone'));
  assert.equal(validateTimezone('Africa/Tunis'), 'Africa/Tunis');
  for (const mutate of [
    p => p.prayerSettings.latitude = 100, p => p.reminders.dua.time = '25:30',
    p => p.prayers.fajr = 'true', p => p.fastingDays = [8], p => p.beforeMaghrib.minutesBefore = 2, p => p.enabled = undefined,
  ]) { const p = prefs(); mutate(p); assert.throws(() => validatePreferences(p)); }
  assert.deepEqual(validatePreferences(prefs()), prefs());
});
test('subscription SSRF protections and encryption key length validation', () => {
  const s = { endpoint: 'https://fcm.googleapis.com/fcm/send/test', keys: { p256dh: Buffer.concat([Buffer.from([4]), Buffer.alloc(64)]).toString('base64url'), auth: Buffer.alloc(16).toString('base64url') } };
  assert.equal(validateSubscription(s).endpoint, s.endpoint);
  for (const endpoint of ['http://fcm.googleapis.com/x', 'https://localhost/x', 'https://fcm.googleapis.com.evil.test/x', 'https://fcm.googleapis.com:8080/x', 'https://x:y@fcm.googleapis.com/x', 'https://127.0.0.1/x']) assert.throws(() => validateSubscription({ ...s, endpoint }));
  assert.throws(() => validateSubscription({ ...s, keys: { ...s.keys, auth: 'short' } }));
});
test('expired subscriptions never retry; transient failures back off and stop', () => {
  assert.equal(deliveryFailure({ statusCode: 410 }, 1).expired, true);
  assert.equal(deliveryFailure({ statusCode: 404 }, 1).retry, false);
  assert.equal(deliveryFailure({ statusCode: 401 }, 1).retry, false);
  assert.equal(deliveryFailure({ statusCode: 503 }, 1).retry, true);
  assert.equal(deliveryFailure({ statusCode: 503 }, 4).retry, false);
  const now = Date.now();
  assert.equal(Date.parse(deliveryFailure({ statusCode: 429, headers: { 'retry-after': '300' } }, 1, now).availableAt), now + 300000);
});

test('actual PostgreSQL migration, ownership, queue claims, RLS, rate limits and complete Dua shuffle bag', async () => {
  const db = new PGlite();
  try {
    await db.exec('create role anon; create role authenticated; create role service_role;');
    const sql = await readFile(new URL('../supabase/migrations/202609150001_web_push.sql', import.meta.url), 'utf8');
    await db.exec(sql); await db.exec(sql); // Migration is repeatable.
    const id = randomUUID(); const token = hash('device-capability');
    const register = (secret = token, zone = 'Africa/Tunis') => db.query('select push_register($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id, secret, 'https://fcm.googleapis.com/x', 'key', 'auth', 'Desktop', 'test', zone, JSON.stringify(prefs())]);
    await register(); await register();
    await assert.rejects(register('wrong'), /device_not_owned/);
    assert.equal((await db.query<any>('select revision from push_devices')).rows[0].revision, 1);
    const job = { notification_id: '2026-09-15:test', kind: 'test', due_at: new Date(Date.now() - 1000).toISOString(), expires_at: new Date(Date.now() + 60000).toISOString(), payload: payloadFor('test', 'title', 'body', '/app') };
    const enqueue = (revision = 1) => db.query('select push_enqueue($1,$2,$3)', [id, revision, JSON.stringify([job])]);
    await enqueue(); await enqueue();
    assert.equal((await db.query<any>('select count(*)::int n from push_jobs')).rows[0].n, 1);
    assert.equal((await db.query('select * from push_claim_jobs(100)')).rows.length, 1);
    assert.equal((await db.query('select * from push_claim_jobs(100)')).rows.length, 0);
    await db.exec("update push_jobs set lease_until=now()-interval '1 minute';");
    assert.equal((await db.query<any>('select * from push_claim_jobs(100)')).rows[0].attempts, 2);
    await db.exec("update push_jobs set status='sent',accepted_at=now();");
    await register(token, 'Asia/Tokyo'); await enqueue(2);
    assert.equal((await db.query<any>('select status from push_jobs')).rows[0].status, 'sent');
    const rpc = () => db.query<any>("select push_rate_limit('test',2,60) allowed");
    assert.equal((await rpc()).rows[0].allowed, true); assert.equal((await rpc()).rows[0].allowed, true); assert.equal((await rpc()).rows[0].allowed, false);
    const ids = PROPHETIC_DUAS.map(d => d.id); const selected: string[] = [];
    for (let i = 0; i < ids.length + 1; i++) {
      const date = DateTime.fromISO('2026-09-15').plus({ days: i }).toISODate();
      const choose = () => db.query<any>('select push_select_dua($1,$2) id', [date, ids]);
      const chosen = (await choose()).rows[0].id; assert.equal((await choose()).rows[0].id, chosen); selected.push(chosen);
    }
    assert.equal(new Set(selected.slice(0, ids.length)).size, ids.length);
    assert.notEqual(selected.at(-1), selected.at(-2));
    await db.exec('set role anon;');
    await assert.rejects(db.query('select * from push_devices'), /permission denied/);
    await assert.rejects(db.query("select push_rate_limit('bad',1,1)"), /permission denied/);
  } finally { await db.close(); }
});

const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
async function workerFixture(indexedDB = new IDBFactory()) {
  const handlers = new Map<string, Function>(); const displayed: any[] = []; const calls: any[] = []; const opened: string[] = [];
  const scope = { indexedDB, URL, Promise, Date, Uint8Array, atob, console,
    fetch: async (url: string, options: any) => { calls.push({ url, options }); return { ok: true }; },
    self: { location: { origin: 'https://qada.test' },
      addEventListener: (name: string, fn: Function) => handlers.set(name, fn),
      registration: { showNotification: async (title: string, options: any) => { displayed.push({ title, options }); } },
      clients: { matchAll: async () => [], openWindow: async (url: string) => { opened.push(url); } },
    } };
  const context = vm.createContext(scope); vm.runInContext(source, context);
  const dispatch = async (name: string, event: any) => {
    const pending: Promise<any>[] = []; handlers.get(name)!({ ...event, waitUntil: (p: Promise<any>) => pending.push(p) }); await Promise.all(pending);
  };
  const setClient = (enabled: boolean) => vm.runInContext(`pushDb('state','readwrite',s=>s.put({id:'device',token:'capability',enabled:${enabled},api:'/api/notifications'},'client'))`, context);
  return { context, dispatch, displayed, calls, opened, indexedDB, setClient, handlers };
}
test('actual worker push, durable dedupe across restart, click deep link, close receipt', async () => {
  const w = await workerFixture(); await w.setClient(true);
  const payload = payloadFor('2026-09-15:dua', 'دعاء اليوم', 'body', '/app/dua?dua=prophetic-dua-4'); payload.data.jobId = randomUUID();
  await w.dispatch('push', { data: { json: () => payload } });
  await w.dispatch('push', { data: { json: () => payload } });
  assert.equal(w.displayed.length, 1);
  const afterRestart = await workerFixture(w.indexedDB);
  await afterRestart.dispatch('push', { data: { json: () => payload } });
  assert.equal(afterRestart.displayed.length, 0);
  const notification = { data: w.displayed[0].options.data, close() {} };
  await afterRestart.dispatch('notificationclick', { notification });
  assert.equal(afterRestart.opened[0], 'https://qada.test/app/dua?dua=prophetic-dua-4');
  await afterRestart.dispatch('notificationclose', { notification });
  assert.ok(afterRestart.calls.some(c => JSON.parse(c.options.body).event === 'closed'));
});
test('worker honors disable and malformed payload, rejects external click destinations', async () => {
  const w = await workerFixture(); await w.setClient(false);
  const payload = payloadFor('test', 'title', 'body', '/app');
  await w.dispatch('push', { data: { json: () => payload } });
  assert.equal(w.displayed.length, 0);
  await w.dispatch('push', { data: { json: () => { throw new Error('invalid JSON'); } } });
  await w.dispatch('notificationclick', { notification: { data: { url: 'https://evil.test/' }, close() {} } });
  assert.equal(w.opened[0], 'https://qada.test/app');
  assert.ok(w.handlers.has('pushsubscriptionchange'));
});

test('a recorded prayer suppresses a previously queued web reminder even while offline', async () => {
  const w = await workerFixture();
  await w.setClient(true);
  await vm.runInContext(`pushDb('state','readwrite',s=>s.put({enabled:true,api:'/api/notifications',preferences:{qadaTracking:{hasRemaining:true,completedDates:['2026-11-27']}}},'client'))`, w.context);
  const payload = payloadFor('2026-11-27:qada-tracker', 'قضاء', 'body', '/app/prayer');
  await w.dispatch('push', { data: { json: () => payload } });
  assert.equal(w.displayed.length, 0);
  await w.dispatch('push', { data: { json: () => payloadFor('2026-11-28:qada-tracker', 'قضاء', 'body', '/app/prayer') } });
  assert.equal(w.displayed.length, 1);
});
test('APIs never use the offline cache; no foreground notification timers remain', async () => {
  const w = await workerFixture(); let intercepted = false;
  await w.dispatch('fetch', { request: { method: 'GET', url: 'https://qada.test/api/notifications/status' }, respondWith() { intercepted = true; } });
  assert.equal(intercepted, false);
  const service = await readFile(new URL('../src/services/notificationService.ts', import.meta.url), 'utf8');
  const context = await readFile(new URL('../src/context/AppContext.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(service, /new Notification\(|setInterval\(|setTimeout\(|showNotification\(/);
  assert.doesNotMatch(context, /checkAdhkarReminders|checkDhikrReminders|checkReminder/);
  assert.doesNotMatch(service, /VAPID_PRIVATE_KEY/);
});
