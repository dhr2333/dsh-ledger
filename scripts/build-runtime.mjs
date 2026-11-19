#!/usr/bin/env node
/**
 * Build the per-platform engine runtime packages.
 *
 * One package carries a relocatable CPython 3.12 (python-build-standalone) plus
 * an offline wheelhouse for exactly one npm platform. The panel copies that
 * runtime into `$DSH_HOME/ledger-engine` and installs the wheels without
 * network access, so users never install Python themselves.
 *
 *   node scripts/build-runtime.mjs --all
 *   node scripts/build-runtime.mjs --target win32-x64 --pack
 *   node scripts/build-runtime.mjs --all --pack
 *
 * The build host needs `tar` and a Python 3 that can run `pip download`
 * (override with PYTHON=/path/to/python).
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(path.join(packageDir, 'scripts', 'runtimes.json'), 'utf8'));
const pluginPackage = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
const cacheDir = path.join(packageDir, '.cache', 'runtime');
const distDir = path.join(packageDir, 'dist');
const hostPython = process.env.PYTHON ?? 'python3';
const pbaBaseUrl = process.env.PBA_BASE_URL ?? config.pbaBaseUrl;
const args = process.argv.slice(2);
const pack = args.includes('--pack');
const buildAll = args.includes('--all');
const requested = [];
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === '--target' && args[index + 1] !== undefined) requested.push(args[index + 1]);
}

/**
 * Print a message and exit non-zero.
 * @param {string} message failure reason.
 * @returns {never} never returns.
 */
function die(message) {
  console.error(`错误：${message}`);
  process.exit(1);
}

if (!buildAll && requested.length === 0) {
  die('用法：node scripts/build-runtime.mjs [--target <key>]... [--all] [--pack]');
}
for (const key of requested) {
  if (!Object.hasOwn(config.targets, key)) die(`未知目标 ${key}；可选：${Object.keys(config.targets).join(', ')}`);
}
const targets = buildAll ? Object.keys(config.targets) : requested;

/**
 * Hash a file with sha256.
 * @param {string} file path.
 * @returns {string} hex digest.
 */
function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

/**
 * Download one URL to a file, following redirects.
 *
 * curl is used instead of fetch because the runtime archives are large enough
 * to hit undici's body timeout on slow links.
 * @param {string} url source.
 * @param {string} destination target file.
 * @returns {void}
 */
function download(url, destination) {
  console.log(`下载 ${url}`);
  mkdirSync(path.dirname(destination), { recursive: true });
  execFileSync(
    'curl',
    ['-fL', '--retry', '5', '--retry-all-errors', '--retry-delay', '2', '-C', '-', '-o', destination, url],
    { stdio: 'inherit' },
  );
}

/**
 * Ensure the pinned runtime archive exists in the cache and matches its hash.
 * A partial download from an interrupted run is discarded and fetched again.
 * @param {object} target runtime target config.
 * @returns {string} archive path.
 */
function ensureArchive(target) {
  const archive = path.join(cacheDir, target.asset);
  if (existsSync(archive) && sha256(archive) === target.sha256) return archive;
  rmSync(archive, { force: true });
  download(`${pbaBaseUrl}/${config.pbaRelease}/${target.asset}`, archive);
  const actual = sha256(archive);
  if (actual !== target.sha256) {
    rmSync(archive, { force: true });
    throw new Error(`${target.asset} 校验失败：期望 ${target.sha256}，实际 ${actual}`);
  }
  return archive;
}

/**
 * Download the offline wheelhouse for one target.
 * @param {object} target runtime target config.
 * @param {string} wheelhouse destination directory.
 * @returns {void}
 */
