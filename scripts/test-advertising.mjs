import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/services/advertising.ts', import.meta.url), 'utf8');
// In-process TypeScript transform: no child process, network, real browser or ad impressions.
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  transformers: { before: [context => root => {
    const visit = node => ts.isMetaProperty(node) && node.keywordToken === ts.SyntaxKind.ImportKeyword
      ? ts.factory.createIdentifier('__testImportMeta')
      : ts.visitEachChild(node, visit, context);
    return ts.visitNode(root, visit);
  }] },
}).outputText;
const enabledEnv = {
  VITE_ADS_ENABLED: 'true',
  VITE_ADSENSE_APPROVED: 'true',
  VITE_PUBLISHER_NAME: 'Offline test publisher',
  VITE_CONTACT_EMAIL: 'test@example.invalid',
  VITE_ADSENSE_CLIENT: 'ca-pub-1234567890123456',
  VITE_ADSENSE_GUIDE_SLOT: '1234567890',
};
const consent = (overrides = {}) => ({
  listenerId: 41, cmpId: 123, cmpStatus: 'loaded', eventStatus: 'tcloaded',
  gdprApplies: true, tcString: 'C' + 'A'.repeat(50),
  purpose: { consents: { 1: true } }, vendor: { consents: { 755: true } },
  ...overrides,
});

function fixture(environment = enabledEnv) {
  const events = new Map();
  const timers = new Map();
  const scripts = [];
  let counter = 0;
  const browser = {
    navigator: { onLine: true },
    location: { pathname: '/guides/offline', search: '', hash: '' },
    addEventListener(name, callback) {
      if (!events.has(name)) events.set(name, new Set());
      events.get(name).add(callback);
    },
    removeEventListener(name, callback) { events.get(name)?.delete(callback); },
    emit(name) { for (const callback of events.get(name) || []) callback(); },
    setInterval(callback) { timers.set(++counter, callback); return counter; },
    setTimeout(callback) { timers.set(++counter, callback); return counter; },
    clearInterval(id) { timers.delete(id); },
    clearTimeout(id) { timers.delete(id); },
  };
  const document = {
    createElement() { return { remove() { this.removed = true; } }; },
    head: { appendChild(script) { scripts.push(script); } },
  };
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports, window: browser, document, __testImportMeta: { env: environment },
  });
  return { api: module.exports, browser, scripts, timers };
}

test('advertising is disabled by default and malformed/partial configuration fails closed', () => {
  const { api } = fixture({});
  assert.equal(api.advertisingConfig.enabled, false);
  for (const bad of [
    {}, { ...enabledEnv, VITE_ADS_ENABLED: true }, { ...enabledEnv, VITE_ADS_ENABLED: 'false' },
    { ...enabledEnv, VITE_ADSENSE_CLIENT: 'ca-pub-123' },
    { ...enabledEnv, VITE_ADSENSE_CLIENT: 'ca-pub-1234567890123456<script>' },
    { ...enabledEnv, VITE_ADSENSE_GUIDE_SLOT: '' },
    { ...enabledEnv, VITE_ADSENSE_GUIDE_SLOT: 'slot-123' },
    { ...enabledEnv, VITE_ADSENSE_APPROVED: 'false' },
    { ...enabledEnv, VITE_PUBLISHER_NAME: '  ' },
    { ...enabledEnv, VITE_CONTACT_EMAIL: '' },
    { ...enabledEnv, VITE_CONTACT_EMAIL: 'not-email' },
  ]) assert.equal(api.readAdvertisingConfig(bad).enabled, false);
  assert.equal(api.readAdvertisingConfig(enabledEnv).enabled, true);
});

test('only exact editorial guide URLs can request ads; app aliases cannot bypass the gate', () => {
  const { api } = fixture();
  for (const pathname of ['/guides/offline', '/guides/backup', '/guides/offline/', '/guides/backup/']) {
    assert.equal(api.isAdvertisingLocation({ pathname, search: '', hash: '' }), true);
    for (const suffix of [
      { search: '?app=true', hash: '' }, { search: '?view=app', hash: '' },
      { search: '?utm_source=x', hash: '' }, { search: '', hash: '#/app' },
      { search: '', hash: '#section' },
    ]) assert.equal(api.isAdvertisingLocation({ pathname, ...suffix }), false);
  }
  for (const pathname of [
    '/', '/app', '/app/', '/app/quran', '/quran', '/privacy', '/privacy/', '/contact', '/guides',
    '/guides/offline//', '/guides//offline/', '/guides/backup//',
    '/guides/offline/index.html', '/guides/offline-extra', '/guides/%6fffline/',
  ]) {
    assert.equal(api.isAdvertisingLocation({ pathname, search: '', hash: '' }), false);
  }
});

