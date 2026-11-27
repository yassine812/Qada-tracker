import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// tsx resolves extensionless imports that production Node ESM rejects.
// Compile the actual API graph and load it with plain Node to catch that regression.
await mkdir('artifacts', { recursive: true });
const output = await mkdtemp(resolve('artifacts/push-runtime-check-'));
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--outDir', output,
  '--noEmit', 'false', '--module', 'NodeNext', '--moduleResolution', 'NodeNext',
  '--target', 'ES2022', '--esModuleInterop', '--skipLibCheck', 'api/notifications/[action].ts'], { stdio: 'inherit' });
const entry = pathToFileURL(resolve(output, 'api/notifications/[action].js')).href;
execFileSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(entry)}); console.log('Production push ESM runtime: PASS');`], { stdio: 'inherit' });
