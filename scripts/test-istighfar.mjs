import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyIstighfarBatch,
  applyIstighfarTap,
  DAILY_ISTIGHFAR_TARGET,
  parseIstighfarAmount,
} from '../src/services/istighfarLogic.mjs';

const tap = (todayCount, historicalRemaining = 255500, historicalCompleted = 0) =>
  applyIstighfarTap({ todayCount, historicalRemaining, historicalCompleted });

test('daily taps change only today before 70', () => {
  let state = { todayCount: 0, historicalRemaining: 255500, historicalCompleted: 0 };
  for (let i = 0; i < 5; i += 1) state = tap(state.todayCount, state.historicalRemaining, state.historicalCompleted);
  assert.equal(state.todayCount, 5);
  assert.equal(state.historicalRemaining, 255500);
});

test('the 70th daily tap completes today without touching history', () => {
  const state = tap(69);
  assert.equal(state.todayCount, DAILY_ISTIGHFAR_TARGET);
  assert.equal(state.historicalRemaining, 255500);
});

test('the 71st tap remains at 70 today and starts the personal goal', () => {
  const state = tap(70, 255500, 0);
  assert.equal(state.todayCount, 70);
  assert.equal(state.historicalRemaining, 255499);
  assert.equal(state.historicalCompleted, 1);
});

test('additional taps after 70 continue the personal goal without changing today', () => {
  let state = { todayCount: 70, historicalRemaining: 255500, historicalCompleted: 0 };
  for (let i = 0; i < 10; i += 1) state = tap(state.todayCount, state.historicalRemaining, state.historicalCompleted);
  assert.equal(state.todayCount, 70);
  assert.equal(state.historicalRemaining, 255490);
  assert.equal(state.historicalCompleted, 10);
});

test('a new calendar day starts a fresh daily record and preserves history', () => {
  const records = [{ date: '2026-09-13', count: 70 }, { date: '2026-09-14', count: 12 }];
  const todayCount = (date) => records.find((record) => record.date === date)?.count ?? 0;
  const historicalRemaining = 255490;
  assert.equal(todayCount('2026-09-15'), 0);
  assert.equal(historicalRemaining, 255490);
});

test('persisted state keeps both balances after reload', () => {
  const persisted = JSON.parse(JSON.stringify({ todayCount: 70, historicalRemaining: 255490, historicalCompleted: 10 }));
  assert.deepEqual(persisted, { todayCount: 70, historicalRemaining: 255490, historicalCompleted: 10 });
});

test('manual batch updates only the historical target', () => {
  const state = applyIstighfarBatch({ amount: '500', todayCount: 0, historicalRemaining: 281043, historicalCompleted: 7 });
  assert.equal(state.todayCount, 0);
  assert.equal(state.dailyPortion, 0);
  assert.equal(state.historicalPortion, 500);
  assert.equal(state.historicalCompleted, 507);
  assert.equal(state.historicalRemaining, 280543);
});

test('the requested 500 then 70 sequence keeps the ledgers separate', () => {
  let state = applyIstighfarBatch({ amount: 500, todayCount: 0, historicalRemaining: 281043, historicalCompleted: 7 });
  for (let i = 0; i < DAILY_ISTIGHFAR_TARGET; i += 1) {
    state = tap(state.todayCount, state.historicalRemaining, state.historicalCompleted);
  }
  assert.equal(state.todayCount, 70);
  assert.equal(state.historicalCompleted, 507);
  assert.equal(state.historicalRemaining, 280543);
});

test('manual batch never fills a partially complete daily target', () => {
  const state = applyIstighfarBatch({ amount: '40', todayCount: 50, historicalRemaining: 255500, historicalCompleted: 0 });
  assert.equal(state.todayCount, 50);
  assert.equal(state.dailyPortion, 0);
  assert.equal(state.historicalPortion, 40);
  assert.equal(state.historicalCompleted, 40);
  assert.equal(state.historicalRemaining, 255460);
});

test('large manual batch and Arabic numerals are supported', () => {
  const state = applyIstighfarBatch({ amount: '١٬٠٠٠', todayCount: 70, historicalRemaining: 255500, historicalCompleted: 0 });
  assert.equal(parseIstighfarAmount('10,000'), 10000);
  assert.equal(parseIstighfarAmount('43.929'), 43929);
  assert.equal(state.todayCount, 70);
  assert.equal(state.historicalPortion, 1000);
  assert.equal(state.historicalCompleted, 1000);
  assert.equal(state.historicalRemaining, 254500);
});
