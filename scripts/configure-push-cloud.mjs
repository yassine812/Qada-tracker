// Owner-operated setup. Credentials travel through pipes, never command arguments/logs.
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'dotenv';

const project = 'qolmdufbnzulyayxccxc';
const scope = 'yassines-projects-9fc526f9';
function cli(args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, {
      shell: process.platform === 'win32', windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
    });
    let out = ''; let err = '';
    child.stdout.on('data', data => out += data);
    child.stderr.on('data', data => err += data);
    child.on('error', () => reject(new Error('Could not launch cloud CLI')));
    child.on('close', code => code === 0 ? resolve(out) : reject(new Error(`Cloud CLI failed (${args[1]} ${args[2]}), exit ${code}. ${input ? err.replaceAll(input, '[redacted]').slice(-1200) : 'No credential output printed.'}`)));
    child.stdin.end(input);
  });
}
const action = process.argv[2];
if (!['keys', 'vercel'].includes(action)) throw new Error('Use keys or vercel');
const result = JSON.parse(await cli(['--yes', 'supabase@latest', 'projects', 'api-keys', '--project-ref', project, '--reveal', '--output', 'json']));
const keys = Array.isArray(result) ? result : result.data;
if (!Array.isArray(keys)) throw new Error('Unexpected API-key response');
if (action === 'keys') {
  console.log(JSON.stringify(keys.map(key => ({ name: key.name, type: key.type, hasKey: Boolean(key.api_key) }))));
} else {
  const service = keys.find(key => key.name === 'service_role')?.api_key || keys.find(key => key.type === 'secret')?.api_key;
  if (!service || service.includes('...')) throw new Error('No usable server-side API key returned');
  const filename = new URL('../.env.push.local', import.meta.url);
  const privateConfig = parse(await readFile(filename));
  const publicConfig = parse(await readFile(new URL('../.env.local', import.meta.url)));
  const config = {
    ...privateConfig, SUPABASE_URL: `https://${project}.supabase.co`, SUPABASE_SERVICE_ROLE_KEY: service,
    PUSH_ALLOWED_ORIGINS: 'https://qada-tracker-five.vercel.app,https://qada-tracker-yassine.netlify.app',
    VITE_SUPABASE_URL: publicConfig.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: publicConfig.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
  for (const [key, value] of Object.entries(config)) if (!value || /[\r\n]/.test(value)) throw new Error(`Missing/invalid ${key}`);
  await writeFile(filename, Object.entries(config).map(([k, v]) => `${k}=${v}`).join('\n') + '\n', { mode: 0o600 });
  const entries = Object.entries(config);
  for (let i = 0; i < entries.length; i += 3) await Promise.all(entries.slice(i, i + 3).map(async ([key, value]) => {
    await cli(['--yes', 'vercel@59.17.0', 'env', 'add', key, 'production', '--yes', '--force', key.startsWith('VITE_') ? '--no-sensitive' : '--sensitive', '--scope', scope], value);
    console.log(`Configured ${key} (value hidden)`);
  }));
}
