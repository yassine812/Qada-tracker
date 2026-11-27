// Explicit opt-in authenticated RPC integration test. Uses one disposable QA account;
// never reads or mutates an existing person's progress. Credentials stay in memory.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
if (!process.argv.includes('--run')) throw new Error('Pass --run for the disposable production RPC test');
const privateConfig = parse(await readFile('.env.push.local'));
const publicConfig = parse(await readFile('.env.local'));
const url = publicConfig.VITE_SUPABASE_URL;
const key = publicConfig.VITE_SUPABASE_PUBLISHABLE_KEY;
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, privateConfig.SUPABASE_SERVICE_ROLE_KEY, options);
const email = `qada-streak-qa-${Date.now()}@example.com`, password = crypto.randomUUID() + crypto.randomUUID();
const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { purpose: 'disposable-streak-integration-test' } });
if (created.error) throw new Error(`Test account creation failed: ${created.error.code}`);
const id = created.data.user.id;
try {
  const pc = createClient(url,key,options), phone = createClient(url,key,options);
  for (const client of [pc,phone]) {
    const {error} = await client.auth.signInWithPassword({email,password});
    if (error) throw new Error(`QA login failed: ${error.code}`);
  }
  const make = (day,type='app_open') => ({eventId:crypto.randomUUID(),type,date:`2026-01-${String(day).padStart(2,'0')}`,occurredAt:`2026-01-${String(day).padStart(2,'0')}T12:00:00Z`,timezone:'Africa/Tunis'});
  const sync = async (client,events=[]) => {
    const {data,error} = await client.rpc('sync_daily_streak',{p_events:events,p_timezone:'Africa/Tunis'});
    if(error) throw new Error(`RPC failed: ${error.code} ${error.message}`);
    return data;
  };
  const pcEvents=[1,2,3].map(d=>make(d)), phoneEvents=[4,5,6,7].map(d=>make(d));
  await Promise.all([sync(pc,pcEvents),sync(phone,phoneEvents)]);
  const first = await sync(pc), second = await sync(phone);
  assert.equal(first.events.length,7); assert.equal(first.achievements.length,3);
  assert.equal(first.events.filter(event => event.type === 'app_open').length,7);
  assert.deepEqual(first,second);
  await sync(phone,phoneEvents); // retry an offline batch
  await sync(pc,[make(7)]); // same day/type from another device with a new event ID
  assert.equal((await sync(pc)).events.length,7);
  await pc.auth.signOut();
  const reLogin = await pc.auth.signInWithPassword({email,password}); assert.equal(reLogin.error,null);
  assert.deepEqual(await sync(pc),second);
  await sync(phone,[make(10,'fasting')]);
  const afterGap = await sync(pc); assert.equal(afterGap.achievements.length,3); assert.equal(afterGap.events.length,8);
  const anon=createClient(url,key,options);
  const denied=await anon.rpc('sync_daily_streak'); assert.ok(denied.error);
  console.log('PASS: two independent authenticated clients, concurrent writes, both sync directions, retry deduplication, same-day merge, logout/login, permanent awards, anonymous denial.');
  console.log('This is an API integration test, not a physical iPhone test.');
} finally {
  const removed=await admin.auth.admin.deleteUser(id);
  if(removed.error) throw new Error('QA account cleanup failed; remove only the disposable-streak-integration-test account.');
  console.log('Disposable QA account and its test activity were removed; real user records were untouched.');
}
