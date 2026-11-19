/**
 * Host half of the display-only ledger-domain bundle.
 *
 * There are no ledger rules here. The Python project at ``corePath`` owns the
 * ledger; this bundle authenticates the panel, forwards its requests to
 * ``python -m ledger_domain`` and renders the returned JSON. It registers no
 * agent tools: Agent adapters call the core directly, not through this panel.
 */

import { registerRoutes } from './src/host/routes.js';
import { readOptions } from './src/options.js';

/** Stable Loader identity. */
export const name = 'ledger-domain';
/** The Web carrier and its browser trust fence are required for the panel. */
export const inject = ['webServer', 'connection'];

/**
 * Activate the panel bridge.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @param {Record<string, unknown>} [config] bundle row config.
 * @returns {void}
 */
export function apply(ctx, config) {
  registerRoutes(ctx, readOptions(config));
}