test('runtime and public build enforce the same guide-slot length boundaries', () => {
  const { api } = fixture();
  const buildSource = readFileSync(new URL('./prepare-public-site.mjs', import.meta.url), 'utf8');
  // Evaluate the real, side-effect-free validation preamble, not the deployment/build steps.
  const start = buildSource.indexOf('const client =');
  const end = buildSource.indexOf('const rawOrigin =');
  assert.ok(start >= 0 && end > start);
  const validate = env => vm.runInNewContext(buildSource.slice(start, end), { env });
  for (const guideSlot of ['', '12345', '1'.repeat(21), 'slot123456', '123456 ']) {
    const environment = { ...enabledEnv, VITE_ADSENSE_GUIDE_SLOT: guideSlot };
    assert.equal(api.readAdvertisingConfig(environment).enabled, false);
    assert.throws(() => validate(environment), /Ads cannot be enabled/);
  }
  for (const guideSlot of ['123456', '1234567890', '1'.repeat(20)]) {
    const environment = { ...enabledEnv, VITE_ADSENSE_GUIDE_SLOT: guideSlot };
    assert.equal(api.readAdvertisingConfig(environment).enabled, true);
    assert.doesNotThrow(() => validate(environment));
  }
});

test('canonical trailing-slash guides still require consent and stop on refusal or an app alias', () => {
  for (const pathname of ['/guides/offline/', '/guides/backup/']) {
    const { api, browser } = fixture();
    browser.location.pathname = pathname;
    let consentCallback;
    browser.__tcfapi = (command, _version, callback) => {
      if (command === 'addEventListener') consentCallback = callback;
    };
    const eligibility = [];
    const cleanup = api.watchAdvertisingEligibility(value => eligibility.push(value), api.advertisingConfig, browser);
    assert.equal(eligibility.at(-1), false);
    consentCallback(consent(), true);
    assert.equal(eligibility.at(-1), true);
    consentCallback(consent({ purpose: { consents: { 1: false } } }), true);
    assert.equal(eligibility.at(-1), false);
    consentCallback(consent(), true);
    browser.location.hash = '#/app';
    browser.emit('hashchange');
    assert.equal(eligibility.at(-1), false);
    cleanup();
  }
});

test('only a loaded CMP event with explicit Google storage consent passes', () => {
  const { api } = fixture();
  assert.equal(api.hasAdvertisingConsent(consent(), true), true);
  assert.equal(api.hasAdvertisingConsent(consent({ eventStatus: 'useractioncomplete' }), true), true);
  assert.equal(api.hasAdvertisingConsent(consent({ gdprApplies: false }), true), true);
  assert.equal(api.hasAdvertisingConsent(undefined, true), false);
  assert.equal(api.hasAdvertisingConsent(consent(), false), false);
  for (const invalid of [
    { cmpId: 0 }, { cmpId: undefined }, { cmpStatus: 'stub' }, { cmpStatus: 'loading' },
    { cmpStatus: 'error' }, { eventStatus: 'cmpuishown' }, { eventStatus: '' },
    { gdprApplies: undefined }, { tcString: '' }, { tcString: 'invalid-string' },
    { purpose: { consents: {} } }, { vendor: { consents: { 755: false } } },
    { purpose: { consents: { 1: 'true' } } },
  ]) assert.equal(api.hasAdvertisingConsent(consent(invalid), true), false, JSON.stringify(invalid));
  // Outside the EEA is not an implicit consent grant in this conservative implementation.
  assert.equal(api.hasAdvertisingConsent(consent({ gdprApplies: false, vendor: {} }), true), false);
});

test('disabled mode registers no CMP listeners and injects no scripts', async () => {
  const { api, browser, scripts, timers } = fixture({});
  browser.__tcfapi = () => assert.fail('disabled advertising must not call a CMP');
  const values = [];
  const cleanup = api.watchAdvertisingEligibility(value => values.push(value), api.advertisingConfig, browser);
  assert.deepEqual(values, [false]);
  assert.equal(await api.loadAdvertisingScript(() => true), false);
  assert.equal(api.requestAdvertisingSlot(() => true), false);
  assert.equal(scripts.length, 0);
  assert.equal(timers.size, 0);
  cleanup();
});

