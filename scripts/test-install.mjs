import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('Android installation has branded, valid icons and a stable standalone app identity', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(manifest.id, '/app'); assert.equal(manifest.start_url, '/app');
  assert.equal(manifest.display, 'standalone'); assert.equal(manifest.name, 'قضاء');
  assert.equal(manifest.prefer_related_applications, false);
  for (const icon of manifest.icons) {
    const data = readFileSync(new URL('../public' + icon.src, import.meta.url));
    assert.equal(data.subarray(1, 4).toString(), 'PNG');
    const width = data.readUInt32BE(16), height = data.readUInt32BE(20);
    assert.equal(`${width}x${height}`, icon.sizes);
    assert.ok(width >= 192);
  }
  assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable'));
  assert.deepEqual(readFileSync(new URL('../public/icons/qada-192-v2.png', import.meta.url)), readFileSync(new URL('../public/icons/icon-192.png', import.meta.url)));
  const favicon = readFileSync(new URL('../public/favicon.ico', import.meta.url));
  assert.equal(favicon.readUInt16LE(2), 1); assert.equal(favicon.readUInt16LE(4), 1);
  assert.equal(favicon[6], 48); assert.equal(favicon.readUInt32LE(18), 22);
  for (const path of ['../public/icon.svg', '../public/images/qada-wordmark.svg']) {
    const svg = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.match(svg, /<path d="[Mm]/);
    assert.ok(!svg.includes('System.Windows'), 'SVG must contain real outlined Arabic geometry');
  }
});

function fixture(file, dependencies = {}) {
  const states = [], effects = [], events = new Map();
  let cursor = 0, mounted = false;
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    createContext: value => ({ Provider: 'Provider', value }),
    useContext: context => context.value,
    useState: initial => {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], value => { states[index] = value; }];
    },
    useEffect: callback => { if (!mounted) effects.push(callback); },
    useCallback: callback => callback,
  };
  const window = {
    navigator: {}, matchMedia: () => ({ matches: false }),
    addEventListener(name, callback) {
      if (!events.has(name)) events.set(name, new Set());
      events.get(name).add(callback);
    },
    removeEventListener(name, callback) { events.get(name)?.delete(callback); },
  };
  // Use the real early HTML listener, not a synthetic application-only substitute.
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const bootstrap = html.match(/<script>([\s\S]*?__qadaInstallPrompt[\s\S]*?)<\/script>/)?.[1];
  assert.ok(bootstrap);
  vm.runInNewContext(bootstrap, { window });
  const module = { exports: {} };
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  } }).outputText;
  vm.runInNewContext(compiled, { module, exports: module.exports, window,
    require: name => name === 'react' ? react : dependencies[name] ?? {},
  });
  return {
    render(name) { cursor = 0; const tree = module.exports[name]({});
      while (effects.length) effects.shift()(); mounted = true; return tree; },
    emit(name, event) { for (const callback of events.get(name) ?? []) callback(event); },
  };
}

test('installation entry stays visible without a native prompt and opens help', async () => {
  const f = fixture('../src/components/InstallButton.tsx', {
    '../context/PwaInstallContext': { usePwaInstall: () => ({ canInstall: false, promptInstall: async () => 'unavailable' }) },
  });
  const tree = f.render('InstallButton');
  assert.equal(tree.props.children[0].props['aria-label'], 'تثبيت التطبيق');
  await tree.props.children[0].props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.render('InstallButton').props.children[1].props.isOpen, true);
});

test('installation entry is hidden in an installed standalone app', () => {
  const f = fixture('../src/components/InstallButton.tsx', {
    '../context/PwaInstallContext': { usePwaInstall: () => ({ isStandalone: true }) },
  });
  assert.equal(f.render('InstallButton'), null);
});

for (const outcome of ['accepted', 'dismissed', 'failure']) {
  test(`native prompt ${outcome}: single-use and installation confirmed only by appinstalled`, async () => {
    const f = fixture('../src/context/PwaInstallContext.tsx');
    f.render('PwaInstallProvider');
    let calls = 0;
    f.emit('beforeinstallprompt', { preventDefault() {},
      async prompt() { calls++; if (outcome === 'failure') throw Error('not available'); },
      userChoice: Promise.resolve({ outcome }),
    });
    const value = f.render('PwaInstallProvider').props.value;
    assert.equal(value.canInstall, true);
    assert.equal(await value.promptInstall(), outcome === 'failure' ? 'unavailable' : outcome);
    assert.equal(await value.promptInstall(), 'unavailable');
    assert.equal(calls, 1);
    const after = f.render('PwaInstallProvider').props.value;
    assert.equal(after.canInstall, false);
    assert.equal(after.isInstalled, false);
    f.emit('appinstalled');
    assert.equal(f.render('PwaInstallProvider').props.value.isInstalled, true);
  });
}

test('landing hero and app header expose the shared installation entry', () => {
  for (const file of ['Header.tsx', 'landing/HeroSection.tsx']) {
    const source = readFileSync(new URL(`../src/components/${file}`, import.meta.url), 'utf8');
    assert.match(source, /<InstallButton\s/);
    assert.doesNotMatch(source, /canInstall\s*&&/);
  }
});

test('an invitation before React mounts is retained for the installation click', async () => {
  const f = fixture('../src/context/PwaInstallContext.tsx');
  let calls = 0;
  f.emit('beforeinstallprompt', { preventDefault() {},
    async prompt() { calls++; return { outcome: 'accepted' }; },
  });
  const value = f.render('PwaInstallProvider').props.value;
  assert.equal(value.canInstall, true);
  assert.equal(await value.promptInstall(), 'accepted');
  assert.equal(calls, 1);
});

test('a click sees a late invitation even before the React rerender', async () => {
  const f = fixture('../src/context/PwaInstallContext.tsx');
  const oldRender = f.render('PwaInstallProvider').props.value;
  assert.equal(oldRender.canInstall, false);
  let calls = 0;
  f.emit('beforeinstallprompt', { preventDefault() {},
    async prompt() { calls++; return { outcome: 'accepted' }; },
  });
  assert.equal(await oldRender.promptInstall(), 'accepted');
  assert.equal(calls, 1);
});
