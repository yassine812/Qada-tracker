import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicAuthConfig, passwordProblem, authErrorMessage } from '../src/services/authPolicy.mjs';
import { readFile } from 'node:fs/promises';

const jwt = role => `header.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`;
test('accepts only browser-public Supabase credentials over HTTPS', () => {
  assert.deepEqual(publicAuthConfig('https://project.supabase.co', 'sb_publishable_test'), { url: 'https://project.supabase.co', key: 'sb_publishable_test' });
  assert.ok(publicAuthConfig('https://project.supabase.co', jwt('anon')));
  for (const key of ['', 'sb_secret_admin', jwt('service_role'), jwt('authenticated'), 'not-a-key']) assert.equal(publicAuthConfig('https://project.supabase.co', key), null);
  for (const url of ['', 'javascript:alert(1)', 'http://project.supabase.co', 'https://user:pass@project.supabase.co', 'https://project.supabase.co/path']) assert.equal(publicAuthConfig(url, 'sb_publishable_test'), null);
});
test('registration and reset enforce long matching passwords', () => {
  assert.ok(passwordProblem('short', 'short'));
  assert.ok(passwordProblem('a'.repeat(129), 'a'.repeat(129)));
  assert.ok(passwordProblem('long-passphrase', 'different-passphrase'));
  assert.equal(passwordProblem('a safe long passphrase', 'a safe long passphrase'), '');
});
test('auth errors are localized and never expose backend descriptions or email existence', () => {
  for (const error of [{ message: 'secret internals' }, { code: 'user_already_exists' }, { code: 'user_not_found' }]) {
    assert.equal(authErrorMessage(error), authErrorMessage({}));
  }
  assert.match(authErrorMessage({ code: 'invalid_credentials' }), /غير صحيحة/);
  assert.match(authErrorMessage({ code: 'email_not_confirmed' }), /أكّد/);
  assert.match(authErrorMessage({ status: 429 }), /انتظر/);
  assert.match(authErrorMessage({ code: 'otp_expired' }), /انتهت/);
});
test('account route is outside ad and personal-record providers', async () => {
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /if \(path === '\/account'\) return <AuthProvider><AccountPage \/><\/AuthProvider>/);
  const page = await readFile(new URL('../src/pages/AccountPage.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(page, /AdSlot|useApp|indexedDb/);
  assert.match(page, /signInWithPassword/);
  assert.match(page, /resetPasswordForEmail/);
  assert.match(page, /emailRedirectTo/);
  assert.match(page, /scope: 'local'/);
  assert.match(page, /!authClient \|\| busy \|\| !online/);
});
test('build configuration rejects private keys before browser bundling', async () => {
  const config = await readFile(new URL('../vite.config.ts', import.meta.url), 'utf8');
  assert.match(config, /!publicAuthConfig\(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY\)/);
  assert.match(config, /throw new Error\('Invalid Supabase browser configuration/);
});
