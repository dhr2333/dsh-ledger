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
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const OUTPUT_LIMIT = 4 * 1024 * 1024;
const LOG_LIMIT = 200_000;

/**
 * Paths owned by one managed engine.
 * @param {object} options bridge options.
 * @returns {{dir:string, venv:string, python:string, beanCheck:string, beanQuery:string, marker:string, log:string}} engine paths.
 */
export function enginePaths(options) {
  const dir = path.resolve(options.engineDir);
  const venv = path.join(dir, 'venv');
  return {
    dir,
    venv,
    python: path.join(venv, 'bin', 'python'),
    beanCheck: path.join(venv, 'bin', 'bean-check'),
    beanQuery: path.join(venv, 'bin', 'bean-query'),
    marker: path.join(dir, 'engine.json'),
    log: path.join(dir, 'install.log'),
  };
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
 * Cheap fingerprint of the core source package.
 *
 * The managed engine holds a copy of ``ledger_domain`` in its site-packages.
 * When the source changes, that copy is stale even though the engine still
 * imports; the marker records this fingerprint so the panel can offer a repair.
 * @param {string} corePath core project root.
 * @returns {string} fingerprint or an empty string when the source is missing.
 */
function coreFingerprint(corePath) {
  if (!corePath) return '';
  const directory = path.join(corePath, 'ledger_domain');
  if (!existsSync(directory)) return '';
  try {
    let files = 0;
    let latest = 0;
    for (const name of readdirSync(directory)) {
      if (!name.endsWith('.py')) continue;
      const info = statSync(path.join(directory, name));
      files += 1;
      latest = Math.max(latest, info.mtimeMs);
    }
    return `${files}:${latest}`;
  } catch {
    return '';
  }
}

/**
 * Probe the managed venv: imports plus the bean-check executable.
 * @param {object} options bridge options.
 * @param {ReturnType<typeof enginePaths>} paths engine paths.
 * @returns {Promise<{ installed:boolean, ready:boolean, stale:boolean, marker:object|null, issues:string[] }>} probe.
 */
async function probeManaged(options, paths) {
  const marker = readMarker(paths);
  const installed = existsSync(paths.python) && existsSync(paths.beanCheck) && existsSync(paths.beanQuery);
  if (marker === null || !installed) {
    return { installed: existsSync(paths.venv), ready: false, stale: false, marker, issues: marker === null ? ['engine_not_installed'] : ['engine_incomplete'] };
  }
  const [imported, beanCheck, beanQuery] = await Promise.all([
    runCommand(paths.python, ['-c', 'import beancount, ledger_domain; print(getattr(beancount, "__version__", "?"))'], { timeoutMs: 30_000 }),
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
  const stale = sourceChanged || copyChanged;
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
  const local = path.join(root, '.venv', 'bin', name);
  if (existsSync(local)) return local;
  const sibling = path.join(path.dirname(pythonPath), name);
  return existsSync(sibling) ? sibling : name;
}

/**
 * Report which engine the bridge would use.
 * @param {object} options bridge options.
 * @returns {Promise<object>} engine status.
 */
export async function engineStatus(options) {
  const paths = enginePaths(options);
  const [managed, external] = await Promise.all([probeManaged(options, paths), probeExternal(options)]);
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
  const systemPython = await runCommand(options.systemPython, ['--version'], { timeoutMs: 20_000 });
  if (systemPython.spawnError || systemPython.code !== 0) {
    throw engineFailure('engine_python_missing', `cannot run ${options.systemPython}; install Python 3.11+ first`, {
      systemPython: options.systemPython,
    });
  }

  mkdirSync(paths.dir, { recursive: true });
  rmSync(paths.venv, { recursive: true, force: true });
  rmSync(paths.marker, { force: true });
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
    await step('create venv', options.systemPython, ['-m', 'venv', paths.venv], 180_000);
    await step(
      'install beancount',
      paths.python,
      ['-m', 'pip', 'install', '--disable-pip-version-check', '--no-input', 'beancount', 'beanquery'],
      900_000,
    );
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
    rmSync(target, { recursive: true, force: true });
    cpSync(path.join(options.corePath, 'ledger_domain'), target, { recursive: true });
    logs.push(`$ copy core\n${path.join(options.corePath, 'ledger_domain')} -> ${target}`);
    const imported = await step(
      'verify imports',
      paths.python,
      ['-c', 'import beancount, ledger_domain; print(getattr(beancount, "__version__", "?"))'],
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
