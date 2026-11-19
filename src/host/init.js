/**
 * New-ledger initialization for the `ledger-domain-assets` layout.
 *
 * The core library still ships its legacy `init` (year/month files), which the
 * current fixed append targets cannot write to. This module owns the panel's
 * initialization instead: copy the assets template, stamp the ledger title and
 * currency, validate with the real `bean-check` in a staging directory, and
 * only then atomically move it into place. A failed run leaves the target
 * path untouched.
 */

import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';

import { enginePaths, runCommand } from './engine.js';
import { rememberActiveRoot } from '../options.js';

/** Files every `ledger-domain-assets` checkout must contain. */
const REQUIRED_FILES = [
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

/** Template entries that belong to the template repository, not the ledger. */
const TEMPLATE_SKIP = new Set(['.git', '.venv', 'venv', '.ledger', '__pycache__', 'node_modules', '.DS_Store']);

/**
 * Build one initialization error with the stable wire code.
 * @param {string} code machine-readable code.
 * @param {string} message human-readable message.
 * @param {Record<string, unknown>} [details] structured details.
 * @returns {Error & { code: string, details: Record<string, unknown> }} error.
 */
function fail(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

/**
 * Resolve the template checkout used to seed a new ledger.
 * @param {object} options bridge options.
 * @returns {string | undefined} first existing candidate directory.
 */
export function resolveTemplate(options) {
  const dshHome = process.env.DSH_HOME ?? path.join(process.env.HOME ?? '', '.dsh');
  const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const candidates = [
    options.templatePath,
    path.resolve(packageDir, '..', 'ledger-domain-assets'),
    path.join(packageDir, 'vendor', 'assets'),
    options.corePath ? path.resolve(options.corePath, '..', 'ledger-domain-assets') : undefined,
    path.join(dshHome, 'ledger-domain-src', 'ledger-domain-assets'),
    path.join(dshHome, 'ledger-domain-assets'),
  ].filter((candidate) => typeof candidate === 'string' && candidate !== '');
  return candidates.find((candidate) => existsSync(path.join(candidate, 'main.bean')));
}

/**
 * Resolve the bean-check binary the same way the engine probe does.
 * @param {object} options bridge options.
 * @returns {string} executable or PATH name.
 */
export function beanCheckBinary(options) {
  if (options.beanCheck) {
    if (path.isAbsolute(options.beanCheck)) return options.beanCheck;
    if (options.beanCheck.includes('/') || options.beanCheck.includes('\\')) return path.join(options.root, options.beanCheck);
    return options.beanCheck;
  }
  // The wizard runs after the panel reports a ready engine. For the managed
  // engine that binary lives inside its private venv, which is not on PATH, so
  // validation must not fall back to a global `bean-check`.
  const managed = enginePaths(options);
  if (existsSync(managed.beanCheck)) return managed.beanCheck;
  if (options.pythonPath) {
    const sibling = path.join(path.dirname(options.pythonPath), 'bean-check');
    if (existsSync(sibling)) return sibling;
  }
  return 'bean-check';
}

/**
 * Quote one Beancount string value.
 * @param {string} value raw value.
 * @returns {string} quoted literal.
 */
function quote(value) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * List files below a directory, relative and sorted, for the init response.
 * @param {string} root directory.
 * @returns {string[]} relative file paths.
 */
function listFiles(root) {
  const out = [];
  const walk = (current, prefix) => {
    for (const name of readdirSync(current).sort()) {
      const full = path.join(current, name);
      const relative = prefix === '' ? name : `${prefix}/${name}`;
      if (statSync(full).isDirectory()) walk(full, relative);
      else out.push(relative);
    }
  };
  walk(root, '');
  return out;
}

/**
 * Read the ledger title from `main.bean`.
 * @param {string} mainFile ledger `main.bean`.
 * @returns {string | undefined} decoded title, or undefined when absent.
 */
function readTitle(mainFile) {
  try {
    const match = readFileSync(mainFile, 'utf8').match(/^option[ \t]+"title"[ \t]+"((?:[^"\\]|\\.)*)"/m);
    return match === null ? undefined : match[1].replace(/\\(["\\])/g, '$1');
  } catch {
    return undefined;
  }
}

/**
 * Rewrite the ledger metadata in `main.bean`.
 * @param {string} mainFile staged `main.bean`.
 * @param {string} title ledger title.
 * @param {string} currency operating currency.
 * @returns {void}
 */
function stampMetadata(mainFile, title, currency) {
  const source = readFileSync(mainFile, 'utf8');
  const titlePattern = /^option[ \t]+"title"[ \t]+"(?:[^"\\]|\\.)*"/m;
  const currencyPattern = /^option[ \t]+"operating_currency"[ \t]+"(?:[^"\\]|\\.)*"/m;
  if (!titlePattern.test(source)) throw fail('template_invalid', 'template main.bean has no title option');
  if (!currencyPattern.test(source)) throw fail('template_invalid', 'template main.bean has no operating_currency option');
  const stamped = source
    .replace(titlePattern, `option "title" ${quote(title)}`)
    .replace(currencyPattern, `option "operating_currency" ${quote(currency)}`);
  writeFileSync(mainFile, stamped, 'utf8');
}

