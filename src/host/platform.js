/**
 * Platform-specific program layouts.
 *
 * A CPython virtualenv keeps its programs in `bin/` on POSIX and in `Scripts/`
 * with an `.exe` suffix on Windows. The managed engine runs on every published
 * platform, so every path it builds must come from this module instead of
 * repeating `bin` and bare names.
 */

import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Whether a platform uses the Windows layout.
 * @param {string} [platform] Node platform name.
 * @returns {boolean} true for win32.
 */
export function isWindows(platform = process.platform) {
  return platform === 'win32';
}

/**
 * The program directory inside a virtualenv.
 * @param {string} venv virtualenv root.
 * @param {string} [platform] Node platform name.
 * @returns {string} `bin` or `Scripts` directory.
 */
export function venvBinDir(venv, platform = process.platform) {
  return path.join(venv, isWindows(platform) ? 'Scripts' : 'bin');
}

/**
 * One executable inside a virtualenv, with the platform suffix.
 * @param {string} venv virtualenv root.
 * @param {string} name program name without suffix (`python`, `bean-check`).
 * @param {string} [platform] Node platform name.
 * @returns {string} absolute program path.
 */
export function venvProgram(venv, name, platform = process.platform) {
  return path.join(venvBinDir(venv, platform), isWindows(platform) ? `${name}.exe` : name);
}

/**
 * The interpreter inside an unpacked python-build-standalone runtime.
 *
 * python-build-standalone ships `bin/python3` and `bin/python` as symlinks to
 * the versioned binary, and npm does not put symlinks in a tarball: an
 * installed runtime package only keeps the versioned real file. The versioned
 * fallback keeps that artifact runnable; a developer build, where the links
 * are still present, keeps using `bin/python3`.
 * @param {string} root runtime `python/` directory.
 * @param {string} [platform] Node platform name.
 * @returns {string} absolute interpreter path.
 */
export function runtimePython(root, platform = process.platform) {
  if (isWindows(platform)) return path.join(root, 'python.exe');
  const bin = path.join(root, 'bin');
  const direct = ['python3', 'python']
    .map((name) => path.join(bin, name))
    .find((candidate) => existsSync(candidate));
  if (direct !== undefined) return direct;
  try {
    const versioned = readdirSync(bin)
      .filter((name) => /^python3\.\d+$/.test(name))
      .sort((left, right) => Number(right.split('.')[1]) - Number(left.split('.')[1]));
    if (versioned.length > 0) return path.join(bin, versioned[0]);
  } catch {
    // No bin/ at all: the conventional path lets the caller report it missing.
  }
  return path.join(bin, 'python3');
}

/**
 * The npm package that carries the runtime for one platform and architecture.
 * @param {string} [platform] Node platform name.
 * @param {string} [arch] Node architecture name.
 * @returns {string} package name.
 */
export function runtimePackageName(platform = process.platform, arch = process.arch) {
  return `@dhr2333/dsh-ledger-runtime-${platform}-${arch}`;
}