test('a missing CMP stays ineligible and discovery ends without blocking the app', () => {
  const { api, browser, timers, scripts } = fixture();
  const values = [];
  const cleanup = api.watchAdvertisingEligibility(value => values.push(value), api.advertisingConfig, browser);
  for (const callback of [...timers.values()]) callback();
  assert.ok(values.every(value => value === false));
  assert.equal(scripts.length, 0);
  cleanup();
  assert.equal(timers.size, 0);
});

test('withdrawal, offline, route aliases and consent UI opening stop eligibility', () => {
  const { api, browser } = fixture();
  let callback;
  let removed;
  browser.__tcfapi = (command, version, cb, id) => {
    assert.equal(version, 2);
    if (command === 'addEventListener') callback = cb;
    if (command === 'removeEventListener') removed = id;
  };
  browser.adsbygoogle = { push() {} };
  const values = [];
  const cleanup = api.watchAdvertisingEligibility(value => values.push(value), api.advertisingConfig, browser);
  callback(consent(), true);
  assert.equal(values.at(-1), true);
  browser.navigator.onLine = false;
  browser.emit('offline');
  assert.equal(values.at(-1), false);
  assert.equal(browser.adsbygoogle.pauseAdRequests, 1);
  browser.navigator.onLine = true;
  browser.emit('online');
  assert.equal(values.at(-1), true);
  browser.location.search = '?app=true';
  browser.emit('popstate');
  assert.equal(values.at(-1), false);
  browser.location.search = '';
  browser.emit('popstate');
  browser.emit('qada-ad-preferences-opening');
  assert.equal(values.at(-1), false);
  callback(consent(), true);
  assert.equal(values.at(-1), true);
  callback(consent({ vendor: { consents: { 755: false } } }), true);
  assert.equal(values.at(-1), false);
  cleanup();
  assert.equal(removed, 41);
  const count = values.length;
  callback(consent(), true);
  assert.equal(values.length, count);
});

test('scripts are never injected while offline, ineligible or on a private route', async () => {
  for (const condition of ['offline', 'consent', 'route']) {
    const { api, browser, scripts } = fixture();
    if (condition === 'offline') browser.navigator.onLine = false;
    if (condition === 'route') browser.location.pathname = '/app';
    assert.equal(await api.loadAdvertisingScript(() => condition !== 'consent'), false);
    assert.equal(scripts.length, 0);
  }
});

test('script is loaded once, non-personalized requests stay paused until an eligible request', async () => {
  const { api, browser, scripts } = fixture();
  const promise = api.loadAdvertisingScript(() => true);
  assert.equal(scripts.length, 1);
  assert.match(scripts[0].src, /^https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-\d{16}$/);
  assert.equal(browser.adsbygoogle.requestNonPersonalizedAds, 1);
  assert.equal(browser.adsbygoogle.pauseAdRequests, 1);
  assert.equal(api.loadAdvertisingScript(() => true), promise);
  scripts[0].onload();
  assert.equal(await promise, true);
  assert.equal(api.requestAdvertisingSlot(() => false), false);
  assert.equal(browser.adsbygoogle.length, 0);
  assert.equal(api.requestAdvertisingSlot(() => true), true);
  assert.equal(browser.adsbygoogle.length, 1);
  assert.equal(browser.adsbygoogle.pauseAdRequests, 0);
  browser.location.hash = '#/app';
  assert.equal(api.requestAdvertisingSlot(() => true), false);
  assert.equal(browser.adsbygoogle.length, 1);
});

test('blocked or failed script resolves false, is removed, and does not retry automatically', async () => {
  const { api, scripts } = fixture();
  const promise = api.loadAdvertisingScript(() => true);
  scripts[0].onerror();
  assert.equal(await promise, false);
  assert.equal(scripts[0].removed, true);
  assert.equal(await api.loadAdvertisingScript(() => true), false);
  assert.equal(scripts.length, 1);
});

test('a hanging ad script times out without throwing or preventing app use', async () => {
  const { api, scripts, timers } = fixture();
  const promise = api.loadAdvertisingScript(() => true);
  for (const callback of [...timers.values()]) callback();
  assert.equal(await promise, false);
  assert.equal(scripts[0].removed, true);
  assert.equal(timers.size, 0);
});