/**
 * Copy the template into a new directory, skipping repository/runtime entries.
 * @param {string} from template root.
 * @param {string} to staging root.
 * @returns {void}
 */
function copyTemplate(from, to) {
  cpSync(from, to, {
    recursive: true,
    filter: (source) => !TEMPLATE_SKIP.has(path.basename(source)),
  });
  const missing = REQUIRED_FILES.filter((relative) => !existsSync(path.join(to, relative)));
  if (missing.length > 0) {
    throw fail('template_invalid', 'the template is missing required ledger files', { missing });
  }
}

/**
 * Resolve the ledger location requested by the wizard.
 *
 * An absent value keeps the configured root. A typed value must be an absolute
 * path (a leading `~` is expanded) so a request can never land in whatever
 * directory the host process happens to use as its cwd.
 * @param {object} options bridge options.
 * @param {unknown} requested raw `root` field from the init payload.
 * @returns {string} absolute ledger root.
 */
function resolveLedgerRoot(options, requested) {
  const fallback = path.resolve(options.defaultRoot ?? options.root);
  const text = typeof requested === 'string' ? requested.trim() : '';
  if (text === '') return fallback;
  const expanded = text === '~'
    ? os.homedir()
    : text.startsWith('~/') || text.startsWith('~\\')
      ? path.join(os.homedir(), text.slice(2))
      : text;
  if (!path.isAbsolute(expanded)) {
    throw fail('invalid_ledger_root', '账本位置必须是绝对路径', { root: text });
  }
  return path.resolve(expanded);
}

/**
 * Create a new ledger from `ledger-domain-assets` at the requested root.
 *
 * The target directory must not already contain a ledger; an existing empty
 * directory is reused. Validation runs in a sibling staging directory, so a
 * rejected template never reaches `root`. A successful run also remembers the
 * chosen location as the active ledger for the configured root.
 * @param {object} options bridge options.
 * @param {{ title?: string, root?: string, currency?: string }} [payload] init request.
 * @returns {Promise<{ root: string, title: string, currency: string, validated: true, template: string, files: string[] }>} created ledger summary.
 */
export async function initializeLedger(options, payload = {}) {
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  if (title === '') throw fail('invalid_title', '账本名称不能为空');
  if (Buffer.byteLength(title, 'utf8') > 240 || /[\u0000-\u001f\u007f]/.test(title)) {
    throw fail('invalid_title', '账本名称最多 80 个字符，且不能包含控制字符');
  }
  const currency = typeof payload.currency === 'string' && payload.currency.trim() !== '' ? payload.currency.trim() : 'CNY';
  if (!/^[A-Z][A-Z0-9'._-]{0,22}$/.test(currency)) {
    throw fail('invalid_currency', `"${currency}" is not a Beancount currency`);
  }

  const root = resolveLedgerRoot(options, payload.root);
  if (existsSync(root)) {
    if (!statSync(root).isDirectory()) throw fail('invalid_ledger_root', `${root} is not a directory`);
    const entries = readdirSync(root).filter((name) => name !== '.DS_Store');
    if (entries.includes(options.beanFile)) {
      // Picking a folder that already holds a ledger opens it instead of failing:
      // the wizard doubles as the one place where the active ledger can be chosen.
      const existingTitle = readTitle(path.join(root, options.beanFile)) ?? title;
      rememberActiveRoot(options, root);
      options.root = root;
      return {
        root,
        title: existingTitle,
        currency,
        validated: true,
        existing: true,
        template: null,
        files: listFiles(root),
      };
    }
    if (entries.length > 0) {
      throw fail('directory_not_empty', `${root} is not empty; choose an empty directory`, { root, entries });
    }
  }

  const template = resolveTemplate(options);
  if (template === undefined) {
    throw fail(
      'template_missing',
      'cannot find the ledger-domain-assets template; set templatePath in the plugin config',
      { templatePath: options.templatePath || null },
    );
  }

  mkdirSync(path.dirname(root), { recursive: true });
  const staging = mkdtempSync(path.join(path.dirname(root), `.${path.basename(root)}.init-`));
  try {
    copyTemplate(template, staging);
    stampMetadata(path.join(staging, options.beanFile), title, currency);

    const check = beanCheckBinary(options);
    const validation = await runCommand(check, [options.beanFile], {
      cwd: staging,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      timeoutMs: options.timeoutMs,
    });
    if (validation.spawnError || validation.timedOut || validation.code !== 0) {
      throw fail(
        'bean_check_failed',
        `the generated ledger was rejected by bean-check: ${validation.stderr.trim() || validation.spawnError?.message || 'unknown error'}`,
        { diagnostic: validation.stderr.trim(), beanCheck: check },
      );
    }

    // Only ignorable entries (`.DS_Store`) can remain after the emptiness check.
    if (existsSync(root)) rmSync(root, { recursive: true, force: true });
    renameSync(staging, root);
    // Switch this process to the chosen ledger and remember it for the next boot.
    rememberActiveRoot(options, root);
    options.root = root;
    return {
      root,
      title,
      currency,
      validated: true,
      template,
      files: listFiles(root),
    };
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}
