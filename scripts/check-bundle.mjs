// Static checks for the display-only bundle. No DOM, no network, no engine.
// Run with: node scripts/check-bundle.mjs

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const readJson = async (relative) => JSON.parse(await readFile(path.join(root, relative), 'utf8'));

const pkg = await readJson('package.json');
assert.equal(pkg.name, '@local/dsh-ledger-domain');
assert.equal(pkg.type, 'module');
assert.equal(pkg.dsh?.bundle?.patch, './cordis.patch.yml');
assert.equal(pkg.dsh?.client?.platform, 'web');

for (const relative of [
  'index.js',
  'client.js',
  'cordis.patch.yml',
  'docs/DETAIL.md',
  'icon.svg',
  'src/options.js',
  'src/host/routes.js',
  'src/host/engine.js',
]) {
  assert.ok(existsSync(path.join(root, relative)), `missing ${relative}`);
}

const patch = await readFile(path.join(root, 'cordis.patch.yml'), 'utf8');
assert.ok(patch.includes("name: '@local/dsh-ledger-domain'"), 'patch must insert this bundle');
for (const source of ['index.js', 'client.js', 'src/host/routes.js', 'src/host/engine.js']) {
  const text = await readFile(path.join(root, source), 'utf8');
  assert.ok(!text.includes('tools.register'), `${source} must not register agent tools`);
}

for (const locale of ['zh', 'en']) {
  const document = await readJson(`locale/${locale}.json`);
  assert.ok(document.meta?.title, `${locale} meta.title missing`);
  assert.ok(document.meta?.description, `${locale} meta.description missing`);
  assert.ok(existsSync(path.join(root, document.meta.detail)), `${locale} detail missing`);
}
const icon = await readFile(path.join(root, 'icon.svg'), 'utf8');
assert.match(icon, /^<svg\b/, 'icon must be SVG');
assert.match(icon, /viewBox=/, 'icon must have a viewBox');

// Load the Client module with a minimal React/ModuleLoader shim, then run its
// registration and dictionary coverage. This catches broken registrations and
// missing locale keys without a browser.
const fakeReact = {
  createElement: () => null,
  useState: (initial) => [initial, () => {}],
  useEffect: () => {},
  useMemo: (factory) => factory(),
  useCallback: (callback) => callback,
  useRef: () => ({ current: null }),
  useSyncExternalStore: (_subscribe, read) => read(),
};
let plugin;
globalThis.window = {
  __ModuleLoader__: {
    load(spec) {
      plugin = spec.factory(() => fakeReact);
    },
  },
};
await import(`${pathToFileURL(path.join(root, 'client.js')).href}?v=${Date.now()}`);
assert.ok(plugin && Array.isArray(plugin.inject), 'client factory must return { inject, apply }');
assert.deepEqual(plugin.inject, ['slots', 'locale']);

const registrations = [];
const dictionaries = {};
plugin.apply({
  slots: {
    inject(_name, callback) {
      callback();
      return () => {};
    },
    register(options) {
      registrations.push({ options });
      return () => {};
    },
  },
  locale: {
    register(_namespace, locale, dictionary) {
      dictionaries[locale] = dictionary;
      return () => {};
    },
    bind() {
      return (key) => key;
    },
    subscribe() {
      return () => {};
    },
    getLocale() {
      return { id: 'zh' };
    },
  },
  effect(callback) {
    return callback();
  },
});
assert.ok(registrations.some(({ options }) => options.name === 'main' && options.key === 'ledger-domain'));
assert.ok(registrations.some(({ options }) => options.name === 'sidebar.panellist' && options.id === 'ledger-domain'));

const source = await readFile(path.join(root, 'client.js'), 'utf8');
const keys = new Set([...source.matchAll(/\bt\(\s*'([A-Za-z0-9_.]+)'\s*\)/g)].map((match) => match[1]));
for (const locale of ['zh', 'en']) {
  const dictionary = dictionaries[locale];
  assert.ok(dictionary, `missing ${locale} dictionary`);
  const missing = [...keys].filter((key) => !(key in dictionary));
  assert.deepEqual(missing, [], `${locale} missing keys: ${missing.join(', ')}`);
}
console.log(`bundle check ok: ${keys.size} locale keys, ${registrations.length} registrations`);
