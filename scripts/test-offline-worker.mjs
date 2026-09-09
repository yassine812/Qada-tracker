import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise the actual worker's lifecycle without a network or browser dependency.
// This verifies cache/update behavior; it does not replace Safari/device testing.
const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
const ORIGIN = 'https://qada.test';
const READY_KEY = '/__qada_offline_ready__';
const absolute = (value) => new URL(typeof value === 'string' ? value : value.url, ORIGIN).href;

class WorkerRequest extends Request {
  constructor(input, options) {
    super(typeof input === 'string' ? absolute(input) : input, options);
  }
}

function createCaches() {
  const stores = new Map();
  const rejectedWrites = new Set();
  const cacheApi = {
    stores,
    rejectedWrites,
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async match(request, options = {}) {
          const key = absolute(request);
          if (options.ignoreSearch) {
            const match = [...store.entries()].find(([candidate]) => candidate.split('?')[0] === key.split('?')[0]);
            return match?.[1].clone();
          }
          return store.get(key)?.clone();
        },
        async put(request, response) {
          const key = absolute(request);
          if (rejectedWrites.has(key)) throw new Error('Simulated storage quota failure');
          assert.ok(response instanceof Response, 'Cache.put must receive a Response');
          store.set(key, response.clone());
        },
        async delete(request) {
          return store.delete(absolute(request));
        },
        async keys() {
          return [...store.keys()].map((key) => new WorkerRequest(key));
        },
      };
    },
    async keys() {
      return [...stores.keys()];
    },
    async delete(name) {
      return stores.delete(name);
    },
    async match(request, options = {}) {
      for (const name of stores.keys()) {
        if (options.cacheName && options.cacheName !== name) continue;
        const result = await (await cacheApi.open(name)).match(request, options);
        if (result) return result;
      }
      return undefined;
    },
  };
  return cacheApi;
}

function buildFixture(buildId) {
  const files = new Map([
    ['/index.html', [`<!doctype html><html><head><meta name="qada-build" content="${buildId}"></head><body><script src="/assets/main-${buildId}.js"></script></body></html>`, 'text/html']],
    [`/assets/main-${buildId}.js`, [`main ${buildId}`, 'application/javascript']],
    [`/assets/reader-${buildId}.js`, [`reader ${buildId}`, 'application/javascript']],
    [`/assets/main-${buildId}.css`, [`styles ${buildId}`, 'text/css']],
    [`/assets/arabic-${buildId}.woff2`, [`font ${buildId}`, 'font/woff2']],
    ['/data/quran-uthmani.json', [`{"dataset":"arabic","build":"${buildId}"}`, 'application/json']],
    ['/data/quran-en-sahih.json', [`{"dataset":"english","build":"${buildId}"}`, 'application/json']],
    ['/data/quran-pages.json', [`{"dataset":"pages","build":"${buildId}"}`, 'application/json']],
    ['/manifest.webmanifest', ['{"name":"Qada"}', 'application/manifest+json']],
    ['/icons/icon-192.png', ['icon', 'image/png']],
    ['/qada-garden-poster.jpg', ['poster', 'image/jpeg']],
  ]);
  return { buildId, files, urls: [...files.keys()] };
}

function createNetwork(fixture) {
  const state = {
    fixture,
    offline: false,
    calls: [],
    failures: new Map(),
    gates: new Map(),
    external: new Map(),
    async fetch(input) {
      const url = absolute(input);
      state.calls.push(url);
      if (state.gates.has(url)) await state.gates.get(url);
      if (state.offline) throw new TypeError('Simulated offline network');
      if (state.failures.has(url)) {
        const failure = state.failures.get(url);
        if (failure instanceof Error) throw failure;
        return failure.clone();
      }
      if (state.external.has(url)) return state.external.get(url).clone();
      const parsed = new URL(url);
      const file = parsed.origin === ORIGIN ? state.fixture.files.get(parsed.pathname) : undefined;
      if (!file) return new Response('Not found', { status: 404 });
      return new Response(file[0], { headers: { 'Content-Type': file[1] } });
    },
  };
  return state;
}

