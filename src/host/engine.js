/**
 * Managed ledger engine.
 *
 * The panel must not ask an ordinary user to install Python, Beancount or the
 * core library by hand. This module owns one private virtualenv under the DSH
 * home, provisions Beancount into it, copies the local core package into its
 * site-packages, and reports readiness. It also keeps the existing external
 * engine (a configured ledger venv) working for developer setups.
 */

import { spawn } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

import { isWindows, runtimePython, runtimePackageName, venvProgram } from './platform.js';

const OUTPUT_LIMIT = 4 * 1024 * 1024;
const LOG_LIMIT = 200_000;
/** Retry removal on Windows, where a running executable keeps its file locked. */
const RM_OPTIONS = { recursive: true, force: true, maxRetries: 5, retryDelay: 200 };
/** Print `major.minor|bits` so the probe can reject old or 32-bit interpreters. */
const PYTHON_PROBE = "import struct,sys;print(f\"{sys.version_info.major}.{sys.version_info.minor}|{struct.calcsize('P')*8}\")";
/** The core is an independent PyPI distribution; the engine only installs it. */
const CORE_PACKAGE = 'ledger-domain';
/** The CLI/MCP contract window this panel understands. */
const CORE_PROTOCOL_MIN = 1;
const CORE_PROTOCOL_MAX = 1;
/** Read the installed core version and contract version in one probe. */
const CORE_PROBE =
  "import json,ledger_domain;print(json.dumps({'version':ledger_domain.__version__,'protocol':ledger_domain.PROTOCOL}))";
const require = createRequire(import.meta.url);

/**
 * Paths owned by one managed engine.
 * @param {object} options bridge options.
 * @returns {{dir:string, venv:string, runtime:string, python:string, beanCheck:string, beanQuery:string, marker:string, log:string, coreCheck:string}} engine paths.
 */
export function enginePaths(options) {
  const dir = path.resolve(options.engineDir);
  const venv = path.join(dir, 'venv');
  return {
    dir,
    venv,
    runtime: path.join(dir, 'python'),
    python: venvProgram(venv, 'python'),
    beanCheck: venvProgram(venv, 'bean-check'),
    beanQuery: venvProgram(venv, 'bean-query'),
    marker: path.join(dir, 'engine.json'),
    log: path.join(dir, 'install.log'),
    coreCheck: path.join(dir, 'core-check.json'),
  };
}

/**
 * Describe one unpacked runtime package.
 * @param {string | undefined} dir candidate runtime package directory.
 * @returns {{ dir:string, pythonRoot:string, python:string, wheelhouse:string, manifest:object, packageName:string } | null} runtime or null.
 */
function readRuntime(dir) {
  if (typeof dir !== 'string' || dir.trim() === '') return null;
  const root = path.resolve(dir);
  const pythonRoot = path.join(root, 'python');
  const wheelhouse = path.join(root, 'wheelhouse');
  const manifestPath = path.join(root, 'manifest.json');
  if (!existsSync(runtimePython(pythonRoot)) || !existsSync(wheelhouse) || !existsSync(manifestPath)) return null;
  try {
    return {
      dir: root,
      pythonRoot,
      python: runtimePython(pythonRoot),
      wheelhouse,
      manifest: JSON.parse(readFileSync(manifestPath, 'utf8')),
      packageName: runtimePackageName(process.platform, process.arch),
    };
  } catch {
    return null;
  }
}

/**
 * Find a runtime shipped next to the plugin.
 *
 * The platform package is an optional dependency, so npm installs exactly one
 * of them. A configured directory and the environment override remain for
 * development and for installs that cannot resolve the optional package.
 * @param {object} options bridge options.
 * @returns {{ dir:string, pythonRoot:string, python:string, wheelhouse:string, manifest:object, packageName:string } | null} runtime or null.
 */
export function findBundledRuntime(options) {
  const candidates = [];
  try {
    candidates.push(path.dirname(require.resolve(`${runtimePackageName(process.platform, process.arch)}/package.json`)));
  } catch {
    // Unsupported platform or an install without optional dependencies.
  }
  candidates.push(options.runtimePath, process.env.DSH_LEDGER_RUNTIME);
  for (const candidate of candidates) {
    const found = readRuntime(candidate);
    if (found !== null) return found;
  }
  return null;
}

