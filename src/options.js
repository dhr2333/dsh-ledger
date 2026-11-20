/**
 * Row-config normalization for the display-only bundle.
 *
 * The panel plugin holds no ledger rules; it only needs to know where the ledger
 * is, where the Python core lives, and which interpreter runs it.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { venvProgram } from './host/platform.js';

/** Subdirectory under `$DSH_HOME` that holds plugin-owned state. */
const STATE_DIR = 'ledger-domain';
/** Standard source checkout created by `scripts/install.sh` under `$DSH_HOME`. */
const INSTALL_DIR = 'ledger-domain-src';
/** File mapping each configured root to the ledger location chosen in the wizard. */
const ACTIVE_ROOTS_FILE = 'active-roots.json';

/** This package's own directory (`…/dsh-ledger`), used for sibling checkouts. */
const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * First candidate containing a marker file.
 * @param {(string | undefined)[]} candidates directories to test.
 * @param {(dir: string) => string} marker relative marker file.
 * @returns {string | undefined} first matching directory.
 */
function firstMatching(candidates, marker) {
  return candidates.find(
    (candidate) => typeof candidate === 'string' && candidate !== '' && existsSync(marker(candidate)),
  );
}

/**
 * Find a Python core *source* checkout, for development only.
 *
 * An installed bundle does not carry the core: it is a PyPI distribution
 * installed into the managed engine venv, so a core fix reaches users without a
 * plugin release. `corePath` therefore only matters for a source checkout used
 * with an external interpreter, and for the one-command installer.
 * @param {string} dshHome DSH home directory.
 * @returns {string | undefined} core project root.
 */
function discoverCorePath(dshHome) {
  return firstMatching(
    [
      process.env.DSH_LEDGER_CORE,
      path.resolve(packageDir, '..', 'ledger-domain-core'),
      path.join(dshHome, INSTALL_DIR, 'ledger-domain-core'),
      path.join(dshHome, 'ledger-domain-core'),
    ],
    (candidate) => path.join(candidate, 'ledger_domain', '__init__.py'),
  );
}

/**
 * Find the ledger template when the profile carries no explicit `templatePath`.
 * @param {string} dshHome DSH home directory.
 * @returns {string | undefined} template root.
 */
function discoverTemplatePath(dshHome) {
  return firstMatching(
    [
      process.env.DSH_LEDGER_TEMPLATE,
      path.resolve(packageDir, '..', 'ledger-domain-assets'),
      path.join(packageDir, 'vendor', 'assets'),
      path.join(dshHome, INSTALL_DIR, 'ledger-domain-assets'),
      path.join(dshHome, 'ledger-domain-assets'),
    ],
    (candidate) => path.join(candidate, 'main.bean'),
  );
}

/**
 * Absolute path of the active-root state file.
 * @param {string} dshHome DSH home directory.
 * @returns {string} state file path.
 */
function activeRootsFile(dshHome) {
  return path.join(dshHome, STATE_DIR, ACTIVE_ROOTS_FILE);
}

/**
 * Read the root-to-active-ledger mapping. A malformed file is treated as empty
 * so a corrupt state file can never stop the panel from opening.
 * @param {string} dshHome DSH home directory.
 * @returns {Record<string, string>} absolute configured root → absolute ledger root.
 */
function readActiveRoots(dshHome) {
  try {
    const parsed = JSON.parse(readFileSync(activeRootsFile(dshHome), 'utf8'));
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([configured, active]) => typeof configured === 'string' && typeof active === 'string' && path.isAbsolute(active),
      ),
    );
  } catch {
    return {};
  }
}

/**
 * Resolve the ledger root the wizard last selected for a configured root.
 * @param {string} configuredRoot absolute configured root.
 * @param {string} dshHome DSH home directory.
 * @returns {string | undefined} absolute active ledger root.
 */
function readActiveRoot(configuredRoot, dshHome) {
  const active = readActiveRoots(dshHome)[configuredRoot];
  return typeof active === 'string' && path.isAbsolute(active) ? active : undefined;
}