function createWorker(fixture, { caches = createCaches(), network = createNetwork(fixture) } = {}) {
  const handlers = new Map();
  const state = { skipWaitingCalls: 0, claimCalls: 0 };
  const self = {
    location: new URL('/sw.js', ORIGIN),
    registration: { scope: `${ORIGIN}/`, async showNotification() {} },
    clients: {
      async claim() { state.claimCalls++; },
      async matchAll() { return []; },
      async openWindow() {},
    },
    addEventListener(name, callback) {
      if (!handlers.has(name)) handlers.set(name, []);
      handlers.get(name).push(callback);
    },
    async skipWaiting() { state.skipWaitingCalls++; },
  };
  const context = vm.createContext({
    self, caches, Request: WorkerRequest, Response, Headers, URL,
    fetch: network.fetch,
    console: { log() {}, warn() {}, error() {} },
    setTimeout, clearTimeout, crypto: globalThis.crypto,
  });
  const compiled = source
    .replaceAll('__QADA_BUILD_ID__', fixture.buildId)
    .replace('/*__QADA_PRECACHE__*/ []', JSON.stringify(fixture.urls));
  assert.notEqual(compiled, source, 'Worker must retain its production-build injection points');
  vm.runInContext(compiled, context, { filename: 'public/sw.js' });

  async function dispatch(name, details = {}) {
    const waiting = [];
    let response;
    const event = {
      ...details,
      waitUntil(promise) { waiting.push(Promise.resolve(promise)); },
      respondWith(promise) { response = Promise.resolve(promise); },
    };
    for (const handler of handlers.get(name) || []) handler(event);
    // Attach both rejection handlers immediately to model browser event lifetimes.
    const outcome = response ? await Promise.allSettled([response, ...waiting]) : await Promise.allSettled(waiting);
    const failed = outcome.find((result) => result.status === 'rejected');
    if (failed) throw failed.reason;
    return response ? outcome[0].value : undefined;
  }

  return {
    caches, network, state,
    install: () => dispatch('install'),
    activate: () => dispatch('activate'),
    async status(type = 'QADA_OFFLINE_STATUS') {
      const replies = [];
      await dispatch('message', {
        data: { type },
        ports: [{ postMessage(value) { replies.push(structuredClone(value)); } }],
      });
      assert.equal(replies.length, 1, 'Readiness query must receive exactly one response');
      return replies[0];
    },
    async request(url, { navigate = false, method = 'GET', destination = '' } = {}) {
      const request = new WorkerRequest(url, { method });
      Object.defineProperty(request, 'mode', { value: navigate ? 'navigate' : 'cors' });
      Object.defineProperty(request, 'destination', { value: navigate ? 'document' : destination });
      return dispatch('fetch', { request });
    },
  };
}

test('first visit precaches unvisited reader, fonts and complete Quran paths for an offline restart', async () => {
  const fixture = buildFixture('first');
  const worker = createWorker(fixture);
  assert.equal((await worker.status()).ready, false);
  await worker.install();
  await worker.activate();
  assert.deepEqual(await worker.status(), { ready: true, buildId: 'first' });
  assert.equal(worker.state.skipWaitingCalls, 0);

  worker.network.offline = true;
  const restarted = createWorker(fixture, worker);
  assert.deepEqual(await restarted.status(), { ready: true, buildId: 'first' });
  for (const url of ['/', '/app', '/app/quran?surah=114']) {
    const response = await restarted.request(url, { navigate: true });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), fixture.files.get('/index.html')[0]);
  }
  for (const url of fixture.urls.filter((url) => url !== '/index.html')) {
    const response = await restarted.request(url);
    assert.equal(response.status, 200, `Unavailable after offline restart: ${url}`);
    assert.equal(await response.text(), fixture.files.get(url)[0]);
  }
});

