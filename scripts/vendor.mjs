#!/usr/bin/env node
/**
 * Package-time vendoring for the ledger panel.
 *
 * The npm package must be usable on its own: `dsh plugin --profile web add
 * @dhr2333/dsh-ledger` is the entry point most people see, and DSH does not
 * fetch extra repositories for a bundle. So the published tarball carries the
 * Python core (`ledger_domain`) and the ledger template next to the panel.
 *
 * Copies are generated, never committed:
 *
 *   node scripts/vendor.mjs          # build vendor/ (also runs on npm publish)
 *   node scripts/vendor.mjs --check  # verify vendor/ matches the checkouts
 *
 * Sources default to sibling checkouts and can be overridden with
 * `LEDGER_CORE_SRC` / `LEDGER_ASSETS_SRC`. Publishing from a stale checkout is
 * the one failure this script cannot detect, so the generated manifest records
 * the source commit and whether that checkout was dirty.
 */

import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vendorDir = path.join(packageDir, 'vendor');
const coreSource = path.resolve(process.env.LEDGER_CORE_SRC ?? path.join(packageDir, '..', 'ledger-domain-core'));
const assetsSource = path.resolve(process.env.LEDGER_ASSETS_SRC ?? path.join(packageDir, '..', 'ledger-domain-assets'));

/** Entries that belong to a source checkout, not to the shipped runtime. */
const SKIP_ANYWHERE = new Set([
  '.git',
  '.venv',
  'venv',
  '.ledger',
  '__pycache__',
  'node_modules',
  '.DS_Store',
  '.pytest_cache',
  '.mypy_cache',
  '.ruff_cache',
]);

/** Files the panel must find after installation. */
const REQUIRED_CORE = ['ledger_domain/__init__.py', 'ledger_domain/cli.py', 'ledger_domain/core.py'];
const REQUIRED_ASSETS = [
  'main.bean',
  'account/assets.bean',
  'account/liabilities.bean',
  'account/expenses.bean',
  'account/income.bean',
  'account/equity.bean',
  'trans/main.bean',
  'trans/collect.bean',
  'trans/reconciliation.bean',
];

const check = process.argv.includes('--check');

/**
 * Skip source-only entries and compiled Python.
 * @param {string} source absolute source path.
 * @returns {boolean} true when the entry should be copied.
 */
function keep(source) {
  const name = path.basename(source);
  if (SKIP_ANYWHERE.has(name)) return false;
  if (name.endsWith('.pyc') || name.endsWith('.pyo')) return false;
  return true;
}

/**
 * Run a git command in a checkout; undefined when the tool or repository is
 * unavailable.
 * @param {string} cwd checkout directory.
 * @param {string[]} args git arguments.
 * @returns {string | undefined} trimmed stdout.
 */
