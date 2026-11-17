/**
 * Row-config normalization for the display-only bundle.
 *
 * The panel plugin holds no domain code; it only needs to know where the ledger
 * is, where the Python core lives, and which interpreter runs it.
 */

import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Normalize raw row config.
 * @param {Record<string, unknown> | undefined} config raw patch config.
 * @returns {{
 *   root: string,
 *   beanFile: string,
 *   stateDir: string,
 *   corePath: string,
 *   engineDir: string,
 *   systemPython: string,
 *   pythonPath: string,
 *   pythonModule: string,
 *   beanCheck: string,
 *   beanQuery: string,
 *   timeZone: string,
 *   graceDays: number,
 *   timeoutMs: number,
 * }} bridge options.
 */
export function readOptions(config) {
  const value = config ?? {};
  const text = (key) => (typeof value[key] === 'string' && value[key].trim() !== '' ? value[key].trim() : undefined);
  const integer = (key, fallback) => (Number.isSafeInteger(value[key]) ? Number(value[key]) : fallback);
  const root = path.resolve(text('root') ?? process.cwd());
  const configuredPython = text('pythonPath');
  const ledgerPython = path.join(root, '.venv', 'bin', 'python');
  const pythonPath = configuredPython === undefined
    ? (existsSync(ledgerPython) ? ledgerPython : '')
    : path.isAbsolute(configuredPython)
      ? configuredPython
      : path.resolve(configuredPython);
  const configuredCore = text('corePath');
  const dshHome = process.env.DSH_HOME ?? path.join(os.homedir(), '.dsh');
  return {
    root,
    beanFile: text('beanFile') ?? 'main.bean',
    stateDir: text('stateDir') ?? '.ledger',
    corePath: configuredCore === undefined ? '' : path.resolve(configuredCore),
    engineDir: path.resolve(text('engineDir') ?? path.join(dshHome, 'ledger-engine')),
    systemPython: text('systemPython') ?? 'python3',
    pythonPath,
    pythonModule: text('pythonModule') ?? 'ledger_domain',
    beanCheck: text('beanCheck') ?? '',
    beanQuery: text('beanQuery') ?? '',
    timeZone: text('timeZone') ?? 'Asia/Shanghai',
    graceDays: integer('graceDays', 3),
    timeoutMs: integer('timeoutMs', 120_000),
  };
}