test('readiness waits for the final required download and detects evicted assets', async () => {
  const fixture = buildFixture('readiness');
  const worker = createWorker(fixture);
  let release;
  worker.network.gates.set(absolute('/data/quran-pages.json'), new Promise((resolve) => { release = resolve; }));
  const installing = worker.install();
  assert.equal((await worker.status()).ready, false);
  release();
  await installing;
  assert.equal((await worker.status()).ready, true);
  const cache = await worker.caches.open('qada-static-readiness');
  await cache.delete('/assets/reader-readiness.js');
  assert.equal((await worker.status()).ready, false, 'An orphaned ready marker must not conceal missing assets');
});

for (const failure of ['http', 'network', 'html-fallback', 'quota', 'wrong-html-build']) {
  test(`required ${failure} failure rejects install, removes partial cache and never reports ready`, async () => {
    const fixture = buildFixture(`failure-${failure}`);
    const worker = createWorker(fixture);
    const target = absolute('/data/quran-pages.json');
    if (failure === 'http') worker.network.failures.set(target, new Response('Unavailable', { status: 503 }));
    if (failure === 'network') worker.network.failures.set(target, new TypeError('Network interrupted'));
    if (failure === 'html-fallback') worker.network.failures.set(target, new Response('<html>SPA fallback</html>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
    if (failure === 'quota') worker.caches.rejectedWrites.add(target);
    if (failure === 'wrong-html-build') worker.network.failures.set(absolute('/index.html'), new Response(buildFixture('different').files.get('/index.html')[0], { headers: { 'Content-Type': 'text/html' } }));

    await assert.rejects(worker.install());
    assert.equal(worker.state.skipWaitingCalls, 0);
    assert.equal((await worker.status()).ready, false);
    const cache = await worker.caches.open(`qada-static-${fixture.buildId}`);
    assert.equal(await cache.match(READY_KEY), undefined);
    assert.equal((await cache.keys()).length, 0, 'Failure cleanup must wait for concurrent writes to settle');
  });
}

test('failed installation waits for slow concurrent writes before removing its partial cache', async () => {
  const fixture = buildFixture('concurrent-failure');
  const worker = createWorker(fixture);
  let release;
  worker.network.gates.set(absolute('/data/quran-pages.json'), new Promise((resolve) => { release = resolve; }));
  worker.network.failures.set(absolute('/assets/main-concurrent-failure.js'), new Response('Unavailable', { status: 503 }));
  let settled = false;
  const installing = worker.install().then(
    () => { settled = true; return null; },
    (error) => { settled = true; return error; },
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(settled, false, 'Rejecting before pending writes finish can recreate a deleted partial cache');
  release();
  assert.ok(await installing, 'A failed required asset must reject the installation');
  assert.equal((await worker.status()).ready, false);
  const cache = await worker.caches.open('qada-static-concurrent-failure');
  assert.equal((await cache.keys()).length, 0);
});

test('deploy upgrade keeps the active shell and assets coherent until the new worker activates', async () => {
  const oldFixture = buildFixture('old');
  const oldWorker = createWorker(oldFixture);
  await oldWorker.install();
  await oldWorker.activate();
  const newFixture = buildFixture('new');
  oldWorker.network.fixture = newFixture;
  const nextWorker = createWorker(newFixture, oldWorker);
  await nextWorker.install();
  assert.equal(nextWorker.state.skipWaitingCalls, 0, 'An upgrade must wait for existing tabs to close');

  for (let request = 0; request < 2; request++) {
    assert.equal(await (await oldWorker.request('/', { navigate: true })).text(), oldFixture.files.get('/index.html')[0]);
    assert.equal(await (await oldWorker.request('/assets/main-old.js')).text(), 'main old');
    assert.equal(await (await oldWorker.request('/data/quran-pages.json')).text(), oldFixture.files.get('/data/quran-pages.json')[0]);
  }
  await nextWorker.activate();
  nextWorker.network.offline = true;
  assert.equal(await (await nextWorker.request('/app', { navigate: true })).text(), newFixture.files.get('/index.html')[0]);
  assert.equal(await (await nextWorker.request('/assets/main-new.js')).text(), 'main new');
  assert.deepEqual(await nextWorker.status(), { ready: true, buildId: 'new' });
});

test('failed update leaves the previous complete offline installation usable', async () => {
  const oldFixture = buildFixture('working');
  const oldWorker = createWorker(oldFixture);
  await oldWorker.install();
  await oldWorker.activate();
  const nextFixture = buildFixture('broken');
  oldWorker.network.fixture = nextFixture;
  oldWorker.network.failures.set(absolute('/assets/reader-broken.js'), new Response('Unavailable', { status: 503 }));
  const nextWorker = createWorker(nextFixture, oldWorker);
  await assert.rejects(nextWorker.install());
  oldWorker.network.offline = true;
  assert.deepEqual(await oldWorker.status(), { ready: true, buildId: 'working' });
  assert.equal(await (await oldWorker.request('/', { navigate: true })).text(), oldFixture.files.get('/index.html')[0]);
  assert.equal(await (await oldWorker.request('/assets/reader-working.js')).text(), 'reader working');
});

test('activation cleans only owned old caches and never reads an unrelated app shell', async () => {
  const fixture = buildFixture('cleanup');
  const caches = createCaches();
  for (const name of ['another-app-v1', 'qada-unrelated', 'qada-runtime-v1', 'qada-static-old', 'qada-v11', 'qada-fonts-v2']) {
    await (await caches.open(name)).put('/index.html', new Response(`shell from ${name}`));
  }
  const worker = createWorker(fixture, { caches });
  await worker.install();
  await worker.activate();
  assert.deepEqual((await caches.keys()).sort(), ['another-app-v1', 'qada-unrelated', 'qada-runtime-v1', 'qada-static-cleanup'].sort());
  worker.network.offline = true;
  assert.equal(await (await worker.request('/', { navigate: true })).text(), fixture.files.get('/index.html')[0]);
});

test('uncached optional resources return a concrete offline response; video and mutations pass through', async () => {
  const worker = createWorker(buildFixture('missing'));
  await worker.install();
  worker.network.offline = true;
  for (const url of ['/assets/unknown.js', '/data/unknown.json', '/unvisited-resource.txt']) {
    const response = await worker.request(url);
    assert.ok(response instanceof Response, `Fetch handler returned no Response for ${url}`);
    assert.equal(response.status, 503);
  }
  assert.equal(await worker.request('/qada-garden.mp4', { destination: 'video' }), undefined);
  assert.equal(await worker.request('/api/save', { method: 'POST' }), undefined);
});

test('optional external responses cache on demand without replacing the versioned shell', async () => {
  const fixture = buildFixture('runtime');
  const worker = createWorker(fixture);
  const external = 'https://api.alquran.cloud/v1/ayah/1:1/ar.muyassar';
  worker.network.external.set(external, new Response('{"tafsir":"cached text"}', { headers: { 'Content-Type': 'application/json' } }));
  await worker.install();
  assert.ok(!worker.network.calls.includes(external), 'Optional APIs must not block first-use offline readiness');
  assert.equal(await (await worker.request(external)).text(), '{"tafsir":"cached text"}');
  worker.network.offline = true;
  assert.equal(await (await worker.request(external)).text(), '{"tafsir":"cached text"}');
  assert.equal(await (await worker.request('/', { navigate: true })).text(), fixture.files.get('/index.html')[0]);
});

test('advertising, consent and unrelated third-party requests are never intercepted or cached', async () => {
  const worker = createWorker(buildFixture('ads'));
  await worker.install();
  const requests = [
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-123',
    'https://fundingchoicesmessages.google.com/i/pub-123',
    'https://googleads.g.doubleclick.net/pagead/ads',
    'https://example.com/remote-script.js',
  ];
  for (const offline of [false, true]) {
    worker.network.offline = offline;
    for (const url of requests) assert.equal(await worker.request(url), undefined);
  }
  assert.ok(requests.every((url) => !worker.network.calls.includes(url)));
  for (const cacheName of await worker.caches.keys()) {
    const cache = await worker.caches.open(cacheName);
    for (const url of requests) assert.equal(await cache.match(url), undefined);
  }
});

test('prerendered public pages keep their own HTML and are available offline without the application shell', async () => {
  const fixture = buildFixture('public-pages');
  for (const path of ['/about/index.html', '/privacy/index.html', '/guides/offline/index.html']) {
    fixture.files.set(path, [`<html><head><meta name="qada-build" content="public-pages"></head><body>${path}</body></html>`, 'text/html']);
    fixture.urls.push(path);
  }
  const worker = createWorker(fixture);
  await worker.install();
  worker.network.offline = true;
  for (const path of ['/about', '/privacy/', '/guides/offline', '/guides/offline/index.html']) {
    const expected = path.endsWith('.html') ? path : `${path.replace(/\/$/, '')}/index.html`;
    assert.equal(await (await worker.request(path, { navigate: true })).text(), fixture.files.get(expected)[0]);
  }
});

test('a wrong-build prerendered HTML document rejects the complete installation', async () => {
  const fixture = buildFixture('bad-public-page');
  fixture.files.set('/privacy/index.html', ['<html><head><meta name="qada-build" content="other"></head></html>', 'text/html']);
  fixture.urls.push('/privacy/index.html');
  const worker = createWorker(fixture);
  await assert.rejects(worker.install());
  assert.equal((await worker.status()).ready, false);
});

test('precache downloads run with a maximum concurrency of six', async () => {
  const fixture = buildFixture('bounded');
  const network = createNetwork(fixture);
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  let pending = 0;
  let peak = 0;
  const baseFetch = network.fetch;
  network.fetch = async (...args) => {
    pending++;
    peak = Math.max(peak, pending);
    try { await gate; return await baseFetch(...args); }
    finally { pending--; }
  };
  const worker = createWorker(fixture, { network });
  const installing = worker.install();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(peak, 6);
  release();
  await installing;
  assert.equal(peak, 6);
  assert.equal((await worker.status()).ready, true);
});

test('evicted required assets recover automatically without refetching surviving files', async () => {
  const fixture = buildFixture('repair');
  const worker = createWorker(fixture);
  await worker.install();
  const cache = await worker.caches.open('qada-static-repair');
  await cache.delete('/data/quran-pages.json');
  assert.equal((await worker.status()).ready, false);
  const beforeRepair = worker.network.calls.length;
  assert.equal((await worker.status('QADA_REPAIR_OFFLINE')).ready, true);
  assert.deepEqual(worker.network.calls.slice(beforeRepair), [absolute('/data/quran-pages.json')]);
  worker.network.offline = true;
  assert.equal((await worker.request('/data/quran-pages.json')).status, 200);
});

test('failed cache repair preserves surviving files and cannot claim readiness', async () => {
  const fixture = buildFixture('failed-repair');
  const worker = createWorker(fixture);
  await worker.install();
  const cache = await worker.caches.open('qada-static-failed-repair');
  await cache.delete('/data/quran-pages.json');
  worker.network.offline = true;
  assert.equal((await worker.status('QADA_REPAIR_OFFLINE')).ready, false);
  assert.equal((await worker.request('/assets/main-failed-repair.js')).status, 200);
  assert.equal((await worker.request('/data/quran-pages.json')).status, 503);
});

// Client retry behavior is separate from the worker lifecycle: a registration
// resolving does not imply its required-asset installation succeeded.
const offlineClientSource = await readFile(new URL('../src/services/offline.ts', import.meta.url), 'utf8');
const offlineClientJs = ts.transpileModule(offlineClientSource.replaceAll('import.meta.env.PROD', 'true'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

function createOfflineClient({ rejectRegistration = false } = {}) {
  const timeouts = new Map();
  const windowEvents = new Map();
  const documentEvents = new Map();
  const registrations = [];
  let nextTimer = 1;
  let calls = 0;
  const serviceWorker = {
    controller: null,
    addEventListener() {},
    async register() {
      calls++;
      if (rejectRegistration) throw new Error('Registration unavailable');
      const listeners = new Map();
      const worker = {
        state: 'installing',
        addEventListener(type, listener) { listeners.set(type, listener); },
        change(state) { this.state = state; listeners.get('statechange')?.(); },
      };
      const registration = { installing: worker, active: null, waiting: null, addEventListener() {} };
      registrations.push(registration);
      return registration;
    },
  };
  const context = vm.createContext({
    exports: {}, navigator: { onLine: true, serviceWorker }, MessageChannel: class {},
    window: {
      isSecureContext: true,
      addEventListener(type, listener) { windowEvents.set(type, listener); },
      setInterval() {},
      setTimeout(callback, delay) { const id = nextTimer++; timeouts.set(id, { callback, delay }); return id; },
      clearTimeout(id) { timeouts.delete(id); },
    },
    document: {
      visibilityState: 'visible',
      addEventListener(type, listener) { documentEvents.set(type, listener); },
    },
  });
  vm.runInContext(offlineClientJs, context);
  return {
    start() { context.exports.startOfflineSupport(); },
    get calls() { return calls; },
    get delays() { return [...timeouts.values()].map((timer) => timer.delay); },
    failInstall() {
      const registration = registrations.at(-1);
      const worker = registration.installing;
      registration.installing = null;
      worker.change('redundant');
    },
    runRetry() {
      const [id, timer] = [...timeouts.entries()][0];
      timeouts.delete(id);
      timer.callback();
    },
    visible() { documentEvents.get('visibilitychange')?.(); },
    online() { windowEvents.get('online')?.(); },
  };
}
const flushClient = () => new Promise((resolve) => setImmediate(resolve));

test('failed installs have bounded exponential retries; resolved register calls and visibility do not reset them', async () => {
  const client = createOfflineClient();
  client.start();
  await flushClient();
  assert.equal(client.calls, 1);
  for (const delay of [30000, 60000, 120000]) {
    client.failInstall();
    await flushClient();
    assert.deepEqual(client.delays, [delay]);
    const beforeVisibility = client.calls;
    client.visible();
    await flushClient();
    assert.equal(client.calls, beforeVisibility, 'Tab switching must not bypass the retry delay');
    client.runRetry();
    await flushClient();
  }
  client.failInstall();
  await flushClient();
  assert.deepEqual(client.delays, []);
  assert.equal(client.calls, 4, 'Only the initial attempt plus three automatic retries are allowed');
  client.visible();
  await flushClient();
  assert.equal(client.calls, 4, 'An exhausted failure loop must not restart when a tab becomes visible');
  client.online();
  await flushClient();
  assert.equal(client.calls, 5, 'A real online event permits recovery without setup');
  client.failInstall();
  await flushClient();
  assert.deepEqual(client.delays, [30000]);
});

test('registration network failures also stop after three automatic retries', async () => {
  const client = createOfflineClient({ rejectRegistration: true });
  client.start();
  await flushClient();
  for (const delay of [30000, 60000, 120000]) {
    assert.deepEqual(client.delays, [delay]);
    client.runRetry();
    await flushClient();
  }
  assert.deepEqual(client.delays, []);
  assert.equal(client.calls, 4);
});