function downloadWheels(target, wheelhouse) {
  rmSync(wheelhouse, { recursive: true, force: true });
  mkdirSync(wheelhouse, { recursive: true });
  const platformArgs = target.platforms.flatMap((platform) => ['--platform', platform]);
  execFileSync(
    hostPython,
    [
      '-m',
      'pip',
      'download',
      '--only-binary=:all:',
      '--dest',
      wheelhouse,
      '--python-version',
      config.wheelPython,
      '--implementation',
      'cp',
      '--abi',
      config.abi,
      ...platformArgs,
      ...config.wheels,
      ...(target.extraWheels ?? []),
    ],
    { stdio: 'inherit' },
  );
  const files = readdirSync(wheelhouse);
  if (!files.some((name) => name.startsWith('beancount-') && name.endsWith('.whl'))) {
    throw new Error(`${target.os}-${target.cpu} 缺少 beancount wheel；该平台需要先提供可用的 wheel`);
  }
  // `mcp` requires pywin32 on Windows; pip's cross-platform download cannot
  // see that marker when the build host is Linux, so the wheel is requested
  // explicitly above and this check keeps the regression from shipping again.
  if (target.os === 'win32' && !files.some((name) => name.startsWith('pywin32-') && name.endsWith('.whl'))) {
    throw new Error(`${target.os}-${target.cpu} 缺少 pywin32 wheel；Windows 离线安装会失败`);
  }
}

/**
 * Write the package manifest consumed by the panel.
 * @param {object} target runtime target config.
 * @param {string} key target key.
 * @param {string} dir package directory.
 * @returns {void}
 */
function writeManifest(target, key, dir) {
  const wheels = readdirSync(path.join(dir, 'wheelhouse'))
    .filter((name) => name.endsWith('.whl'))
    .sort()
    .map((name) => ({ file: name, sha256: sha256(path.join(dir, 'wheelhouse', name)) }));
  const manifest = {
    pythonVersion: config.python,
    pba: `${config.pbaRelease}/${target.asset}`,
    target: key,
    platform: target.os,
    arch: target.cpu,
    wheelPython: config.wheelPython,
    abi: config.abi,
    wheels,
    createdAt: new Date().toISOString(),
  };
  writeFileSync(path.join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

/**
 * Write the publishable package descriptor.
 * @param {object} target runtime target config.
 * @param {string} key target key.
 * @param {string} dir package directory.
 * @returns {void}
 */
function writePackageJson(target, key, dir) {
  const name = `@dhr2333/dsh-ledger-runtime-${key}`;
  const document = {
    name,
    version: pluginPackage.version,
    description: `Bundled CPython ${config.python} and offline wheels for dsh-ledger on ${key}`,
    license: pluginPackage.license,
    os: [target.os],
    cpu: [target.cpu],
    files: ['python', 'wheelhouse', 'manifest.json'],
    publishConfig: { access: 'public' },
  };
  writeFileSync(path.join(dir, 'package.json'), `${JSON.stringify(document, null, 2)}\n`, 'utf8');
}

/**
 * Size of a directory in MiB.
 * @param {string} dir directory.
 * @returns {number} size.
 */
function directorySize(dir) {
  let total = 0;
  const walk = (current) => {
    for (const name of readdirSync(current)) {
      const full = path.join(current, name);
      const info = statSync(full);
      if (info.isDirectory()) walk(full);
      else total += info.size;
    }
  };
  walk(dir);
  return total / (1024 * 1024);
}

for (const key of targets) {
  const target = config.targets[key];
  const packageName = `dsh-ledger-runtime-${key}`;
  const dir = pack ? path.join(distDir, 'packages', packageName) : path.join(distDir, `runtime-${key}`);
  console.log(`\n== ${key} (${target.os}/${target.cpu}) ==`);
  if (target.note !== undefined) console.log(`说明：${target.note}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const archive = ensureArchive(target);
  execFileSync('tar', ['-xzf', archive, '-C', dir], { stdio: 'inherit' });
  if (!existsSync(path.join(dir, 'python'))) throw new Error(`${key} 解压后没有 python/ 目录`);
  downloadWheels(target, path.join(dir, 'wheelhouse'));
  writeManifest(target, key, dir);
  if (pack) writePackageJson(target, key, dir);
  console.log(`${key} 完成：${directorySize(dir).toFixed(1)} MiB -> ${dir}`);
}

if (pack) {
  console.log('\n发布顺序：先发布 dist/packages/ 下的运行时包，再发布主包。');
  for (const key of targets) {
    console.log(`  npm publish dist/packages/dsh-ledger-runtime-${key} --access public`);
  }
}
