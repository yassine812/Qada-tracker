import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMonthlyQada, calculateEstimatedDays, calculateEstimatedMonths, calculateTotalDailyPlan, calculateTotalMonthlyPlan, normalizeQadaPlan, isValidDailyTarget } from '../src/utils/qadaPlan.ts';

test('independent targets, monthly capacity and duration examples', () => {
  for (const [target, monthly, days, months] of [[5,150,482,16],[10,300,241,8],[1,30,2408,79],[2,60,1204,40]]) {
    assert.equal(calculateMonthlyQada(target), monthly);
    assert.equal(calculateEstimatedDays(2408, target), days);
    assert.equal(calculateEstimatedMonths(2408, target), months);
  }
  const plans = { fajr: 5, dhuhr: 5, asr: 5, maghrib: 5, isha: 5 };
  assert.equal(calculateTotalDailyPlan(plans), 25);
  assert.equal(calculateTotalMonthlyPlan(plans), 750);
  assert.equal(calculateTotalDailyPlan({ ...plans, fajr: 10 }), 30);
  assert.equal(calculateEstimatedDays(2407, plans.fajr), 482);
  assert.equal(plans.fajr, 5);
});
test('unset, invalid and completed plans never divide by zero or overflow', () => {
  for (const value of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
    assert.equal(isValidDailyTarget(value), false);
    assert.equal(calculateEstimatedDays(2408, value), null);
    assert.equal(calculateMonthlyQada(value), 0);
  }
  assert.equal(calculateEstimatedDays(0, 5), 0);
  assert.equal(calculateEstimatedDays(-2, 5), null);
  assert.deepEqual(normalizeQadaPlan({ fajr: 5, dhuhr: 0, asr: 1.5 }), { fajr: 5 });
  assert.deepEqual(normalizeQadaPlan(undefined), {});
});

test('plan survives IndexedDB export/import used by account restoration without changing counters', async () => {
  const { indexedDB } = await import('fake-indexeddb');
  Object.assign(globalThis, { indexedDB, window: { indexedDB, dispatchEvent() {} }, localStorage: {
    values: new Map(), getItem(key) { return this.values.get(key) ?? null; },
    setItem(key, value) { this.values.set(key, value); }, removeItem(key) { this.values.delete(key); },
  }});
  const { saveSettings, saveCounters, getSettings, getCounters, exportAllData, importAllData } = await import('../src/storage/indexedDb.ts');
  const settings = { hasCompletedOnboarding: true, pubertyAge: 14, currentAge: 25, gender: 'male', prayerFrequency: 0, theme: 'dark', qadaPlan: { fajr: 5, dhuhr: 2, asr: 3, maghrib: 10, isha: 7 }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any;
  const counters = Object.fromEntries(['fajr','dhuhr','asr','maghrib','isha'].map(key => [key, { initial: 2408, remaining: 2408, completed: 0 }])) as any;
  await saveSettings(settings);
  await saveCounters(counters);
  assert.deepEqual((await getSettings())?.qadaPlan, settings.qadaPlan);
  const backup = JSON.parse(JSON.stringify(await exportAllData()));
  await saveSettings({ ...settings, qadaPlan: {} });
  await importAllData(backup);
  assert.deepEqual((await getSettings())?.qadaPlan, settings.qadaPlan);
  assert.deepEqual(await getCounters(), counters);
});
