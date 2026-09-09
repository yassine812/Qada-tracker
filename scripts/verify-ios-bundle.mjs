import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = path.resolve(root, process.argv[2] || 'ios/App/App/public');
const json = async (file) => JSON.parse(await readFile(file, 'utf8'));
const config = await json(path.join(root, 'capacitor.config.json'));
const copiedConfig = await json(path.join(bundle, '../capacitor.config.json'));
assert.equal(config.webDir, 'dist');
const { packageClassList, ...copiedAppConfig } = copiedConfig;
assert.deepEqual(copiedAppConfig, config, 'Run ios:sync after changing Capacitor configuration');
assert.ok(!config.server?.url, 'Native startup must use bundled files, not a remote website');
assert.ok(!config.server?.allowNavigation?.length, 'Keep app navigation on the bundled origin');

async function assertLocalFile(url, from = 'index.html') {
  assert.ok(!/^(?:https?:)?\/\//i.test(url), `Remote startup dependency: ${url}`);
  const clean = decodeURIComponent(url.split(/[?#]/)[0]);
  const resolved = clean.startsWith('/')
    ? path.join(bundle, clean.slice(1))
    : path.resolve(bundle, path.dirname(from), clean);
  const relative = path.relative(bundle, resolved);
  assert.ok(!relative.startsWith('..') && !path.isAbsolute(relative), `Asset outside bundle: ${url}`);
  assert.ok((await stat(resolved)).isFile(), `Missing asset: ${url}`);
  return resolved;
}

const html = await readFile(path.join(bundle, 'index.html'), 'utf8');
assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic|serviceWorker\.register/);
const startupAssets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
assert.ok(startupAssets.some((url) => url.endsWith('.js')), 'Missing compiled JavaScript');
assert.ok(startupAssets.some((url) => url.endsWith('.css')), 'Missing compiled styles');
for (const url of startupAssets) await assertLocalFile(url);

const assets = await readdir(path.join(bundle, 'assets'));
const fonts = assets.filter((file) => file.endsWith('.woff2'));
assert.ok(fonts.length > 0, 'Fonts must ship in the app');
for (const filename of assets.filter((file) => file.endsWith('.css'))) {
  const css = await readFile(path.join(bundle, 'assets', filename), 'utf8');
  for (const match of css.matchAll(/url\(([^)]+)\)/g)) {
    const url = match[1].trim().replace(/^["']|["']$/g, '');
    if (!url.startsWith('data:') && !url.startsWith('#')) {
      await assertLocalFile(url, `assets/${filename}`);
    }
  }
}

for (const dataset of ['quran-uthmani.json', 'quran-en-sahih.json']) {
  const surahs = await json(path.join(bundle, 'data', dataset));
  assert.equal(surahs.length, 114, `Incomplete dataset: ${dataset}`);
  for (const [index, surah] of surahs.entries()) {
    assert.equal(surah.number, index + 1);
    assert.ok(surah.ayahs.length > 0);
    assert.ok(surah.ayahs.every((ayah) => typeof ayah.text === 'string' && ayah.text.length > 0));
  }
}
const pages = await json(path.join(bundle, 'data/quran-pages.json'));
for (let page = 1; page <= 604; page++) assert.ok(pages[page], `Missing Quran page ${page}`);

// A successful check verifies packaging, not behavior on a real iPhone.
console.log(`iOS bundle verified: local startup assets, ${fonts.length} font files, 114 Arabic/English surahs and 604 pages.`);
console.log('Native iPhone launch, persistence, signing and airplane-mode tests still require an iOS device/runtime.');
