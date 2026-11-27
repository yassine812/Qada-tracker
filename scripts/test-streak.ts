import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import 'fake-indexeddb/auto';
import { PGlite } from '@electric-sql/pglite';
import { activityDate, ActivityEvent, earnedAchievements, shiftDate, streakSummary } from '../src/services/streakModel';
import { appendActivity, appendDailyVisit, emptyStreakCache, mergeStreakCache, updateStreakCache } from '../src/storage/streakStore';

const event = (date: string, type: ActivityEvent['type'] = 'qada_prayer'): ActivityEvent => ({ eventId: crypto.randomUUID(), type, date, occurredAt: `${date}T12:00:00Z`, timezone: 'Africa/Tunis' });
const days = (count: number) => Array.from({ length: count }, (_, i) => event(shiftDate('2026-01-01', i)));
test('day 1/2/3/7/8, yesterday grace, missed day, restart; no invented past days', () => {
  assert.equal(streakSummary([], '2026-01-01').currentStreak, 0);
  for (const n of [1, 2, 3, 7, 8]) assert.equal(streakSummary(days(n), shiftDate('2026-01-01', n - 1)).currentStreak, n);
  assert.equal(streakSummary(days(8), '2026-01-09').currentStreak, 8);
  assert.equal(streakSummary(days(8), '2026-01-10').currentStreak, 0);
  const restarted = streakSummary([...days(8), event('2026-01-10')], '2026-01-10');
  assert.equal(restarted.currentStreak, 1); assert.equal(restarted.longestStreak, 8);
});

test('today and tomorrow visits give two days; same-day reopen never increments', () => {
  const first = appendDailyVisit(emptyStreakCache('visitor', 'Africa/Tunis'), new Date('2026-10-28T08:00:00Z'));
  assert.equal(streakSummary(first.events, '2026-10-28').currentStreak, 1);
  const repeat = appendDailyVisit(first, new Date('2026-10-28T21:30:00Z'));
  assert.equal(repeat, first);
  const tomorrow = appendDailyVisit(repeat, new Date('2026-10-29T08:00:00Z'));
  assert.equal(tomorrow.events.length, 2);
  assert.equal(streakSummary(tomorrow.events, '2026-10-29').currentStreak, 2);
  const worship = appendActivity(tomorrow, event('2026-10-29', 'adhkar'));
  assert.equal(streakSummary(worship.events, '2026-10-29').currentStreak, 2);
  const gap = appendDailyVisit(worship, new Date('2026-10-31T08:00:00Z'));
  assert.equal(streakSummary(gap.events, '2026-10-31').currentStreak, 1);
  assert.ok(gap.achievements.some(a => a.achievementId === 'streak_1'));
});

