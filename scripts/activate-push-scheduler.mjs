import { readFile, writeFile, unlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';
const config = parse(await readFile(new URL('../.env.push.local', import.meta.url)));
const base = 'https://qada-tracker-five.vercel.app/api/notifications';
const response = await fetch(base + '/config');
if (!response.ok || (await response.json()).publicKey !== config.VAPID_PUBLIC_KEY) throw new Error('Deploy and verify the correct backend before enabling the scheduler.');
const literal = value => "'" + value.replaceAll("'", "''") + "'";
const rows = [['qada_push_cron_url', base + '/cron'], ['qada_push_cron_secret', config.CRON_SECRET]];
const secrets = rows.map(([name, value]) => {
  if (!value) throw new Error('Missing scheduler credential');
  return `do $$ declare existing uuid; begin
    select id into existing from vault.secrets where name=${literal(name)} limit 1;
    if existing is null then perform vault.create_secret(${literal(value)},${literal(name)});
    else perform vault.update_secret(existing,${literal(value)},${literal(name)}); end if;
  end $$;`;
}).join('\n');
// Generated short-lived secret transport, ignored by both Git and Vercel.
const temporary = new URL('../.env.push-scheduler.sql', import.meta.url);
await writeFile(temporary, 'begin;\n' + secrets + '\n' + await readFile(new URL('../supabase/push-scheduler.sql', import.meta.url), 'utf8') + '\ncommit;', { flag: 'wx', mode: 0o600 });
try {
  await new Promise((resolve, reject) => {
    const child = spawn('npx.cmd', ['--yes', 'supabase@latest', 'db', 'query', '--linked', '--project-ref', 'qolmdufbnzulyayxccxc', '--file', fileURLToPath(temporary), '--output', 'json'], { shell: true, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.resume(); child.stderr.resume();
    child.on('error', () => reject(new Error('Could not run scheduler setup')));
    child.on('exit', code => code === 0 ? resolve() : reject(new Error('Scheduler setup failed. No secret output printed.')));
  });
  console.log('Scheduler configured in Supabase using Vault; one server tick per minute.');
} finally { await unlink(temporary); }
