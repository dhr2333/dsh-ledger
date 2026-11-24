/**
 * Host half of the display-only ledger-domain bundle.
 *
 * There are no ledger rules here. The Python project at ``corePath`` owns the
 * ledger; this bundle authenticates the panel, forwards its requests to
 * ``python -m beancount_guard`` and renders the returned JSON. It also exposes
 * a small, proposal-only tool family (``ledger_*``) to the Agent; approval
 * stays in the panel and no tool can write ``.bean`` files.
 */

import { registerRoutes } from './src/host/routes.js';
import { registerTools } from './src/host/tools.js';
import { readOptions } from './src/options.js';

/** Stable Loader identity. */
export const name = 'ledger-domain';
/** The Web carrier and its browser trust fence are required for the panel. */
export const inject = ['webServer', 'connection', 'tools'];

/**
 * Activate the panel bridge.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @param {Record<string, unknown>} [config] bundle row config.
 * @returns {void}
 */
export function apply(ctx, config) {
  const options = readOptions(config);
  registerRoutes(ctx, options);
  registerTools(ctx, options);
}