/**
 * Remember the ledger location chosen in the creation wizard, keyed by the
 * configured root so changing the profile config still takes effect.
 *
 * Failure is non-fatal: the current process already switched to the chosen
 * root; only the next boot would fall back to the configured root.
 * @param {object} options normalized bridge options.
 * @param {string} root absolute ledger root that was just created.
 * @returns {void}
 */
export function rememberActiveRoot(options, root) {
  const configuredRoot = path.resolve(options.defaultRoot ?? options.root);
  const activeRoot = path.resolve(root);
  const home = typeof options.dshHome === 'string' ? options.dshHome : os.homedir();
  const roots = readActiveRoots(home);
  if (activeRoot === configuredRoot) delete roots[configuredRoot];
  else roots[configuredRoot] = activeRoot;
  try {
    mkdirSync(path.dirname(activeRootsFile(home)), { recursive: true });
    writeFileSync(activeRootsFile(home), `${JSON.stringify(roots, null, 2)}\n`, 'utf8');
  } catch {
    // The current process keeps the chosen root in memory; persistence is best-effort.
  }
}

/**
 * Normalize raw row config.
 * @param {Record<string, unknown> | undefined} config raw patch config.
 * @returns {{
 *   root: string,
 *   defaultRoot: string,
 *   dshHome: string,
 *   beanFile: string,
 *   stateDir: string,
 *   corePath: string,
 *   templatePath: string,
 *   engineDir: string,
 *   runtimePath: string,
 *   systemPython: string,
 *   pythonPath: string,
 *   pythonModule: string,
 *   beanCheck: string,
 *   beanQuery: string,
 *   pypiIndex: string,
 *   timeZone: string,
 *   graceDays: number,
 *   timeoutMs: number,
 * }} bridge options.
 */
export function readOptions(config) {
  const value = config ?? {};
  const text = (key) => (typeof value[key] === 'string' && value[key].trim() !== '' ? value[key].trim() : undefined);
  const integer = (key, fallback) => (Number.isSafeInteger(value[key]) ? Number(value[key]) : fallback);
  const dshHome = process.env.DSH_HOME ?? path.join(os.homedir(), '.dsh');
  const defaultRoot = path.resolve(text('root') ?? path.join(dshHome, 'ledger'));
  const root = readActiveRoot(defaultRoot, dshHome) ?? defaultRoot;
  const configuredPython = text('pythonPath');
  const ledgerPython = venvProgram(path.join(root, '.venv'), 'python');
  const pythonPath = configuredPython === undefined
    ? (existsSync(ledgerPython) ? ledgerPython : '')
    : path.isAbsolute(configuredPython)
      ? configuredPython
      : path.resolve(configuredPython);
  const configuredCore = text('corePath');
  const configuredTemplate = text('templatePath');
  return {
    root,
    defaultRoot,
    dshHome,
    beanFile: text('beanFile') ?? 'main.bean',
    stateDir: text('stateDir') ?? '.ledger',
    corePath: configuredCore === undefined ? (discoverCorePath(dshHome) ?? '') : path.resolve(configuredCore),
    templatePath: configuredTemplate === undefined ? (discoverTemplatePath(dshHome) ?? '') : path.resolve(configuredTemplate),
    engineDir: path.resolve(text('engineDir') ?? path.join(dshHome, 'ledger-engine')),
    runtimePath: text('runtimePath') === undefined ? '' : path.resolve(text('runtimePath')),
    systemPython: text('systemPython') ?? '',
    pythonPath,
    pythonModule: text('pythonModule') ?? 'ledger_domain',
    beanCheck: text('beanCheck') ?? '',
    beanQuery: text('beanQuery') ?? '',
    pypiIndex: text('pypiIndex') ?? process.env.DSH_LEDGER_PYPI_INDEX ?? '',
    timeZone: text('timeZone') ?? 'Asia/Shanghai',
    graceDays: integer('graceDays', 3),
    timeoutMs: integer('timeoutMs', 120_000),
  };
}