/**
 * Interpreters to probe when no bundled runtime exists.
 * @param {string | undefined} configured explicit `systemPython` value.
 * @returns {{ command:string, args:string[], label:string }[]} candidates.
 */
function systemPythonCandidates(configured) {
  const value = typeof configured === 'string' ? configured.trim() : '';
  if (value !== '') return [{ command: value, args: [], label: value }];
  if (isWindows()) {
    return [
      { command: 'py', args: ['-3'], label: 'py -3' },
      { command: 'python', args: [], label: 'python' },
      { command: 'python3', args: [], label: 'python3' },
    ];
  }
  return ['python3.13', 'python3.12', 'python3.11', 'python3', 'python'].map((command) => ({
    command,
    args: [],
    label: command,
  }));
}

/**
 * Resolve a Python >= 3.11 (64-bit on Windows) for the fallback path.
 * @param {string | undefined} configured explicit `systemPython` value.
 * @returns {Promise<{ resolved: { command:string, args:string[], label:string, version:string } | null, tried: string[] }>} outcome.
 */
async function resolveSystemPython(configured) {
  const tried = [];
  for (const candidate of systemPythonCandidates(configured)) {
    tried.push(candidate.label);
    const outcome = await runCommand(candidate.command, [...candidate.args, '-c', PYTHON_PROBE], { timeoutMs: 20_000 });
    if (outcome.spawnError || outcome.code !== 0) continue;
    const [version, bits] = outcome.stdout.trim().split('|');
    const matched = /^(\d+)\.(\d+)$/.exec(version ?? '');
    if (matched === null) continue;
    const major = Number(matched[1]);
    const minor = Number(matched[2]);
    if (major < 3 || (major === 3 && minor < 11)) continue;
    if (isWindows() && Number(bits) !== 64) continue;
    return { resolved: { ...candidate, version }, tried };
  }
  return { resolved: null, tried };
}

/**
 * Copy the bundled runtime into the engine directory when it is not current.
 *
 * The copy makes the engine independent of the package directory, which pnpm
 * and plugin upgrades are free to move or delete.
 * @param {ReturnType<typeof enginePaths>} paths engine paths.
 * @param {ReturnType<typeof findBundledRuntime>} bundled runtime package.
 * @param {string[]} logs installation log lines.
 * @returns {void}
 */
function syncRuntime(paths, bundled, logs) {
  const marker = readMarker(paths);
  const reusable = existsSync(runtimePython(paths.runtime))
    && marker?.pythonSource === 'bundled'
    && marker?.runtime?.package === bundled.packageName
    && marker?.runtime?.version === bundled.manifest.pythonVersion;
  if (reusable) {
    logs.push(`$ runtime\nreuse ${paths.runtime}`);
    return;
  }
  rmSync(paths.runtime, RM_OPTIONS);
  cpSync(bundled.pythonRoot, paths.runtime, { recursive: true, dereference: true });
  logs.push(`$ runtime\n${bundled.dir} -> ${paths.runtime}`);
}

/**
 * Run one command with a timeout and bounded output.
 * @param {string} command executable or PATH command.
 * @param {string[]} args arguments.
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv, timeoutMs?: number }} [options] run options.
 * @returns {Promise<{ code: number | null, stdout: string, stderr: string, timedOut: boolean, spawnError: NodeJS.ErrnoException | null }>} outcome.
 */
export function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(command, args, {
        cwd: options.cwd,
        env: options.env ?? process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });
    } catch (error) {
      resolve({ code: null, stdout: '', stderr: '', timedOut: false, spawnError: /** @type {NodeJS.ErrnoException} */ (error) });
      return;
    }
    let stdout = '';
    let stderr = '';
    let settled = false;
    let timedOut = false;
    const finish = (code, spawnError) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut, spawnError });
    };
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill('SIGKILL');
      } catch {
        // The child may have exited between the check and the kill.
      }
    }, options.timeoutMs ?? 60_000);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      if (stdout.length < OUTPUT_LIMIT) stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      if (stderr.length < OUTPUT_LIMIT) stderr += chunk;
    });
    child.on('error', (error) => finish(null, /** @type {NodeJS.ErrnoException} */ (error)));
    child.on('close', (code) => finish(code, null));
  });
}

/**
 * Read the managed engine marker.
 * @param {{ marker: string }} paths engine paths.
 * @returns {object | null} marker or null.
 */
