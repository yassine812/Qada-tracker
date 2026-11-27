import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { timingSafeEqual } from 'node:crypto';
import { DateTime } from 'luxon';
import { PROPHETIC_DUAS } from '../../src/data/propheticDuas.js';
import { payloadFor, planNotifications, currentPrayerPayload } from './schedule.js';
import { hash, HttpError, uuidPattern, validatePreferences, validateSubscription, validateTimezone } from './validation.js';
import type { IncomingMessage, ServerResponse } from 'node:http';

type Request = IncomingMessage & { body?: unknown; query?: Record<string, string | string[]> };
type DB = SupabaseClient<any>;
export function serverConfig() {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT', 'CRON_SECRET', 'PUSH_ALLOWED_ORIGINS'];
  if (required.some(key => !process.env[key])) throw new HttpError(503, 'push_backend_not_configured');
  return Object.fromEntries(required.map(key => [key, process.env[key]!])) as Record<string, string>;
}
const log = (event: string, fields: Record<string, unknown>) => console.info(JSON.stringify({ scope: 'push', event, ...fields }));
// Never serialize SDK/network errors: they may embed credentials or push endpoints.
function checked<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw new HttpError(503, 'push_database_unavailable');
  return result.data;
}
function secretEquals(a: string, b: string) {
  const one = Buffer.from(hash(a)); const two = Buffer.from(hash(b));
  return timingSafeEqual(one, two);
}
function deviceIdentity(req: Request) {
  const id = req.headers['x-qada-device'];
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (typeof id !== 'string' || !uuidPattern.test(id) || !/^[a-f0-9]{64}$/.test(token)) throw new HttpError(401, 'device_credentials_required');
  return { id, tokenHash: hash(token) };
}
async function ownedDevice(db: DB, req: Request) {
  const identity = deviceIdentity(req);
  const device: any = checked(await db.from('push_devices').select('*').eq('id', identity.id).eq('token_hash', identity.tokenHash).maybeSingle());
  if (!device) throw new HttpError(404, 'device_not_registered');
  return device;
}
async function limit(db: DB, bucket: string, maximum: number, seconds: number) {
  if (!checked(await db.rpc('push_rate_limit', { p_bucket: bucket, p_limit: maximum, p_seconds: seconds }))) throw new HttpError(429, 'rate_limited');
}
async function planDevice(db: DB, device: any, now: Date) {
  const preferences = validatePreferences(device.preferences);
  const zone = validateTimezone(device.timezone);
  const duas: Record<string, string> = {};
  if (preferences.enabled && preferences.reminders.dua.enabled) {
    for (let i = 0; i < 3; i++) {
      const day = DateTime.fromJSDate(now).setZone(zone).plus({ days: i }).toISODate()!;
      duas[day] = checked(await db.rpc('push_select_dua', { p_day: day, p_ids: PROPHETIC_DUAS.map(d => d.id) }));
    }
  }
  const jobs = planNotifications(preferences, zone, now, duas);
  checked(await db.rpc('push_enqueue', { p_device: device.id, p_revision: device.revision, p_jobs: jobs }));
  checked(await db.from('push_devices').update({ next_plan_at: new Date(now.getTime() + 12 * 3600_000).toISOString() }).eq('id', device.id).eq('revision', device.revision));
  log('notification_scheduled', { device: device.id, timezone: zone, count: jobs.length });
}
export function deliveryFailure(error: any, attempts: number, now = Date.now()) {
  const status = Number(error?.statusCode) || 0;
  const expired = status === 404 || status === 410;
  const retry = !expired && (status === 0 || status === 429 || status >= 500) && attempts < 4;
  const retryHeader = error?.headers?.['retry-after'];
  const retrySeconds = Number(retryHeader);
  const headerDelay = Number.isFinite(retrySeconds) ? retrySeconds * 1000 : Math.max(0, Date.parse(retryHeader) - now) || 0;
  const delay = Math.max(60_000 * 2 ** (attempts - 1), Math.min(headerDelay, 3600_000));
  return { expired, retry, code: expired ? 'subscription_expired' : `push_service_${status || 'network'}`, availableAt: new Date(now + delay).toISOString() };
}
async function deliver(db: DB, job: any, config: Record<string, string>) {
  const device: any = checked(await db.from('push_devices').select('*').eq('id', job.device_id).maybeSingle());
  const update = (values: Record<string, unknown>) => db.from('push_jobs').update(values).eq('id', job.id).eq('status', 'sending').eq('lease_token', job.lease_token);
  if (!device?.active || device.revision !== job.revision || !device.preferences.enabled) {
    checked(await update({ status: 'cancelled' })); return;
  }
  if (job.kind === 'qada-tracker') {
    const tracking = device.preferences.qadaTracking;
    if (!tracking?.hasRemaining || tracking.completedDates.includes(job.notification_id.slice(0, 10))) {
      checked(await update({ status: 'cancelled' })); return;
    }
  }
  try {
    const ttl = Math.max(1, Math.min(900, Math.floor((Date.parse(job.expires_at) - Date.now()) / 1000)));
    await webpush.sendNotification({ endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
      JSON.stringify({ ...currentPrayerPayload(job.payload, job.kind), data: { ...job.payload.data, jobId: job.id } }), {
        vapidDetails: { subject: config.VAPID_SUBJECT, publicKey: config.VAPID_PUBLIC_KEY, privateKey: config.VAPID_PRIVATE_KEY },
        TTL: ttl, urgency: 'normal', topic: hash(job.notification_id).slice(0, 32), timeout: 5000,
      });
    const accepted = new Date().toISOString();
    checked(await update({ status: 'sent', accepted_at: accepted, lease_until: null, last_error: null }));
    checked(await db.from('push_devices').update({ last_successful_push: accepted, last_push_error: null }).eq('id', device.id));
    log('notification_sent', { device: device.id, type: job.kind, timezone: device.timezone, job: job.id });
  } catch (error) {
    const failure = deliveryFailure(error, job.attempts);
    checked(await update({ status: failure.retry ? 'pending' : 'failed', last_error: failure.code, available_at: failure.availableAt, lease_until: null }));
    checked(await db.from('push_devices').update({ last_push_error: failure.code, ...(failure.expired ? { active: false } : {}) }).eq('id', device.id).eq('revision', device.revision));
    if (failure.expired) checked(await db.from('push_jobs').update({ status: 'cancelled' }).eq('device_id', device.id).eq('status', 'pending'));
    log(failure.expired ? 'subscription_expired' : failure.retry ? 'retry' : 'notification_failed', { device: device.id, type: job.kind, job: job.id, code: failure.code });
  }
}
async function batch<T>(items: T[], concurrency: number, work: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += concurrency) await Promise.all(items.slice(i, i + concurrency).map(work));
}
async function tick(db: DB, config: Record<string, string>) {
  const now = new Date();
  const devices: any[] = checked(await db.rpc('push_claim_planning', { p_limit: 20 }));
  await batch(devices, 5, async device => {
    try { await planDevice(db, device, now); }
    catch { log('planning_failed', { device: device.id }); }
  });
  const jobs: any[] = checked(await db.rpc('push_claim_jobs', { p_limit: 40 }));
  await batch(jobs, 10, job => deliver(db, job, config));
  checked(await db.from('push_health').update({ last_tick: now.toISOString(), last_error: null }).eq('id', 1));
  // Keep delivery IDs for 30 days; scheduler only plans today + two days.
  checked(await db.from('push_jobs').delete().lt('created_at', new Date(now.getTime() - 30 * 86400_000).toISOString()).in('status', ['sent', 'expired', 'cancelled', 'failed']));
  checked(await db.from('push_rate_limits').delete().lt('reset_at', now.toISOString()));
  return { plannedDevices: devices.length, processedJobs: jobs.length, tick: now.toISOString() };
}
async function readBody(req: Request): Promise<any> {
  if (req.body !== undefined) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > 16384) throw new HttpError(413, 'payload_too_large');
    try { return JSON.parse(raw); } catch { throw new HttpError(400, 'invalid_json'); }
  }
  let raw = '';
  for await (const chunk of req) {
    raw += chunk.toString();
    if (Buffer.byteLength(raw) > 16384) throw new HttpError(413, 'payload_too_large');
  }
  try { return JSON.parse(raw || '{}'); } catch { throw new HttpError(400, 'invalid_json'); }
}
export default async function handler(req: Request, res: ServerResponse) {
  const send = (status: number, value: unknown) => { res.statusCode = status; res.end(JSON.stringify(value)); };
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    const config = serverConfig();
    const origin = req.headers.origin;
    const allowed = config.PUSH_ALLOWED_ORIGINS.split(',').map(o => o.trim());
    if (origin && !allowed.includes(origin)) throw new HttpError(403, 'origin_not_allowed');
    if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Qada-Device');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
    const action = new URL(req.url!, 'https://qada.invalid').pathname.split('/').filter(Boolean).at(-1);
    const db = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    if (action === 'cron') {
      if (req.method !== 'POST' || !secretEquals(req.headers.authorization || '', `Bearer ${config.CRON_SECRET}`)) throw new HttpError(401, 'unauthorized_scheduler');
      try { send(200, await tick(db, config)); }
      catch (error) {
        await db.from('push_health').update({ last_error: 'scheduler_failed' }).eq('id', 1);
        throw error;
      }
      return;
    }
    // Vercel supplies this address. Hash it with a server secret, never store raw IPs.
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    await limit(db, `request:${hash(config.CRON_SECRET + ip)}`, 120, 60);
    if (action === 'config' && req.method === 'GET') {
      const health: any = checked(await db.from('push_health').select('last_tick,last_error').eq('id', 1).single());
      send(200, { publicKey: config.VAPID_PUBLIC_KEY, configured: true, schedulerLastTick: health.last_tick, schedulerError: health.last_error }); return;
    }
    if (action === 'daily-dua' && req.method === 'GET') {
      const date = new URL(req.url!, 'https://qada.invalid').searchParams.get('date') || '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, 'invalid_date');
      const dua = checked(await db.from('push_daily_duas').select('dua_id').eq('day', date).maybeSingle());
      send(200, { date, duaId: (dua as any)?.dua_id || null }); return;
    }
    if (action === 'subscribe' && req.method === 'POST') {
      const { id, tokenHash } = deviceIdentity(req);
      await limit(db, `subscribe:${hash(config.CRON_SECRET + ip)}`, 30, 3600);
      const body = await readBody(req);
      const subscription = validateSubscription(body.subscription);
      const preferences = validatePreferences(body.preferences);
      const timezone = validateTimezone(body.timezone);
      const platform = ['iOS', 'Android', 'Desktop'].includes(body.platform) ? body.platform : 'Unknown';
      const old: any = checked(await db.from('push_devices').select('id,token_hash').eq('id', id).maybeSingle());
      if (old && !secretEquals(old.token_hash, tokenHash)) throw new HttpError(403, 'device_not_owned');
      const result = await db.rpc('push_register', { p_id: id, p_hash: tokenHash, p_endpoint: subscription.endpoint,
        p_p256dh: subscription.keys.p256dh, p_auth: subscription.keys.auth, p_platform: platform,
        p_agent: (req.headers['user-agent'] || '').slice(0, 512), p_timezone: timezone, p_preferences: preferences });
      if (result.error?.code === '23505') throw new HttpError(409, 'subscription_already_registered');
      checked(result);
      log(old ? 'subscription_updated' : 'subscription_registered', { device: id, timezone });
      send(200, { subscriptionActive: true }); return;
    }
    const device = await ownedDevice(db, req);
    if (action === 'status' && req.method === 'GET') {
      // Only the client can observe browser support and permission; never infer them from a DB row.
      const query = new URL(req.url!, 'https://qada.invalid').searchParams;
      const permission = ['granted', 'denied', 'default', 'unsupported'].includes(query.get('permission')!) ? query.get('permission') : 'unknown';
      const lastTest = checked(await db.from('push_jobs').select('status,due_at,accepted_at,displayed_at,clicked_at,last_error').eq('device_id', device.id).eq('kind', 'test').order('created_at', { ascending: false }).limit(1));
      send(200, { supported: query.get('supported') === 'true', permission, subscribed: query.get('subscribed') === 'true',
        subscriptionActive: device.active && device.preferences.enabled, timezone: device.timezone, lastSuccessfulPush: device.last_successful_push,
        lastDisplayedPush: device.last_displayed_push, lastPushError: device.last_push_error, lastTest: lastTest?.[0] || null }); return;
    }
    if (action === 'unsubscribe' && req.method === 'POST') {
      checked(await db.from('push_devices').update({ active: false, updated_at: new Date().toISOString() }).eq('id', device.id));
      checked(await db.from('push_jobs').update({ status: 'cancelled' }).eq('device_id', device.id).in('status', ['pending', 'sending']));
      send(200, { subscriptionActive: false }); return;
    }
    if (action === 'receipt' && req.method === 'POST') {
      const body = await readBody(req);
      if (!uuidPattern.test(body.jobId) || !['displayed', 'clicked', 'closed'].includes(body.event)) throw new HttpError(400, 'invalid_receipt');
      const now = new Date().toISOString();
      const rows = checked(await db.from('push_jobs').update({ [`${body.event}_at`]: now }).eq('id', body.jobId).eq('device_id', device.id).select('id'));
      if (!rows?.length) throw new HttpError(404, 'job_not_found');
      if (body.event === 'displayed') checked(await db.from('push_devices').update({ last_displayed_push: now }).eq('id', device.id));
      send(200, { recorded: true }); return;
    }
    if (action === 'test' && req.method === 'POST') {
      if (!device.active || !device.preferences.enabled) throw new HttpError(409, 'subscription_inactive');
      const body = await readBody(req);
      if (![0, 60].includes(body.delaySeconds) || !uuidPattern.test(body.requestId)) throw new HttpError(400, 'invalid_test_request');
      const id = `test:${body.requestId}`;
      const existing = checked(await db.from('push_jobs').select('id,status,due_at').eq('device_id', device.id).eq('notification_id', id).maybeSingle());
      if (existing) { send(200, existing); return; }
      await limit(db, `test:${device.id}`, 5, 3600);
      const now = Date.now(); const due = new Date(now + body.delaySeconds * 1000).toISOString();
      checked(await db.rpc('push_enqueue', { p_device: device.id, p_revision: device.revision, p_jobs: [{ notification_id: id, kind: 'test', due_at: due,
        expires_at: new Date(now + body.delaySeconds * 1000 + 15 * 60_000).toISOString(), payload: payloadFor(id, 'قضاء 🌿', 'هذا إشعار تجريبي — نظام الإشعارات يعمل.', '/app/notifications') }] }));
      log('notification_scheduled', { device: device.id, type: 'test', due });
      if (body.delaySeconds === 0) {
        // Atomic claim of this test only; a test request must never drain other users' queues.
        const claimed: any = checked(await db.rpc('push_claim_test', { p_device: device.id, p_notification: id }));
        if (claimed?.[0]) await deliver(db, claimed[0], config);
      }
      const result = checked(await db.from('push_jobs').select('id,status,due_at,accepted_at,last_error').eq('device_id', device.id).eq('notification_id', id).single());
      send(200, result); return;
    }
    throw new HttpError(404, 'unknown_push_endpoint');
  } catch (error) {
    const safe = error instanceof HttpError ? error : new HttpError(500, 'push_internal_error');
    if (safe.status >= 500) log('request_failed', { code: safe.code });
    if (safe.status === 429) res.setHeader('Retry-After', '60');
    send(safe.status, { error: safe.code });
  }
}
