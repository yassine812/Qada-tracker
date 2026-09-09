import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import test from 'node:test';

const dist = resolve('dist');
const read = (path) => readFile(join(dist, path), 'utf8');
const routes = ['about', 'privacy', 'guides', 'guides/offline', 'guides/backup'];

test('public information pages contain meaningful pre-rendered Arabic and working navigation', async () => {
  for (const route of routes) {
    const html = await read(`${route}/index.html`);
    assert.match(html, /<h1[ >]/, route);
    assert.match(html, /[\u0600-\u06ff]{3}/, route);
    assert.match(html, /href="\/privacy"/, route);
    assert.match(html, /href="\/app"/, route);
    assert.ok(html.length > 4000, `Public content is unexpectedly sparse: ${route}`);
    assert.doesNotMatch(html, /<script[^>]+src=["'][^"']*(?:googlesyndication|doubleclick|fundingchoices)/, 'No live advertising or consent script may be emitted by default');
  }
});

test('production precache includes every required chunk, font, Quran dataset and public page', async () => {
  const worker = await read('sw.js');
  assert.doesNotMatch(worker, /__QADA_BUILD_ID__|__QADA_PRECACHE__/);
  const serialized = worker.match(/const PRECACHE_URLS = (\[[\s\S]*?\]);/);
  assert.ok(serialized, 'Build manifest must be present');
  const manifest = new Set(JSON.parse(serialized[1]));
  const assets = await readdir(join(dist, 'assets'));
  for (const file of assets.filter((file) => /\.(js|css|woff2?)$/.test(file))) {
    assert.ok(manifest.has(`/assets/${file}`), `Missing asset: ${file}`);
  }
  for (const path of ['/index.html', '/data/quran-uthmani.json', '/data/quran-en-sahih.json', '/data/quran-pages.json', '/qada-garden-poster.jpg', '/manifest.webmanifest', ...routes.map((route) => `/${route}/index.html`)]) {
    assert.ok(manifest.has(path), `Missing required file: ${path}`);
  }
  assert.ok(!manifest.has('/_headers') && !manifest.has('/_redirects'), 'Netlify control files are not HTTP resources');
  assert.ok([...manifest].every((url) => url.split('/').every((part) => !part.startsWith('.'))), 'Hidden tooling files are not public HTTP resources and must never block offline installation');
  assert.ok([...manifest].every((url) => !/\.(mp4|mp3)$/.test(url) && !/^https?:/.test(url)), 'Streamed media and external services must not block preparation');
  const buildId = worker.match(/const BUILD_ID = ['"]([^'"]+)['"]/)[1];
  for (const file of ['index.html', ...routes.map((route) => `${route}/index.html`)]) {
    assert.ok((await read(file)).includes(`<meta name="qada-build" content="${buildId}">`), `Mismatched page/worker revision: ${file}`);
  }
});

test('manual Netlify upload retains app route rewrites and safe worker update headers', async () => {
  assert.match(await read('_redirects'), /\/app\s+\/index\.html\s+200/);
  assert.match(await read('_redirects'), /\/app\/\*\s+\/index\.html\s+200/);
  assert.match(await read('_headers'), /\/sw\.js\s+Cache-Control: no-cache, no-store, must-revalidate/);
  assert.match(await read('robots.txt'), /Disallow: \/app/);
  const sellers = await read('ads.txt');
  assert.ok(sellers.startsWith('# Advertising is not enabled.') || /^google\.com, pub-\d{16}, DIRECT, f08c47fec0942fa0\n$/.test(sellers), 'Never publish a fake seller ID');
});

test('all Quran datasets are bundled, parseable and complete', async () => {
  for (const file of ['quran-uthmani.json', 'quran-en-sahih.json']) {
    const value = JSON.parse(await read(`data/${file}`));
    const surahs = value.data?.surahs || value.surahs || value;
    assert.equal(surahs.length, 114, file);
  }
  const pages = JSON.parse(await read('data/quran-pages.json'));
  assert.equal(Object.keys(pages).length, 604);
});