function git(cwd, args) {
  try {
    return execFileSync('git', ['-C', cwd, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}

/**
 * Describe one source checkout for the manifest.
 * @param {string} dir checkout directory.
 * @param {string[]} paths paths whose dirtiness matters.
 * @returns {{ commit: string | null, dirty: boolean, describe: string | null }} source state.
 */
function sourceState(dir, paths) {
  const commit = git(dir, ['rev-parse', 'HEAD']) ?? null;
  const describe = git(dir, ['describe', '--always', '--dirty', '--tags']) ?? null;
  const status = git(dir, ['status', '--porcelain', '--', ...paths]);
  return { commit, dirty: status !== undefined && status !== '', describe };
}

/**
 * Read the Python project version without importing it.
 * @param {string} dir core checkout.
 * @returns {string | null} version string.
 */
function pythonVersion(dir) {
  try {
    const text = readFileSync(path.join(dir, 'pyproject.toml'), 'utf8');
    return text.match(/^version\s*=\s*"([^"]+)"/m)?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Copy a directory with the shared skip rules.
 * @param {string} from source directory.
 * @param {string} to destination directory.
 * @returns {void}
 */
function copyTree(from, to) {
  cpSync(from, to, { recursive: true, filter: keep });
}

/**
 * Copy one optional file.
 * @param {string} from source file.
 * @param {string} to destination file.
 * @returns {void}
 */
function copyFile(from, to) {
  if (existsSync(from)) cpSync(from, to);
}

/**
 * Build the vendored tree under a staging directory.
 * @param {string} staging empty destination.
 * @returns {void}
 */
function build(staging) {
  if (!existsSync(path.join(coreSource, 'ledger_domain', '__init__.py'))) {
    throw new Error(
      `无法从 ${coreSource} 读取核心库；先检出 ledger-domain-core，或用 LEDGER_CORE_SRC 指定它的位置`,
    );
  }
  if (!existsSync(path.join(assetsSource, 'main.bean'))) {
    throw new Error(
      `无法从 ${assetsSource} 读取账本模板；先检出 ledger-domain-assets，或用 LEDGER_ASSETS_SRC 指定它的位置`,
    );
  }
  mkdirSync(path.join(staging, 'core'), { recursive: true });
  copyTree(path.join(coreSource, 'ledger_domain'), path.join(staging, 'core', 'ledger_domain'));
  copyFile(path.join(coreSource, 'LICENSE'), path.join(staging, 'core', 'LICENSE'));
  copyFile(path.join(coreSource, 'README.md'), path.join(staging, 'core', 'README.md'));
  mkdirSync(path.join(staging, 'assets'), { recursive: true });
  copyTree(assetsSource, path.join(staging, 'assets'));

  const core = sourceState(coreSource, ['ledger_domain', 'pyproject.toml']);
  const assets = sourceState(assetsSource, ['main.bean', 'account', 'trans']);
  const missing = [
    ...REQUIRED_CORE.filter((relative) => !existsSync(path.join(staging, 'core', relative))),
    ...REQUIRED_ASSETS.filter((relative) => !existsSync(path.join(staging, 'assets', relative))),
  ];
  if (missing.length > 0) throw new Error(`vendored tree is incomplete: ${missing.join(', ')}`);

  const manifest = {
    generatedAt: new Date().toISOString(),
    core: {
      version: pythonVersion(coreSource),
      commit: core.commit,
      describe: core.describe,
      dirty: core.dirty,
    },
    assets: {
      commit: assets.commit,
      describe: assets.describe,
      dirty: assets.dirty,
    },
  };
  writeFileSync(path.join(staging, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

/**
 * Hash every path below a directory, for `--check`.
 * @param {string} dir directory.
 * @returns {Map<string, string>} relative path → sha256.
 */
function digest(dir) {
  const out = new Map();
  const walk = (current, prefix) => {
    for (const name of readdirSync(current).sort()) {
      const full = path.join(current, name);
      const relative = prefix === '' ? name : `${prefix}/${name}`;
      if (statSync(full).isDirectory()) walk(full, relative);
      else out.set(relative, createHash('sha256').update(readFileSync(full)).digest('hex'));
    }
  };
  walk(dir, '');
  return out;
}

try {
  if (check) {
    if (!existsSync(vendorDir)) {
      console.error('vendor/ 不存在；先运行 node scripts/vendor.mjs');
      process.exit(1);
    }
    const staging = mkdtempSync(path.join(os.tmpdir(), 'dsh-ledger-vendor-'));
    try {
      build(staging);
      const expected = digest(staging);
      const actual = digest(vendorDir);
      const sameManifest = (() => {
        const read = (dir) => {
          const manifest = JSON.parse(readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
          delete manifest.generatedAt;
          return JSON.stringify(manifest);
        };
        return read(staging) === read(vendorDir);
      })();
      expected.delete('manifest.json');
      actual.delete('manifest.json');
      const differences = [
        ...[...expected.keys()].filter((key) => !actual.has(key)).map((key) => `missing: ${key}`),
        ...[...actual.keys()].filter((key) => !expected.has(key)).map((key) => `extra: ${key}`),
        ...[...expected.keys()]
          .filter((key) => actual.has(key) && actual.get(key) !== expected.get(key))
          .map((key) => `changed: ${key}`),
        ...(sameManifest ? [] : ['changed: manifest.json']),
      ];
      if (differences.length > 0) {
        console.error(`vendor/ 与源码不一致（${differences.length} 处），重新运行 node scripts/vendor.mjs：`);
        for (const line of differences.slice(0, 20)) console.error(`  ${line}`);
        process.exit(1);
      }
      console.log('vendor/ 与源码一致');
    } finally {
      rmSync(staging, { recursive: true, force: true });
    }
  } else {
    const staging = mkdtempSync(path.join(os.tmpdir(), 'dsh-ledger-vendor-'));
    try {
      build(staging);
      rmSync(vendorDir, { recursive: true, force: true });
      cpSync(staging, vendorDir, { recursive: true });
    } finally {
      rmSync(staging, { recursive: true, force: true });
    }
    const manifest = JSON.parse(readFileSync(path.join(vendorDir, 'manifest.json'), 'utf8'));
    const core = manifest.core;
    const assets = manifest.assets;
    const dirty = [core.dirty ? 'core' : null, assets.dirty ? 'assets' : null].filter(Boolean);
    if (dirty.length > 0) {
      console.warn(`警告：${dirty.join('、')} 工作区有未提交改动，发布包会包含它们`);
    }
    console.log(
      `vendor/ 已生成：core ${core.version ?? '?'} @ ${core.commit ?? 'nogit'}，assets @ ${assets.commit ?? 'nogit'}`,
    );
  }
} catch (error) {
  console.error(`错误：${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
