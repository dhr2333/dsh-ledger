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
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
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
const require = createRequire(import.meta.url);

/**
 * Paths owned by one managed engine.
 * @param {object} options bridge options.
 * @returns {{dir:string, venv:string, runtime:string, python:string, beanCheck:string, beanQuery:string, marker:string, log:string}} engine paths.
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
 * Fingerprint the core source package by content.
 *
 * The managed engine holds a copy of ``ledger_domain`` in its site-packages.
 * When the source changes, that copy is stale even though the engine still
 * imports; the marker records this fingerprint so the panel can offer a repair.
 * Content, not mtime: npm normalises every tarball mtime to 1985, so a
 * timestamp fingerprint cannot see a core update inside a new plugin version.
 * @param {string} corePath core project root.
 * @returns {string} fingerprint or an empty string when the source is missing.
 */
function coreFingerprint(corePath) {
  if (!corePath) return '';
  const directory = path.join(corePath, 'ledger_domain');
  if (!existsSync(directory)) return '';
  try {
    const hash = createHash('sha256');
    let files = 0;
    const walk = (current, prefix) => {
      for (const name of readdirSync(current).sort()) {
        if (name === '__pycache__') continue;
        const full = path.join(current, name);
        const relative = prefix === '' ? name : `${prefix}/${name}`;
        if (statSync(full).isDirectory()) {
          walk(full, relative);
          continue;
        }
        if (!name.endsWith('.py')) continue;
        files += 1;
        hash.update(relative).update('\0').update(readFileSync(full)).update('\0');
      }
    };
    walk(directory, '');
    return `${files}:${hash.digest('hex').slice(0, 16)}`;
  } catch {
    return '';
  }
}

/**
 * Probe the managed venv: imports plus the bean-check executable.
 * @param {object} options bridge options.
 * @param {ReturnType<typeof enginePaths>} paths engine paths.
 * @param {ReturnType<typeof findBundledRuntime>} bundled runtime available to this install.
 * @returns {Promise<{ installed:boolean, ready:boolean, stale:boolean, marker:object|null, issues:string[] }>} probe.
 */
async function probeManaged(options, paths, bundled) {
  const marker = readMarker(paths);
  const installed = existsSync(paths.python) && existsSync(paths.beanCheck) && existsSync(paths.beanQuery);
  if (marker === null || !installed) {
    return { installed: existsSync(paths.venv), ready: false, stale: false, marker, issues: marker === null ? ['engine_not_installed'] : ['engine_incomplete'] };
  }
  const [imported, beanCheck, beanQuery] = await Promise.all([
    runCommand(paths.python, ['-c', 'import beancount, beanquery, mcp, ledger_domain; print(getattr(beancount, "__version__", "?"))'], { timeoutMs: 30_000 }),
    runCommand(paths.beanCheck, ['--version'], { timeoutMs: 30_000 }),
    runCommand(paths.beanQuery, ['--version'], { timeoutMs: 30_000 }),
  ]);
  const issues = [];
  if (imported.code !== 0) issues.push('engine_import_failed');
  if (beanCheck.code !== 0) issues.push('engine_bean_check_failed');
  if (beanQuery.code !== 0) issues.push('engine_bean_query_failed');
  const sourceChanged = Boolean(
    options.corePath
      && (marker.corePath === undefined || path.resolve(String(marker.corePath)) !== path.resolve(options.corePath)),
  );
  const copyChanged = Boolean(
    options.corePath
      && (!marker.coreFingerprint || marker.coreFingerprint !== coreFingerprint(options.corePath)),
  );
  // Once a platform package is available, an engine built from system Python
  // (or from an older runtime) should offer a repair to the bundled runtime.
  const runtimeChanged = Boolean(
    bundled
      && (marker.pythonSource !== 'bundled'
        || marker.runtime?.package !== bundled.packageName
        || marker.runtime?.version !== bundled.manifest.pythonVersion),
  );
  const stale = sourceChanged || copyChanged || runtimeChanged;
  if (stale) issues.push('engine_core_changed');
  return {
    installed: true,
    ready: issues.length === 0,
    stale,
    marker,
    issues,
  };
}

/**
 * Probe a developer-supplied external engine.
 * @param {object} options bridge options.
 * @returns {Promise<{ configured:boolean, ready:boolean, issues:string[] }>} probe.
 */
async function probeExternal(options) {
  if (!options.pythonPath || !options.corePath) return { configured: false, ready: false, issues: [] };
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
  env.PYTHONPATH = options.corePath + (env.PYTHONPATH ? `${path.delimiter}${env.PYTHONPATH}` : '');
  const outcome = await runCommand(
    options.pythonPath,
    ['-m', options.pythonModule, '--root', options.root, 'health'],
    {
      cwd: existsSync(options.root) ? options.root : options.corePath,
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
 * Report which engine the bridge would use.
 * @param {object} options bridge options.
 * @returns {Promise<object>} engine status.
 */
export async function engineStatus(options) {
  const paths = enginePaths(options);
  const bundled = findBundledRuntime(options);
  const [managed, external] = await Promise.all([probeManaged(options, paths, bundled), probeExternal(options)]);
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
    managed,
    external,
    issues: [...new Set([...(managed.issues ?? []), ...(external.issues ?? [])])],
  };
}

/**
 * Resolve the interpreter and PYTHONPATH for a core call.
 * @param {object} options bridge options.
 * @returns {{ kind:string, pythonPath:string, envCorePath:string } | null} runtime or null when no engine exists.
 */
export function runtimeFor(options) {
  const paths = enginePaths(options);
  if (existsSync(paths.marker) && existsSync(paths.python) && existsSync(paths.beanCheck)) {
    const marker = readMarker(paths);
    const current = coreFingerprint(options.corePath);
    const currentCore = options.corePath
      ? marker?.corePath !== undefined && path.resolve(String(marker.corePath)) === path.resolve(options.corePath) && marker.coreFingerprint === current
      : true;
    if (currentCore) return { kind: 'managed', pythonPath: paths.python, envCorePath: '' };
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
 * is otherwise left alone. The core package is copied into site-packages
 * instead of built/installed, so only Beancount needs the package index.
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
  if (!options.corePath || !existsSync(path.join(options.corePath, 'ledger_domain', '__init__.py'))) {
    throw engineFailure('engine_source_missing', 'the local core source is missing; set corePath to the ledger-domain-core project', {
      corePath: options.corePath,
    });
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
    const installArgs = ['-m', 'pip', 'install', '--disable-pip-version-check', '--no-input'];
    if (bundled !== null) installArgs.push('--no-index', '--find-links', bundled.wheelhouse);
    installArgs.push('beancount', 'beanquery', 'mcp');
    await step('install beancount', paths.python, installArgs, 900_000);
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
    const target = path.join(sitePackages, 'ledger_domain');
    rmSync(target, RM_OPTIONS);
    cpSync(path.join(options.corePath, 'ledger_domain'), target, { recursive: true });
    logs.push(`$ copy core\n${path.join(options.corePath, 'ledger_domain')} -> ${target}`);
    const imported = await step(
      'verify imports',
      paths.python,
      ['-c', 'import beancount, beanquery, mcp, ledger_domain; print(getattr(beancount, "__version__", "?"))'],
      30_000,
    );
    const beanCheck = await step('verify bean-check', paths.beanCheck, ['--version'], 30_000);
    writeFileSync(
      paths.marker,
      `${JSON.stringify({
        createdAt: new Date().toISOString(),
        corePath: options.corePath,
        coreFingerprint: coreFingerprint(options.corePath),
        python: paths.python,
        pythonSource,
        runtime: runtimeMarker,
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
