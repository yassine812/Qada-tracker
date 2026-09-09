import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const template = await readFile(path.join(root, 'public/sw.js'), 'utf8');
if (!template.includes("'__QADA_BUILD_ID__'") || !template.includes('/*__QADA_PRECACHE__*/ []')) {
  throw new Error('Service worker build injection points are missing');
}

async function listFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  // Hosting providers do not serve hidden tooling files (for example a copied
  // assets/aistudio/.gitignore). They are not application dependencies and must
  // never make an otherwise complete offline installation fail atomically.
  const lists = await Promise.all(entries.filter((entry) => !entry.name.startsWith('.')).map(async (entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? listFiles(path.join(directory, entry.name), relative) : [relative];
  }));
  return lists.flat();
}

const essential = [
  'index.html', 'manifest.webmanifest', 'apple-touch-icon.png', 'icon.svg',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png',
  'qada-garden-poster.jpg', 'data/quran-uthmani.json', 'data/quran-en-sahih.json', 'data/quran-pages.json',
];
const files = (await listFiles(dist)).filter((name) =>
  essential.includes(name) || name.endsWith('.html') || name.startsWith('assets/') || name.startsWith('data/') || name.startsWith('licenses/'),
).filter((name) => !/\.(mp4|mp3|m4a|webm|map)$/i.test(name)).sort();
for (const name of essential) {
  if (!files.includes(name)) throw new Error(`Required offline file is missing: ${name}`);
}
for (const extension of ['js', 'css', 'woff2']) {
  if (!files.some((name) => name.startsWith('assets/') && name.endsWith(`.${extension}`))) {
    throw new Error(`No bundled ${extension} assets found; run Vite before generating the worker`);
  }
}

const hash = createHash('sha256').update(template);
const contents = new Map();
let bytes = 0;
for (const name of files) {
  let content = await readFile(path.join(dist, ...name.split('/')));
  // Allow rerunning this step on the same dist without creating a new identity.
  if (name.endsWith('.html')) {
    content = Buffer.from(content.toString().replace(/<meta name="qada-build" content="[^"]+">/g, ''));
  }
  contents.set(name, content);
  hash.update(name).update('\0').update(content).update('\0');
  bytes += content.byteLength;
}
const buildId = hash.digest('hex').slice(0, 20);
for (const [name, content] of contents) {
  if (!name.endsWith('.html')) continue;
  const html = content.toString();
  if (!html.includes('</head>')) throw new Error(`Built HTML is missing its head: ${name}`);
  await writeFile(path.join(dist, ...name.split('/')), html.replace('</head>', `<meta name="qada-build" content="${buildId}"></head>`));
}
const worker = template.replaceAll('__QADA_BUILD_ID__', buildId)
  .replace('/*__QADA_PRECACHE__*/ []', JSON.stringify(files.map((name) => `/${name}`)));
await writeFile(path.join(dist, 'sw.js'), worker);
console.log(`Offline build ${buildId}: ${files.length} required files, ${(bytes / 1024 / 1024).toFixed(2)} MiB; optional videos, audio and ads excluded.`);
