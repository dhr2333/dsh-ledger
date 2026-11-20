#!/usr/bin/env node
/**
 * Verify the publishable runtime tarballs, not the build directories.
 *
 * `npm publish <dir>` packs the directory with npm's packlist, which does not
 * carry symlinks. python-build-standalone keeps `bin/python3` and `bin/python`
 * as symlinks, so a tarball packed from a working build directory can still
 * lose the interpreter name that the panel looks for (0.3.1 shipped that way).
 *
 * This script packs every built runtime package, extracts the tarball into a
 * temporary directory and checks the payload that users actually download.
 *
 *   node scripts/check-pack.mjs
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runtimePython } from '../src/host/platform.js';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(path.join(packageDir, 'scripts', 'runtimes.json'), 'utf8'));
const packagesDir = path.join(packageDir, 'dist', 'packages');

/**
 * Print a failure and exit non-zero.
 * @param {string} message failure reason.
 * @returns {never} never returns.
 */
function die(message) {
  console.error(`FAIL ${message}`);
  process.exit(1);
}

let verified = 0;
for (const [key, target] of Object.entries(config.targets)) {
  const directory = path.join(packagesDir, `dsh-ledger-runtime-${key}`);
  if (!existsSync(directory)) {
    console.log(`skip ${key}: 未构建`);
    continue;
  }
  const temp = mkdtempSync(path.join(os.tmpdir(), `dsh-ledger-pack-${key}-`));
  try {
    // npm prints the file list to stderr; keep it out of the check log and only
    // surface it when packing actually fails.
    try {
      execFileSync('npm', ['pack', '--pack-destination', temp, directory], { stdio: ['ignore', 'ignore', 'pipe'] });
    } catch (error) {
      die(`${key}: npm pack 失败：${error.stderr?.toString().trim() ?? error.message}`);
    }
    const tarball = readdirSync(temp).find((name) => name.endsWith('.tgz'));
    if (tarball === undefined) die(`${key}: npm pack 没有产出 tarball`);

    const unpacked = path.join(temp, 'unpacked');
    mkdirSync(unpacked, { recursive: true });
    execFileSync('tar', ['-xzf', path.join(temp, tarball), '-C', unpacked], { stdio: 'inherit' });
    const root = path.join(unpacked, 'package');

    const descriptor = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
    if (descriptor.name !== `@dhr2333/dsh-ledger-runtime-${key}`) die(`${key}: 包名是 ${descriptor.name}`);
    if (JSON.stringify(descriptor.os) !== JSON.stringify([target.os])) die(`${key}: os 锁不是 ${target.os}`);
    if (JSON.stringify(descriptor.cpu) !== JSON.stringify([target.cpu])) die(`${key}: cpu 锁不是 ${target.cpu}`);

    for (const relative of ['manifest.json', 'wheelhouse', 'python']) {
      if (!existsSync(path.join(root, relative))) die(`${key}: 产物缺少 ${relative}`);
    }

    const manifest = JSON.parse(readFileSync(path.join(root, 'manifest.json'), 'utf8'));
    const python = runtimePython(path.join(root, 'python'), target.os);
    if (!existsSync(python)) die(`${key}: 产物里没有可用解释器 ${python}`);
    if (!statSync(python).isFile()) die(`${key}: ${python} 不是实体文件`);

    const wheels = readdirSync(path.join(root, 'wheelhouse')).filter((name) => name.endsWith('.whl'));
    const packed = new Set(wheels);
    for (const wheel of manifest.wheels) {
      if (!packed.has(wheel.file)) die(`${key}: 产物缺少 wheel ${wheel.file}`);
    }
    if (wheels.length !== manifest.wheels.length) {
      die(`${key}: wheelhouse 有 ${wheels.length} 个 wheel，manifest 记录 ${manifest.wheels.length} 个`);
    }

    const size = (statSync(path.join(temp, tarball)).size / (1024 * 1024)).toFixed(1);
    console.log(`PASS ${key}: ${size} MiB, 解释器 ${path.relative(root, python)}, ${wheels.length} 个 wheel`);
    verified += 1;
  } finally {
    rmSync(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

if (verified === 0) {
  console.log('没有已构建的运行时包；先运行 node scripts/build-runtime.mjs --all --pack');
} else {
  console.log(`产物校验通过：${verified} 个运行时包`);
}
