/**
 * Platform-specific program layouts.
 *
 * A CPython virtualenv keeps its programs in `bin/` on POSIX and in `Scripts/`
 * with an `.exe` suffix on Windows. The managed engine runs on every published
 * platform, so every path it builds must come from this module instead of
 * repeating `bin` and bare names.
 */

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
 * @param {string} root runtime `python/` directory.
 * @param {string} [platform] Node platform name.
 * @returns {string} absolute interpreter path.
 */
export function runtimePython(root, platform = process.platform) {
  return isWindows(platform) ? path.join(root, 'python.exe') : path.join(root, 'bin', 'python3');
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