test('daily visits use the account timezone and concurrent tabs persist only one', async () => {
  const uid = crypto.randomUUID();
  const now = new Date('2026-10-30T23:30:00Z');
  await Promise.all(Array.from({ length: 4 }, () => updateStreakCache(uid, 'Africa/Tunis', s => appendDailyVisit(s, now))));
  const restored = await updateStreakCache(uid, 'UTC', s => s);
  assert.equal(restored.events.length, 1);
  assert.equal(restored.events[0].date, '2026-10-31');
  assert.equal(restored.pendingIds.length, 1);
  assert.equal(appendDailyVisit(restored, now), restored);
});
test('multiple activities and device duplicates count as one day', () => {
  const a = event('2026-01-01');
  assert.equal(streakSummary([a, a, event(a.date, 'adhkar'), event(a.date)], a.date).currentStreak, 1);
});
test('calendar date respects configured timezone and DST boundaries', () => {
  assert.equal(activityDate(new Date('2026-01-01T23:55:00Z'), 'Africa/Tunis'), '2026-01-02');
  assert.equal(activityDate(new Date('2026-01-02T03:55:00Z'), 'America/New_York'), '2026-01-01');
  assert.equal(activityDate(new Date('2026-03-08T07:30:00Z'), 'America/New_York'), '2026-03-08');
  assert.equal(shiftDate('2026-03-08', -1), '2026-03-07');
});
test('all 9 badges persist across a break and have immutable IDs', () => {
  const awards = earnedAchievements(days(365));
  assert.equal(awards.length, 9);
  const after = earnedAchievements([event('2027-02-01')], awards);
  assert.deepEqual(after, awards);
});
test('IndexedDB survives refresh/login and isolates accounts; concurrent tabs retain writes', async () => {
  const uid = crypto.randomUUID();
  await Promise.all(days(7).map(e => updateStreakCache(uid, 'Africa/Tunis', s => appendActivity(s, e))));
  const reloaded = await updateStreakCache(uid, 'UTC', s => s);
  assert.equal(reloaded.events.length, 7); assert.equal(reloaded.pendingIds.length, 7);
  assert.equal(reloaded.achievements.length, 3); assert.equal(reloaded.timezone, 'Africa/Tunis');
  const other = await updateStreakCache('other-account', 'UTC', s => s);
  assert.equal(other.events.length, 0); assert.equal(other.achievements.length, 0);
});
test('offline merge acknowledges only sent events and preserves new writes and permanent awards', () => {
  const a = event('2026-01-01'), b = event('2026-01-02');
  const initial = appendActivity(emptyStreakCache('user', 'Africa/Tunis'), a);
  const inFlight = appendActivity(initial, b);
  const remote = { timezone: 'Africa/Tunis', events: [a], achievements: initial.achievements };
  const merged = mergeStreakCache(inFlight, remote, [a.eventId]);
  assert.equal(merged.events.length, 2); assert.deepEqual(merged.pendingIds, [b.eventId]);
  assert.deepEqual(mergeStreakCache(merged, remote, [a.eventId]), merged);
});
test('worship integration excludes historical manual istighfar corrections', async () => {
  const context = await readFile('src/context/AppContext.tsx', 'utf8');
  const historical = context.slice(context.indexOf('const recordIstighfarBatch ='), context.indexOf('const decrementIstighfar ='));
  assert.ok(!historical.includes('recordDailyActivity'));
  assert.match(context, /if \(newCount === DAILY_ISTIGHFAR_TARGET\) \{\s*void recordDailyActivity\('istighfar'\)/);
  assert.equal((context.match(/recordDailyActivity\('qada_prayer'\)/g) || []).length, 2);
  const quran = await readFile('src/pages/QuranPage.tsx', 'utf8');
  assert.match(quran, /onClick=\{\(\) => \{\s*void recordDailyActivity\('quran'\)/);
});

test('SQL server deduplicates, merges device history, retains awards, and isolates authenticated accounts', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create schema auth; create table auth.users(id uuid primary key); create role anon; create role authenticated;
      create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      insert into auth.users values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');`);
    await db.exec(await readFile('supabase/migrations/202609230001_streak_achievements.sql', 'utf8'));
    await db.exec(await readFile('supabase/migrations/202610300001_daily_app_visits.sql', 'utf8'));
    const user = '11111111-1111-4111-8111-111111111111';
    await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [user]);
    await db.exec('set role authenticated');
    const sync = async (events: ActivityEvent[]) => (await db.query<{ result: any }>(`select public.sync_daily_streak($1::jsonb,'[]','Africa/Tunis',false) result`, [JSON.stringify(events)])).rows[0].result;
    let result = await sync(days(3));
    assert.equal(result.achievements.length, 2);
    const more = days(7).slice(3);
    await sync(more); result = await sync(more); // retry the same offline batch
    assert.equal(result.events.length, 7); assert.equal(result.achievements.length, 3);
    result = await sync([event('2026-01-01'), event('2026-01-10', 'fasting')]);
    assert.equal(result.events.length, 8); assert.equal(result.achievements.length, 3);
    assert.equal(streakSummary(result.events, '2026-01-10').currentStreak, 1);
    result = await sync([event('2026-01-11', 'app_open'), event('2026-01-11', 'app_open')]);
    assert.equal(result.events.filter((e: ActivityEvent) => e.type === 'app_open').length, 1);
    assert.equal(streakSummary(result.events, '2026-01-11').currentStreak, 2);
    await assert.rejects(db.exec('select * from streak_activity_events'), /permission denied/);
    await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, ['22222222-2222-4222-8222-222222222222']);
    const other = await sync([]); assert.deepEqual(other.events, []); assert.deepEqual(other.achievements, []);
    await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
    await assert.rejects(sync([]), /Authentication required/);
  } finally { await db.close(); }
});
