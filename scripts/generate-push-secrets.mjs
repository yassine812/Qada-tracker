import webpush from 'web-push';
import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
// Runtime-generated secrets: create once, refuse to replace an existing keypair.
// Losing/rotating the private key invalidates existing subscriptions.
const keys = webpush.generateVAPIDKeys();
await writeFile(new URL('../.env.push.local', import.meta.url), [
  `VAPID_PUBLIC_KEY=${keys.publicKey}`,
  `VAPID_PRIVATE_KEY=${keys.privateKey}`,
  'VAPID_SUBJECT=mailto:zerniyassine21@gmail.com',
  `CRON_SECRET=${randomBytes(32).toString('hex')}`,
  '',
].join('\n'), { flag: 'wx', mode: 0o600 });
console.log('Created ignored .env.push.local. No secrets printed. Keep these keys stable across deploys.');