function readMarker(paths) {
  try {
    return JSON.parse(readFileSync(paths.marker, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Compare two dotted versions numerically.
 * @param {string} left version.
 * @param {string} right version.
 * @returns {number} negative when left is older, positive when newer, 0 when equal.
 */
function compareVersions(left, right) {
  const parse = (value) => String(value).split(/[.+-]/).map((part) => Number.parseInt(part, 10) || 0);
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

/**
 * Parse the version/protocol probe of the installed core.
 * @param {string} stdout probe output.
 * @returns {{ version: string, protocol: number } | null} core contract or null.
 */
function parseCoreProbe(stdout) {
  try {
    const document = JSON.parse(stdout.trim().split(/\r?\n/).pop() ?? '');
    if (typeof document?.version !== 'string' || !Number.isInteger(document?.protocol)) return null;
    return { version: document.version, protocol: document.protocol };
  } catch {
    return null;
  }
}

/**
 * Read the core version and contract version from one interpreter.
 * @param {ReturnType<typeof enginePaths>} paths engine paths.
 * @returns {Promise<{ version: string, protocol: number } | null>} core contract or null.
 */
async function probeCore(paths) {
  const outcome = await runCommand(paths.python, ['-c', CORE_PROBE], { timeoutMs: 30_000 });
  if (outcome.spawnError || outcome.code !== 0) return null;
  return parseCoreProbe(outcome.stdout);
}

/**
 * Whether a core protocol is inside the window this panel understands.
 * @param {number | null | undefined} protocol contract version.
 * @returns {boolean} true when compatible.
 */
function withinProtocol(protocol) {
  return Number.isInteger(protocol) && protocol >= CORE_PROTOCOL_MIN && protocol <= CORE_PROTOCOL_MAX;
}

/**
 * Probe the managed venv: imports, executables and the core contract.
 * @param {object} options bridge options.
 * @param {ReturnType<typeof enginePaths>} paths engine paths.
 * @param {ReturnType<typeof findBundledRuntime>} bundled runtime available to this install.
 * @returns {Promise<{ installed:boolean, ready:boolean, stale:boolean, marker:object|null, issues:string[], core:{version:string,protocol:number}|null }>} probe.
 */
async function probeManaged(options, paths, bundled) {
  const marker = readMarker(paths);
  const installed = existsSync(paths.python) && existsSync(paths.beanCheck) && existsSync(paths.beanQuery);
  if (marker === null || !installed) {
    return {
      installed: existsSync(paths.venv),
      ready: false,
      stale: false,
      marker,
      issues: marker === null ? ['engine_not_installed'] : ['engine_incomplete'],
      core: null,
    };
  }
  const [imported, beanCheck, beanQuery, core] = await Promise.all([
    runCommand(paths.python, ['-c', 'import beancount, beanquery, mcp, ledger_domain; print(getattr(beancount, "__version__", "?"))'], { timeoutMs: 30_000 }),
    runCommand(paths.beanCheck, ['--version'], { timeoutMs: 30_000 }),
    runCommand(paths.beanQuery, ['--version'], { timeoutMs: 30_000 }),
    probeCore(paths),
  ]);
  const issues = [];
  if (imported.code !== 0) issues.push('engine_import_failed');
  if (beanCheck.code !== 0) issues.push('engine_bean_check_failed');
  if (beanQuery.code !== 0) issues.push('engine_bean_query_failed');
  if (core === null) issues.push('engine_core_probe_failed');
  else if (!withinProtocol(core.protocol)) issues.push('engine_core_protocol_mismatch');
  // A marker without a core version predates the decoupled core; the next
  // install/repair re-provisions the venv once. A core older than the bundled
  // baseline means the venv was tampered with or downgraded.
  const baseline = bundled?.manifest?.core?.version ?? null;
  const legacy = marker.coreVersion === undefined;
  const outdated = baseline !== null && core !== null && compareVersions(core.version, baseline) < 0;
  // Once a platform package is available, an engine built from system Python
  // (or from an older runtime) should offer a repair to the bundled runtime.
  const runtimeChanged = Boolean(
    bundled
      && (marker.pythonSource !== 'bundled'
        || marker.runtime?.package !== bundled.packageName
        || marker.runtime?.version !== bundled.manifest.pythonVersion),
  );
  const stale = legacy || outdated || runtimeChanged;
  if (stale) issues.push('engine_core_changed');
  return {
    installed: true,
    ready: issues.length === 0,
    stale,
    marker,
    issues,
    core,
  };
}

/**
 * Probe a developer-supplied external engine.
 * @param {object} options bridge options.
 * @returns {Promise<{ configured:boolean, ready:boolean, issues:string[] }>} probe.
 */
async function probeExternal(options) {
  if (!options.pythonPath) return { configured: false, ready: false, issues: [] };
  const beanCheck = externalProgram(options.root, options.beanCheck, options.pythonPath, 'bean-check');
  const beanQuery = externalProgram(options.root, options.beanQuery, options.pythonPath, 'bean-query');
  const [check, query] = await Promise.all([
    runCommand(beanCheck, ['--version'], { timeoutMs: 20_000 }),
    runCommand(beanQuery, ['--version'], { timeoutMs: 20_000 }),
  ]);
  const issues = [];
  if (check.spawnError || check.code !== 0) issues.push('engine_bean_check_failed');
  if (query.spawnError || query.code !== 0) issues.push('engine_bean_query_failed');
  if (issues.length > 0) return { configured: true, ready: false, issues };
  const env = { ...process.env, PYTHONIOENCODING: 'utf-8' };
  // An external venv may have the core installed from PyPI; a source checkout
  // is layered on top only when one is configured.
  if (options.corePath) {
    env.PYTHONPATH = options.corePath + (env.PYTHONPATH ? `${path.delimiter}${env.PYTHONPATH}` : '');
  }
  const outcome = await runCommand(
    options.pythonPath,
    ['-m', options.pythonModule, '--root', options.root, 'health'],
    {
      cwd: existsSync(options.root) ? options.root : options.corePath || options.root,
      env,
      timeoutMs: 20_000,
    },
  );
  if (outcome.spawnError || outcome.code !== 0) {
    return { configured: true, ready: false, issues: ['engine_external_unavailable'] };
  }
  try {
    const envelope = JSON.parse(outcome.stdout);
    return { configured: true, ready: envelope.ok === true, issues: envelope.ok === true ? [] : ['engine_external_unavailable'] };
  } catch {
    return { configured: true, ready: false, issues: ['engine_external_unavailable'] };
  }
}

/**
 * Resolve an external bean-check/bean-query the same way the core does.
 * @param {string} root ledger root.
 * @param {string} configured configured value, if any.
 * @param {string} pythonPath external interpreter.
 * @param {string} name executable name.
 * @returns {string} resolved command.
 */
function externalProgram(root, configured, pythonPath, name) {
  if (configured) {
    if (path.isAbsolute(configured)) return configured;
    if (configured.includes('/') || configured.includes('\\')) return path.join(root, configured);
    return configured;
  }
  const local = venvProgram(path.join(root, '.venv'), name);
  if (existsSync(local)) return local;
  const sibling = path.join(path.dirname(pythonPath), isWindows() ? `${name}.exe` : name);
  return existsSync(sibling) ? sibling : name;
}

/**
 * How long one PyPI answer is reused before checking again.
 * @type {number}
 */
const CORE_CHECK_TTL = 12 * 60 * 60 * 1000;

/**
 * JSON API base for the core distribution.
 *
 * A mirror can be configured when the public index is slow or unreachable;
 * the value is the base that `/<package>/json` is appended to.
 * @param {object} options bridge options.
 * @returns {string} index base without a trailing slash.
 */
function pypiBase(options) {
  const configured = typeof options.pypiIndex === 'string' ? options.pypiIndex.trim() : '';
  return (configured === '' ? 'https://pypi.org/pypi' : configured).replace(/\/+$/, '');
}

/**
 * Read the cached PyPI answer.
 * @param {ReturnType<typeof enginePaths>} paths engine paths.
 * @returns {{ checkedAt: string, version: string } | null} cache or null.
 */
function readCoreCheck(paths) {
  try {
    const record = JSON.parse(readFileSync(paths.coreCheck, 'utf8'));
    if (typeof record?.version !== 'string' || typeof record?.checkedAt !== 'string') return null;
    return { checkedAt: record.checkedAt, version: record.version };
  } catch {
    return null;
  }
}

/**
 * Ask the index for the newest core release, reusing a recent answer.
 *
 * The check is advisory: offline, a slow mirror or a malformed answer all fall
 * back to the cached value (or nothing) and never block the panel.
 * @param {object} options bridge options.
 * @param {ReturnType<typeof enginePaths>} paths engine paths.
 * @returns {Promise<{ checkedAt: string, version: string } | null>} latest release or null.
 */
async function latestCoreVersion(options, paths) {
  const cached = readCoreCheck(paths);
  const age = cached === null ? Number.POSITIVE_INFINITY : Date.now() - Date.parse(cached.checkedAt);
  if (cached !== null && Number.isFinite(age) && age >= 0 && age < CORE_CHECK_TTL) return cached;
  try {
    const response = await fetch(`${pypiBase(options)}/${CORE_PACKAGE}/json`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const document = await response.json();
    const version = document?.info?.version;
    if (typeof version !== 'string' || version === '') throw new Error('the index answer has no version');
    const record = { checkedAt: new Date().toISOString(), version };
    try {
      mkdirSync(paths.dir, { recursive: true });
      writeFileSync(paths.coreCheck, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
    } catch {
      // An unwritable engine directory only costs another check next time.
    }
    return record;
  } catch {
    return cached;
  }
}

/**
 * Report which engine the bridge would use.
 * @param {object} options bridge options.
 * @returns {Promise<object>} engine status.
 */
export async function engineStatus(options) {
  const paths = enginePaths(options);
  const bundled = findBundledRuntime(options);
  const [managed, external] = await Promise.all([probeManaged(options, paths, bundled), probeExternal(options)]);
  const update = managed.installed ? await latestCoreVersion(options, paths) : null;
  let kind = 'missing';
  let ready = false;
  if (managed.ready && !managed.stale) {
    kind = 'managed';
    ready = true;
  } else if (external.ready) {
    kind = 'external';
    ready = true;
  } else if (managed.stale) {
    kind = 'stale';
  } else if (managed.installed) {
    kind = 'broken';
  }
  const coreVersion = managed.core?.version ?? null;
  return {
    ready,
    kind,
    engineDir: paths.dir,
    installed: managed.installed,
    pythonPath: kind === 'managed' || kind === 'stale' || kind === 'broken' ? paths.python : options.pythonPath,
    beanCheck: kind === 'managed' || kind === 'stale' || kind === 'broken' ? paths.beanCheck : options.beanCheck,
    beanQuery: kind === 'managed' || kind === 'stale' || kind === 'broken' ? paths.beanQuery : options.beanQuery,
    corePath: options.corePath,
    systemPython: options.systemPython,
    runtime: {
      available: bundled !== null,
      package: bundled?.packageName ?? runtimePackageName(process.platform, process.arch),
      pythonVersion: bundled?.manifest.pythonVersion ?? null,
      pythonSource: managed.marker?.pythonSource ?? null,
    },
    // The core has its own release line: the panel reports what is installed,
    // what the bundle pins, and what the index offers, without owning either.
    core: {
      version: coreVersion,
      protocol: managed.core?.protocol ?? null,
      source: managed.marker?.coreSource ?? null,
      baseline: bundled?.manifest?.core?.version ?? null,
      latest: update?.version ?? null,
      checkedAt: update?.checkedAt ?? null,
      updateAvailable: Boolean(update !== null && coreVersion !== null && compareVersions(update.version, coreVersion) > 0),
      compatible: managed.core === null ? true : withinProtocol(managed.core.protocol),
    },
    managed,
    external,
    issues: [...new Set([...(managed.issues ?? []), ...(external.issues ?? [])])],
  };
}

/**
 * Resolve the interpreter and PYTHONPATH for a core call.
 *
 * The managed venv owns its core through pip, so its marker only has to prove
 * that the venv exists; a marker without a core version is still usable and is
 * repaired on the next install.
 * @param {object} options bridge options.
 * @returns {{ kind:string, pythonPath:string, envCorePath:string } | null} runtime or null when no engine exists.
 */
export function runtimeFor(options) {
  const paths = enginePaths(options);
  if (existsSync(paths.marker) && existsSync(paths.python) && existsSync(paths.beanCheck)) {
    return { kind: 'managed', pythonPath: paths.python, envCorePath: '' };
  }
  if (options.pythonPath) {
    return { kind: 'external', pythonPath: options.pythonPath, envCorePath: options.corePath };
  }
  return null;
}

/**
 * Install or repair the managed engine.
 *
 * Only this module's own `venv/` and marker are removed; the engine directory
 * is otherwise left alone. The core is installed with pip from its own
 * distribution: the pinned wheel when a runtime package is present (offline),
 * otherwise the newest release from the index. The venv therefore owns one
 * `ledger-domain` installation that can be upgraded without a plugin release.
 * @param {object} options bridge options.
 * @param {{ force?: boolean }} [request] install request.
 * @returns {Promise<object>} resulting engine status plus a bounded log.
 */
export async function installEngine(options, request = {}) {
  const paths = enginePaths(options);
  const status = await engineStatus(options);
  if (status.ready && request.force !== true) {
    return { ...status, log: 'engine already ready' };
  }
  const bundled = findBundledRuntime(options);
  const system = bundled === null ? await resolveSystemPython(options.systemPython) : { resolved: null, tried: [] };
  if (bundled === null && system.resolved === null) {
    const configured = typeof options.systemPython === 'string' && options.systemPython.trim() !== '';
    throw configured
      ? engineFailure('engine_python_missing', `cannot run ${options.systemPython}; install Python 3.11+ (64-bit) first`, {
        systemPython: options.systemPython,
      })
      : engineFailure(
        'engine_runtime_missing',
        `no bundled engine is available for ${process.platform}-${process.arch}; install Python 3.11+ (64-bit) or use a supported platform`,
        { platform: process.platform, arch: process.arch, searched: system.tried },
      );
  }

  mkdirSync(paths.dir, { recursive: true });
  const logs = [];
  const record = (label, outcome) => {
    const text = `$ ${label}\n${outcome.stdout}${outcome.stderr}`.trim();
    logs.push(text);
    if (logs.join('\n').length > LOG_LIMIT) logs.splice(0, 1);
  };
  const step = async (label, command, args, timeoutMs) => {
    const outcome = await runCommand(command, args, { timeoutMs });
    record(`${label}`, outcome);
    if (outcome.spawnError || outcome.timedOut || outcome.code !== 0) {
      const reason = outcome.timedOut ? 'timed out' : outcome.spawnError?.message ?? `exited with ${outcome.code}`;
      throw engineFailure('engine_install_failed', `${label} failed: ${reason}`, { log: logs.join('\n') });
    }
    return outcome;
  };

  try {
    let pythonCommand;
    let pythonPrefix = [];
    let pythonSource;
    let runtimeMarker = null;
    if (bundled !== null) {
      syncRuntime(paths, bundled, logs);
      pythonCommand = runtimePython(paths.runtime);
      pythonSource = 'bundled';
      runtimeMarker = {
        package: bundled.packageName,
        version: bundled.manifest.pythonVersion ?? null,
        pba: bundled.manifest.pba ?? null,
      };
    } else {
      pythonCommand = system.resolved.command;
      pythonPrefix = system.resolved.args;
      pythonSource = 'system';
      logs.push(`$ python\n${system.resolved.label} (${system.resolved.version})`);
    }

    rmSync(paths.venv, RM_OPTIONS);
    rmSync(paths.marker, { force: true });
    await step('create venv', pythonCommand, [...pythonPrefix, '-m', 'venv', paths.venv], 180_000);
    const pip = await runCommand(paths.python, ['-m', 'pip', '--version'], { timeoutMs: 30_000 });
    record('probe pip', pip);
    if (pip.spawnError || pip.code !== 0) {
      await step('bootstrap pip', paths.python, ['-m', 'ensurepip', '--upgrade'], 180_000);
    }
    const site = await step(
      'locate site-packages',
      paths.python,
      ['-c', 'import site; print(site.getsitepackages()[0])'],
      30_000,
    );
    const sitePackages = site.stdout.trim().split(/\r?\n/).pop() ?? '';
    if (!sitePackages || !existsSync(sitePackages)) {
      throw engineFailure('engine_install_failed', 'the new venv did not report a usable site-packages directory', { log: logs.join('\n') });
    }
    // Older engines held a hand-copied core here; it has no distribution
    // metadata and would shadow the pip installation, so it goes first.
    const removed = clearInstalledCore(sitePackages);
    if (removed.length > 0) logs.push(`$ clear legacy core\n${removed.join(', ')}`);

    const installArgs = ['-m', 'pip', 'install', '--disable-pip-version-check', '--no-input'];
    if (bundled !== null) installArgs.push('--no-index', '--find-links', bundled.wheelhouse);
    installArgs.push('beancount', 'beanquery', 'mcp', coreSpec(bundled));
    await step('install engine packages', paths.python, installArgs, 900_000);

    const imported = await step(
      'verify imports',
      paths.python,
      ['-c', 'import beancount, beanquery, mcp, ledger_domain; print(getattr(beancount, "__version__", "?"))'],
      30_000,
    );
    const beanCheck = await step('verify bean-check', paths.beanCheck, ['--version'], 30_000);
    const core = await probeCore(paths);
    if (core === null) {
      throw engineFailure('engine_install_failed', 'the installed core did not report its version', { log: logs.join('\n') });
    }
    if (!withinProtocol(core.protocol)) {
      throw engineFailure(
        'engine_core_protocol_mismatch',
        `core ${core.version} speaks protocol ${core.protocol}, which this panel does not support; install an older core or update the plugin`,
        { version: core.version, protocol: core.protocol, supported: [CORE_PROTOCOL_MIN, CORE_PROTOCOL_MAX] },
      );
    }
    writeFileSync(
      paths.marker,
      `${JSON.stringify({
        createdAt: new Date().toISOString(),
        python: paths.python,
        pythonSource,
        runtime: runtimeMarker,
        coreVersion: core.version,
        coreProtocol: core.protocol,
        coreSource: bundled !== null ? 'wheelhouse' : 'pypi',
        platform: process.platform,
        arch: process.arch,
        beancount: imported.stdout.trim(),
        beanCheck: beanCheck.stdout.trim(),
      }, null, 2)}\n`,
      'utf8',
    );
    const updated = await engineStatus(options);
    if (!updated.ready) {
      throw engineFailure('engine_install_failed', 'the engine was installed but failed its readiness probe', {
        log: logs.join('\n'),
        issues: updated.issues,
      });
    }
    return { ...updated, log: logs.join('\n') };
  } catch (error) {
    try {
      writeFileSync(paths.log, `${logs.join('\n')}\n`, 'utf8');
    } catch {
      // The engine directory may be unwritable; the original error is what matters.
    }
    throw error;
  }
}

/**
 * The pip requirement that installs the core baseline for this install.
 * @param {ReturnType<typeof findBundledRuntime>} bundled runtime package, if any.
 * @returns {string} requirement string.
 */
function coreSpec(bundled) {
  const pinned = bundled?.manifest?.core?.version;
  return typeof pinned === 'string' && pinned !== '' ? `${CORE_PACKAGE}==${pinned}` : CORE_PACKAGE;
}

/**
 * Drop a hand-copied core (and any stale metadata) before pip takes ownership.
 * @param {string} sitePackages venv site-packages directory.
 * @returns {string[]} removed distribution names.
 */
function clearInstalledCore(sitePackages) {
  const removed = [];
  rmSync(path.join(sitePackages, 'ledger_domain'), RM_OPTIONS);
  try {
    for (const name of readdirSync(sitePackages)) {
      if (name.startsWith('ledger_domain-') && name.endsWith('.dist-info')) {
        rmSync(path.join(sitePackages, name), RM_OPTIONS);
        removed.push(name);
      }
    }
  } catch {
    // A missing or unreadable site-packages cannot hold a legacy core anyway.
  }
  return removed;
}

/**
 * Record the core version in the engine marker, dropping legacy fingerprint fields.
 * @param {ReturnType<typeof enginePaths>} paths engine paths.
 * @param {{ version: string, protocol: number }} core installed core contract.
 * @param {'wheelhouse' | 'pypi'} source where the version came from.
 * @returns {void}
 */
function writeMarkerCore(paths, core, source) {
  const marker = readMarker(paths) ?? {};
  delete marker.corePath;
  delete marker.coreFingerprint;
  writeFileSync(
    paths.marker,
    `${JSON.stringify({
      ...marker,
      coreVersion: core.version,
      coreProtocol: core.protocol,
      coreSource: source,
      coreUpdatedAt: new Date().toISOString(),
    }, null, 2)}\n`,
    'utf8',
  );
}

/**
 * Reinstall the core pinned by the runtime wheelhouse without network access.
 * @param {ReturnType<typeof enginePaths>} paths engine paths.
 * @param {ReturnType<typeof findBundledRuntime>} bundled runtime package, if any.
 * @returns {Promise<boolean>} true when the baseline is back in place.
 */
async function restoreCoreBaseline(paths, bundled) {
  if (bundled === null || typeof bundled.manifest?.core?.version !== 'string') return false;
  const outcome = await runCommand(
    paths.python,
    [
      '-m',
      'pip',
      'install',
      '--disable-pip-version-check',
      '--no-input',
      '--force-reinstall',
      '--no-index',
      '--find-links',
      bundled.wheelhouse,
      `${CORE_PACKAGE}==${bundled.manifest.core.version}`,
    ],
    { timeoutMs: 300_000 },
  );
  return outcome.spawnError === null && outcome.code === 0;
}

/**
 * Upgrade the core from the index, without touching the plugin.
 *
 * The new core is probed after installation; a version outside the protocol
 * window is rejected and the pinned baseline is restored, so a stale panel can
 * never end up talking to a core it does not understand.
 * @param {object} options bridge options.
 * @param {{ version?: string }} [request] explicit version, or the newest release.
 * @returns {Promise<object>} resulting engine status plus a bounded log.
 */
export async function upgradeCore(options, request = {}) {
  const paths = enginePaths(options);
  const status = await engineStatus(options);
  if (status.kind !== 'managed' && status.kind !== 'stale') {
    throw engineFailure('engine_missing', 'install or repair the ledger engine before upgrading the core', { kind: status.kind });
  }
  const bundled = findBundledRuntime(options);
  const requested = typeof request.version === 'string' ? request.version.trim() : '';
  const target = requested !== '' ? requested : (await latestCoreVersion(options, paths))?.version ?? null;
  if (target === null) {
    throw engineFailure('core_version_unknown', 'cannot resolve a core version; check the network or set pypiIndex', {});
  }
  if (status.core.version === target) {
    return { ...status, log: `core ${target} is already installed` };
  }
  const outcome = await runCommand(
    paths.python,
    ['-m', 'pip', 'install', '--disable-pip-version-check', '--no-input', '--timeout', '15', '--upgrade', `${CORE_PACKAGE}==${target}`],
    { timeoutMs: 300_000 },
  );
  if (outcome.spawnError !== null || outcome.timedOut || outcome.code !== 0) {
    throw engineFailure('core_upgrade_failed', `installing ${CORE_PACKAGE}==${target} failed`, {
      log: `${outcome.stdout}${outcome.stderr}`.trim(),
    });
  }
  const core = await probeCore(paths);
  if (core === null || !withinProtocol(core.protocol)) {
    const restored = await restoreCoreBaseline(paths, bundled);
    throw engineFailure(
      'core_protocol_mismatch',
      `core ${target} needs a newer panel plugin; ${restored ? 'the bundled core was restored' : 'restore the bundled core from the panel'}`,
      { version: target, protocol: core?.protocol ?? null, restored },
    );
  }
  writeMarkerCore(paths, core, 'pypi');
  return { ...(await engineStatus(options)), log: `core ${core.version} installed from the index` };
}

/**
 * Put the core pinned by the runtime wheelhouse back, offline.
 * @param {object} options bridge options.
 * @returns {Promise<object>} resulting engine status plus a bounded log.
 */
export async function rollbackCore(options) {
  const paths = enginePaths(options);
  const bundled = findBundledRuntime(options);
  if (bundled === null) {
    throw engineFailure('engine_runtime_missing', 'no bundled runtime is available; there is no baseline to restore', {});
  }
  const baseline = bundled.manifest?.core?.version;
  if (typeof baseline !== 'string' || baseline === '') {
    throw engineFailure('core_baseline_unknown', 'the bundled runtime does not pin a core version', {});
  }
  const restored = await restoreCoreBaseline(paths, bundled);
  if (!restored) {
    throw engineFailure('core_rollback_failed', `restoring ${CORE_PACKAGE}==${baseline} from the bundle failed`, {
      version: baseline,
    });
  }
  const core = await probeCore(paths);
  if (core === null) {
    throw engineFailure('core_rollback_failed', 'the restored core did not report its version', { version: baseline });
  }
  writeMarkerCore(paths, core, 'wheelhouse');
  return { ...(await engineStatus(options)), log: `core ${core.version} restored from the bundle` };
}

/**
 * One engine failure with a code and optional log.
 * @param {string} code failure code.
 * @param {string} message reason.
 * @param {object} [details] context.
 * @returns {Error & { code: string, details: object }} error.
 */
function engineFailure(code, message, details = {}) {
  const error = /** @type {Error & { code: string, details: object }} */ (new Error(message));
  error.code = code;
  error.details = details;
  return error;
}
