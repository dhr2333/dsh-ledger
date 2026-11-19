#!/usr/bin/env node
/**
 * Smoke-test one built runtime on the machine it targets.
 *
 * It creates a throwaway venv from the bundled CPython, installs the offline
 * wheelhouse, imports every runtime dependency, copies the core, and validates
 * the ledger template with the venv's own bean-check.
 *
 *   node scripts/smoke-runtime.mjs
 *   node scripts/smoke-runtime.mjs --target linux-x64
 *
 * Run each target on the matching operating system. Windows on ARM uses the
 * x64 runtime package and is covered by that emulation.
 */

import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runtimePython, venvProgram } from '../src/host/platform.js';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(path.join(packageDir, 'scripts', 'runtimes.json'), 'utf8'));
const args = process.argv.slice(2);
const targetIndex = args.indexOf('--target');
const targetKey = targetIndex === -1 ? `${process.platform}-${process.arch}` : args[targetIndex + 1];
const target = config.targets[targetKey];

/**
 * Print a message and exit non-zero.
 * @param {string} message failure reason.
 * @returns {never} never returns.
 */
function die(message) {
  console.error(`FAIL ${targetKey}: ${message}`);
  process.exit(1);
}

if (target === undefined) die(`未知目标；可选：${Object.keys(config.targets).join(', ')}`);
if (target.os !== process.platform) die(`该产物属于 ${target.os}，请在对应系统上运行`);
if (target.cpu !== process.arch) die(`该产物属于 ${target.cpu}，请在对应架构上运行`);

const packageName = `dsh-ledger-runtime-${targetKey}`;
const candidates = [
  path.join(packageDir, 'dist', 'packages', packageName),
  path.join(packageDir, 'dist', `runtime-${targetKey}`),
];
const runtimeDir = candidates.find((candidate) => existsSync(path.join(candidate, 'manifest.json')));
if (runtimeDir === undefined) die('找不到构建产物；先运行 node scripts/build-runtime.mjs --target ' + targetKey);

/**
 * Run one command and require a zero exit code.
 * @param {string} command executable.
 * @param {string[]} commandArgs arguments.
 * @param {object} [options] spawn options.
 * @returns {string} stdout.
 */
function run(command, commandArgs, options = {}) {
  const outcome = spawnSync(command, commandArgs, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
  if (outcome.error || outcome.status !== 0) {
    const detail = outcome.error?.message ?? `${outcome.stdout ?? ''}${outcome.stderr ?? ''}`.trim();
    die(`${path.basename(command)} ${commandArgs.join(' ')} 失败：${detail}`);
  }
  return outcome.stdout ?? '';
}

const temp = mkdtempSync(path.join(os.tmpdir(), 'dsh-ledger-smoke-'));
try {
  const runtime = runtimePython(path.join(runtimeDir, 'python'));
  const probe = run(runtime, [
    '-c',
    "import struct,sys;print(f\"{sys.version_info.major}.{sys.version_info.minor}|{struct.calcsize('P')*8}\")",
  ]).trim();
  const [version, bits] = probe.split('|');
  const [major, minor] = version.split('.').map(Number);
  if (major < 3 || (major === 3 && minor < 11)) die(`运行时 Python ${version} 低于 3.11`);
  if (Number(bits) !== 64) die(`运行时 Python 不是 64 位（${bits}）`);
  console.log(`runtime python ${version} (${bits}-bit): ${runtime}`);

  const venv = path.join(temp, 'venv');
  run(runtime, ['-m', 'venv', venv]);
  const python = venvProgram(venv, 'python');
  const pip = spawnSync(python, ['-m', 'pip', '--version'], { encoding: 'utf8' });
  if (pip.status !== 0) run(python, ['-m', 'ensurepip', '--upgrade']);
  run(python, [
    '-m',
    'pip',
    'install',
    '--no-index',
    '--find-links',
    path.join(runtimeDir, 'wheelhouse'),
    '--disable-pip-version-check',
    '--no-input',
    'beancount',
    'beanquery',
    'mcp',
  ]);
  console.log('offline wheelhouse installed');

  const sitePackages = run(python, ['-c', 'import site; print(site.getsitepackages()[0])']).trim().split(/\r?\n/).pop() ?? '';
  const coreSource = [
    path.join(packageDir, '..', 'ledger-domain-core', 'ledger_domain'),
    path.join(packageDir, 'vendor', 'core', 'ledger_domain'),
  ].find((candidate) => existsSync(path.join(candidate, '__init__.py')));
  if (coreSource === undefined) die('找不到 ledger_domain 源码');
  cpSync(coreSource, path.join(sitePackages, 'ledger_domain'), { recursive: true });
  const imported = run(python, [
    '-c',
    'import beancount, beanquery, mcp, ledger_domain; print(getattr(beancount, "__version__", "?"))',
  ]).trim();
  console.log(`imports ok (beancount ${imported})`);

  const assets = [
    path.join(packageDir, '..', 'ledger-domain-assets'),
    path.join(packageDir, 'vendor', 'assets'),
  ].find((candidate) => existsSync(path.join(candidate, 'main.bean')));
  if (assets === undefined) die('找不到账本模板');
  const ledger = path.join(temp, 'ledger');
  mkdirSync(ledger, { recursive: true });
  cpSync(assets, ledger, { recursive: true });
  run(venvProgram(venv, 'bean-check'), [path.join(ledger, 'main.bean')]);
  const health = run(python, [
    '-m',
    'ledger_domain',
    '--root',
    ledger,
    '--bean-check',
    venvProgram(venv, 'bean-check'),
    '--bean-query',
    venvProgram(venv, 'bean-query'),
    'health',
  ]);
  const envelope = JSON.parse(health);
  if (envelope.ok !== true) die(`health 返回失败：${health}`);
  console.log(`PASS ${targetKey}: bean-check and health both ok`);
} finally {
  rmSync(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
