/**
 * HTTP bridge for the panel half of the DSH bundle.
 *
 * This file owns no ledger semantics. It authenticates the browser request,
 * validates its wire shape, and executes the Python core CLI at
 * ``python -m beancount_guard``. The core validates and writes; the bridge only
 * translates JSON envelopes.
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { enginePaths, engineStatus, installEngine, rollbackCore, runtimeFor, upgradeCore } from './engine.js';
import { initializeLedger } from './init.js';

/** Prefix owned by this bundle. */
export const API_PREFIX = '/ledger-api';
/** Largest request body accepted by any panel route, in bytes. */
const BODY_LIMIT = 262_144;
/** Largest stdout captured from the core, in bytes. */
const OUTPUT_LIMIT = 16 * 1024 * 1024;

/**
 * Register the panel's HTTP surface.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @param {ReturnType<typeof import('../options.js').readOptions>} options bridge options.
 * @returns {void}
 */
export function registerRoutes(ctx, options) {
  const webServer = ctx.get('webServer');
  if (webServer === undefined) return;
  const route = {
    kind: 'prefix',
    path: API_PREFIX,
    // The panel reads and writes one person's ledger: never anonymous.
    auth: 'required',
    handler: async (req, res, peer) => {
      if (rejectUntrusted(ctx, req, res, peer)) return;
      try {
        await dispatch(ctx, options, req, res);
      } catch (error) {
        sendJson(res, 500, {
          ok: false,
          error: { code: 'bridge_error', message: error instanceof Error ? error.message : String(error) },
        });
      }
    },
  };
  ctx.effect(() => webServer.register(route), `ledger-domain: ${API_PREFIX}`);
}

/**
 * Route one request inside the prefix.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @param {object} options bridge options.
 * @param {import('node:http').IncomingMessage} req request.
 * @param {import('node:http').ServerResponse} res response.
 * @returns {Promise<void>}
 */
async function dispatch(ctx, options, req, res) {
  const url = new URL(String(req.url), 'http://localhost');
  const route = url.pathname.slice(API_PREFIX.length) || '/';
  const method = req.method ?? 'GET';

  if (route === '/engine' && method === 'GET') {
    try {
      sendJson(res, 200, { ok: true, ...(await engineStatus(options)) });
    } catch (error) {
      sendJson(res, 200, {
        ok: false,
        error: { code: 'engine_probe_failed', message: error instanceof Error ? error.message : String(error) },
      });
    }
    return;
  }
  if (route === '/engine/install' && method === 'POST') {
    const body = await readJson(req);
    if (!body.ok) {
      sendJson(res, body.status, { ok: false, error: body.error });
      return;
    }
    const value = /** @type {Record<string, unknown>} */ (body.value);
    try {
      sendJson(res, 200, { ok: true, ...(await installEngine(options, { force: value.force === true })) });
    } catch (error) {
      const failure = /** @type {Error & { code?: string, details?: object }} */ (error);
      sendJson(res, 200, {
        ok: false,
        error: {
          code: failure.code ?? 'engine_install_failed',
          message: failure.message,
          details: failure.details ?? {},
        },
      });
    }
    return;
  }
  if (route === '/engine/core-upgrade' && method === 'POST') {
    const body = await readJson(req);
    if (!body.ok) {
      sendJson(res, body.status, { ok: false, error: body.error });
      return;
    }
    const value = /** @type {Record<string, unknown>} */ (body.value);
    await sendEngineAction(res, () =>
      upgradeCore(options, { version: typeof value.version === 'string' ? value.version : undefined }),
    );
    return;
  }
  if (route === '/engine/core-rollback' && method === 'POST') {
    await sendEngineAction(res, () => rollbackCore(options));
    return;
  }
  if (route === '/health' && method === 'GET') {
    sendEnvelope(res, await runCore(options, 'health'));
    return;
  }
  if (route === '/setup' && method === 'GET') {
    sendEnvelope(res, await runCore(options, 'setup'));
    return;
  }
  if (route === '/init' && method === 'POST') {
    const body = await readJson(req);
    if (!body.ok) {
      sendJson(res, body.status, { ok: false, error: body.error });
      return;
    }
    const value = /** @type {Record<string, unknown>} */ (body.value);
    try {
      const created = await initializeLedger(options, {
        title: optionalString(value.title) ?? '我的账本',
        root: optionalString(value.root),
      });
      // Creating a ledger is the natural moment to give it a DSH workspace: the
      // workspace path is the ledger root, so sessions started there see main.bean.
      created.workspace = await workspaceOutcome(ctx, created.root, created.title);
      sendJson(res, 200, { ok: true, value: created });
    } catch (error) {
      const failure = /** @type {Error & { code?: string, details?: object }} */ (error);
      sendJson(res, 200, {
        ok: false,
        error: {
          code: failure.code ?? 'init_failed',
          message: failure.message,
          details: failure.details ?? {},
        },
      });
    }
    return;
  }
  if (route === '/workspace' && method === 'POST') {
    const body = await readJson(req);
    if (!body.ok) {
      sendJson(res, body.status, { ok: false, error: body.error });
      return;
    }
    const value = /** @type {Record<string, unknown>} */ (body.value);
    const outcome = await workspaceOutcome(ctx, options.root, optionalString(value.title));
    if (outcome.ok) sendJson(res, 200, { ok: true, created: outcome.created, workspace: outcome.workspace });
    else sendJson(res, 200, { ok: false, error: outcome.error });
    return;
  }
  if (route === '/bootstrap' && method === 'GET') {
    sendEnvelope(res, await runCore(options, 'bootstrap'));
    return;
  }
  // Read-only account balances for the accounts tree. The core owns the query
  // and projects accounts to their display names; the panel decides which
  // account classes to show.
  if (route === '/balances' && method === 'GET') {
    sendEnvelope(res, await runCore(options, 'query-balances'));
    return;
  }
  if (route === '/draft/submit' && method === 'POST') {
    const body = await readJson(req);
    if (!body.ok) {
      sendJson(res, body.status, { ok: false, error: body.error });
      return;
    }
    sendEnvelope(res, await runCore(options, 'submit-draft', [], /** @type {object} */ (body.value)));
    return;
  }
  if (route === '/account/open' && method === 'POST') {
    const body = await readJson(req);
    if (!body.ok) {
      sendJson(res, body.status, { ok: false, error: body.error });
      return;
    }
    const value = /** @type {Record<string, unknown>} */ (body.value);
    const payload = {
      account: requireString(value.account, 'account'),
      actor: 'panel',
    };
    if (optionalString(value.date)) payload.date = optionalString(value.date);
    if (Array.isArray(value.currencies)) payload.currencies = value.currencies;
    if (optionalString(value.currency)) payload.currency = optionalString(value.currency);
    if (optionalString(value.alias)) payload.alias = optionalString(value.alias);
    if (optionalString(value.reconcile)) payload.reconcile = optionalString(value.reconcile);
    sendEnvelope(res, await runCore(options, 'account-open', [], payload));
    return;
  }
  if (route === '/reconcile/preview' && method === 'POST') {
    const body = await readJson(req);
    if (!body.ok) {
      sendJson(res, body.status, { ok: false, error: body.error });
      return;
    }
    sendEnvelope(res, await runCore(options, 'reconcile-preview', [], /** @type {Record<string, unknown>} */ (body.value)));
    return;
  }
  if (route === '/reconcile/commit' && method === 'POST') {
    const body = await readJson(req);
    if (!body.ok) {
      sendJson(res, body.status, { ok: false, error: body.error });
      return;
    }
    sendEnvelope(res, await runCore(options, 'reconcile-commit', [], /** @type {Record<string, unknown>} */ (body.value)));
    return;
  }
  if (route === '/reconcile/history' && method === 'GET') {
    const account = url.searchParams.get('account');
    const limit = url.searchParams.get('limit') ?? '50';
    const extraArgs = [];
    if (account) extraArgs.push('--account', account);
    extraArgs.push('--limit', limit);
    sendEnvelope(res, await runCore(options, 'reconcile-history', extraArgs));
    return;
  }
  if (route === '/balance' && method === 'POST') {
    const body = await readJson(req);
    if (!body.ok) {
      sendJson(res, body.status, { ok: false, error: body.error });
      return;
    }
    const value = /** @type {Record<string, unknown>} */ (body.value);
    const payload = {
      account: requireString(value.account, 'account'),
      amount: requireString(value.amount, 'amount'),
      currency: optionalString(value.currency),
      date: optionalString(value.date),
      note: optionalString(value.note),
    };
    sendEnvelope(res, await runCore(options, 'balance', [], payload));
    return;
  }
  if (route === '/metadata' && method === 'POST') {
    const body = await readJson(req);
    if (!body.ok) {
      sendJson(res, body.status, { ok: false, error: body.error });
      return;
    }
    const value = /** @type {Record<string, unknown>} */ (body.value);
    const payload = { account: requireString(value.account, 'account') };
    if (value.clear_alias === true) payload.alias = null;
    else if (Object.hasOwn(value, 'alias')) payload.alias = value.alias;
    if (Object.hasOwn(value, 'reconcile')) payload.reconcile = value.reconcile;
    sendEnvelope(res, await runCore(options, 'metadata', [], payload));
    return;
  }
  if (route === '/draft/approve' && method === 'POST') {
    const body = await readJson(req);
    if (!body.ok) {
      sendJson(res, body.status, { ok: false, error: body.error });
      return;
    }
    const value = /** @type {Record<string, unknown>} */ (body.value);
    const payload = {
      id: requireString(value.id, 'id'),
      actor: 'panel',
    };
    if (Array.isArray(value.postings)) payload.postings = value.postings;
    sendEnvelope(res, await runCore(options, 'approve-draft', [], payload));
    return;
  }
  if (route === '/draft/update' && method === 'POST') {
    const body = await readJson(req);
    if (!body.ok) {
      sendJson(res, body.status, { ok: false, error: body.error });
      return;
    }
    const value = /** @type {Record<string, unknown>} */ (body.value);
    const payload = {
      id: requireString(value.id, 'id'),
      actor: 'panel',
    };
    if (Object.hasOwn(value, 'narration')) {
      if (typeof value.narration !== 'string') throw new Error('narration must be a string');
      payload.narration = value.narration;
    }
    if (Array.isArray(value.postings)) payload.postings = value.postings;
    sendEnvelope(res, await runCore(options, 'update-draft', [], payload));
    return;
  }
  if (route === '/operation/approve-all' && method === 'POST') {
    sendEnvelope(res, await runCore(options, 'op-approve-all', [], {}));
    return;
  }
  if (route === '/draft/approve-all' && method === 'POST') {
    sendEnvelope(res, await runCore(options, 'approve-all-drafts', [], {}));
    return;
  }
  if (route === '/operation/approve' && method === 'POST') {
    const body = await readJson(req);
    if (!body.ok) {
      sendJson(res, body.status, { ok: false, error: body.error });
      return;
    }
    const value = /** @type {Record<string, unknown>} */ (body.value);
    sendEnvelope(res, await runCore(options, 'op-approve', [], { id: requireString(value.id, 'id'), actor: 'panel' }));
    return;
  }
  if (route === '/operation/reject' && method === 'POST') {
    const body = await readJson(req);
    if (!body.ok) {
      sendJson(res, body.status, { ok: false, error: body.error });
      return;
    }
    const value = /** @type {Record<string, unknown>} */ (body.value);
    sendEnvelope(res, await runCore(options, 'op-reject', [], {
      id: requireString(value.id, 'id'),
      reason: optionalString(value.reason) ?? '',
      actor: 'panel',
    }));
    return;
  }
  if (route === '/draft/reject' && method === 'POST') {
    const body = await readJson(req);
    if (!body.ok) {
      sendJson(res, body.status, { ok: false, error: body.error });
      return;
    }
    const value = /** @type {Record<string, unknown>} */ (body.value);
    sendEnvelope(
      res,
      await runCore(options, 'reject-draft', [], {
        id: requireString(value.id, 'id'),
        reason: optionalString(value.reason) ?? '',
        actor: 'panel',
      }),
    );
    return;
  }

  if (route === '/batches' && method === 'GET') {
    sendEnvelope(res, await runCore(options, 'list-batches', ['--limit', '50'], {}));
    return;
  }
  if (route === '/draft/approve-batch' && method === 'POST') {
    const body = await readJson(req);
    if (!body.ok) {
      sendJson(res, body.status, { ok: false, error: body.error });
      return;
    }
    const value = /** @type {Record<string, unknown>} */ (body.value);
    const args = [];
    if (typeof value.batch === 'string' && value.batch !== '') args.push('--batch', value.batch);
    else if (typeof value.ref === 'string' && value.ref !== '') args.push('--ref', value.ref);
    else {
      sendJson(res, 400, { ok: false, error: { code: 'invalid_argument', message: 'batch or ref is required' } });
      return;
    }
    sendEnvelope(res, await runCore(options, 'approve-batch', args, {}));
    return;
  }
  if (route === '/batch/reject' && method === 'POST') {
    const body = await readJson(req);
    if (!body.ok) {
      sendJson(res, body.status, { ok: false, error: body.error });
      return;
    }
    const value = /** @type {Record<string, unknown>} */ (body.value);
    const args = ['--batch', requireString(value.id, 'id')];
    const reason = optionalString(value.reason);
    if (reason !== undefined) args.push('--reason', reason);
    sendEnvelope(res, await runCore(options, 'reject-batch', args, {}));
    return;
  }
  if (route === '/batch/void' && method === 'POST') {
    const body = await readJson(req);
    if (!body.ok) {
      sendJson(res, body.status, { ok: false, error: body.error });
      return;
    }
    const value = /** @type {Record<string, unknown>} */ (body.value);
    sendEnvelope(res, await runCore(options, 'void-batch', ['--batch', requireString(value.id, 'id')], {}));
    return;
  }
  const known = new Set(['/engine', '/engine/install', '/engine/core-upgrade', '/engine/core-rollback', '/health', '/setup', '/init', '/bootstrap', '/balances', '/balance', '/reconcile/preview', '/reconcile/commit', '/reconcile/history', '/metadata', '/draft/submit', '/draft/approve', '/draft/update', '/draft/reject', '/account/open', '/workspace', '/operation/approve', '/operation/reject', '/operation/approve-all', '/draft/approve-all', '/batches', '/draft/approve-batch', '/batch/reject', '/batch/void']);
  if (known.has(route)) {
    res.statusCode = 405;
    res.setHeader('allow', method === 'GET' ? 'POST' : 'GET');
    res.end();
    return;
  }
  sendJson(res, 404, { ok: false, error: { code: 'not_found', message: `unknown ledger route ${route}` } });
}

/**
 * Register the ledger root as a DSH workspace, idempotently by canonical path.
 *
 * The workspace record is the Host's own directory ledger, not ledger data: a
 * session started there simply runs in the ledger directory. Creation is
 * deliberately non-fatal for the caller — a profile without the optional
 * workspace subsystem still creates and reads ledgers, it just cannot list
 * them as workspaces.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @param {string} root absolute ledger root to register.
 * @param {string} [title] initial display title for a new record.
 * @returns {Promise<{ ok: true, created: boolean, workspace: { workspaceId: string, path: string, title: string } } | { ok: false, error: { code: string, message: string } }>} outcome.
 */
async function workspaceOutcome(ctx, root, title) {
  const registry = ctx.get('workspaceRegistry');
  if (registry === undefined || typeof registry.create !== 'function') {
    return {
      ok: false,
      error: { code: 'workspace_unavailable', message: 'the DSH workspace registry is not available in this profile' },
    };
  }
  try {
    const existing = typeof registry.resolveByPath === 'function' ? registry.resolveByPath(root) : undefined;
    const workspace = await registry.create(root, optionalString(title));
    return {
      ok: true,
      created: existing === undefined,
      workspace: { workspaceId: String(workspace.id), path: workspace.path, title: workspace.title },
    };
  } catch (error) {
    return {
      ok: false,
      error: { code: 'workspace_failed', message: error instanceof Error ? error.message : String(error) },
    };
  }
}

/**
 * Run one core CLI command and parse its JSON envelope.
 * @param {object} options bridge options.
 * @param {string} command core command.
 * @param {string[]} [extraArgs] positional arguments after the command.
 * @param {object} [payload] JSON written to stdin.
 * @returns {Promise<{ ok: true, value: any } | { ok: false, error: object }>} envelope.
 */
export function runCore(options, command, extraArgs = [], payload) {
  return new Promise((resolve) => {
    const runtime = runtimeFor(options);
    if (runtime === null) {
      resolve({
        ok: false,
        error: {
          code: 'engine_missing',
          message: 'the ledger engine is not installed yet; install it from the panel',
        },
      });
      return;
    }
    const args = [
      '-m',
      options.pythonModule,
      '--root',
      options.root,
      '--bean-file',
      options.beanFile,
      '--state-dir',
      options.stateDir,
      '--time-zone',
      options.timeZone,
      '--grace-days',
      String(options.graceDays),
      '--timeout',
      String(options.timeoutMs / 1000),
    ];
    if (options.beanCheck) args.push('--bean-check', options.beanCheck);
    else if (runtime.kind === 'managed') args.push('--bean-check', enginePaths(options).beanCheck);
    if (options.beanQuery) args.push('--bean-query', options.beanQuery);
    else if (runtime.kind === 'managed') args.push('--bean-query', enginePaths(options).beanQuery);
    args.push(command, ...extraArgs);

    const env = { ...process.env, PYTHONIOENCODING: 'utf-8' };
    if (runtime.envCorePath) {
      env.PYTHONPATH = runtime.envCorePath + (env.PYTHONPATH ? `${path.delimiter}${env.PYTHONPATH}` : '');
    }
    let child;
    try {
      child = spawn(runtime.pythonPath, args, {
        cwd: existsSync(options.root) ? options.root : options.corePath || process.cwd(),
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      });
    } catch (error) {
      resolve({
        ok: false,
        error: { code: 'core_unavailable', message: `cannot start ${runtime.pythonPath}: ${error.message}` },
      });
      return;
    }

    let stdout = '';
    let stderr = '';
    let settled = false;
    let timedOut = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill('SIGKILL');
      } catch {
        // The child may have exited between the check and the kill.
      }
    }, options.timeoutMs + 5_000);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      if (stdout.length < OUTPUT_LIMIT) stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      if (stderr.length < OUTPUT_LIMIT) stderr += chunk;
    });
    child.on('error', (error) => {
      finish({ ok: false, error: { code: 'core_unavailable', message: `cannot run the core: ${error.message}` } });
    });
    child.on('close', (code, signal) => {
      if (timedOut) {
        finish({ ok: false, error: { code: 'core_timeout', message: `the core timed out after ${options.timeoutMs} ms` } });
        return;
      }
      if (code !== 0 && stdout.trim() === '') {
        finish({
          ok: false,
          error: {
            code: 'core_unavailable',
            message: stderr.trim() || `the core exited with ${signal ?? code}`,
          },
        });
        return;
      }
      let envelope;
      try {
        envelope = JSON.parse(stdout);
      } catch {
        finish({
          ok: false,
          error: {
            code: 'core_protocol_error',
            message: stderr.trim() || 'the core did not print a JSON envelope',
          },
        });
        return;
      }
      if (envelope === null || typeof envelope !== 'object' || typeof envelope.ok !== 'boolean') {
        finish({ ok: false, error: { code: 'core_protocol_error', message: 'the core envelope has no ok flag' } });
        return;
      }
      if (envelope.ok === true) finish({ ok: true, value: envelope.value });
      else finish({ ok: false, error: envelope.error ?? { code: 'core_error', message: 'the core returned an error' } });
    });

    try {
      child.stdin.end(payload === undefined ? '' : JSON.stringify(payload));
    } catch {
      // The close/error handlers report the actual failure.
    }
  });
}

/**
 * Write one core envelope as a panel response.
 * @param {import('node:http').ServerResponse} res response.
 * @param {{ ok: true, value: any } | { ok: false, error: object }} envelope core envelope.
 * @returns {void}
 */
function sendEnvelope(res, envelope) {
  if (envelope.ok === true) {
    const value = envelope.value !== null && typeof envelope.value === 'object' ? envelope.value : {};
    sendJson(res, 200, { ok: true, ...value });
    return;
  }
  sendJson(res, 200, { ok: false, error: envelope.error });
}

/**
 * Run one engine action and answer with its status or a stable failure code.
 * @param {import('node:http').ServerResponse} res response.
 * @param {() => Promise<object>} action engine action.
 * @returns {Promise<void>}
 */
async function sendEngineAction(res, action) {
  try {
    sendJson(res, 200, { ok: true, ...(await action()) });
  } catch (error) {
    const failure = /** @type {Error & { code?: string, details?: object }} */ (error);
    sendJson(res, 200, {
      ok: false,
      error: {
        code: failure.code ?? 'engine_install_failed',
        message: failure.message,
        details: failure.details ?? {},
      },
    });
  }
}

/**
 * Reject a request that does not carry the same browser trust the GUI has.
 *
 * Two generations of the fence exist. Before DSH 0.2.2-rc.2 the panel had to
 * call `connection.requestRejection` itself; that method is gone, and the web
 * server now admits every route before its handler runs (`auth` defaults to
 * `required`) and passes the admitted Peer to the handler. Detecting which one
 * is mounted keeps this bridge working on both without re-running admission
 * that already happened.
 * @param {import('@deepseek-ai/cordis').Context} ctx Host context.
 * @param {import('node:http').IncomingMessage} req request.
 * @param {import('node:http').ServerResponse} res response.
 * @param {{ id?: string } | undefined} [peer] Peer the web server admitted.
 * @returns {boolean} true when the request was rejected.
 */
function rejectUntrusted(ctx, req, res, peer) {
  const connection = ctx.get('connection');
  if (connection === undefined) return false;
  if (typeof connection.requestRejection !== 'function') {
    if (peer !== undefined) return false;
    res.statusCode = 401;
    res.end();
    return true;
  }
  try {
    const rejection = connection.requestRejection(req);
    if (rejection === undefined) return false;
    res.statusCode = rejection;
    res.end();
    return true;
  } catch {
    res.statusCode = 403;
    res.end();
    return true;
  }
}

/**
 * Read a bounded JSON object body.
 * @param {import('node:http').IncomingMessage} req request.
 * @returns {Promise<{ ok: true, value: unknown } | { ok: false, status: number, error: object }>} parsed body.
 */
async function readJson(req) {
  const contentType = String(req.headers['content-type'] ?? '').split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    return { ok: false, status: 415, error: { code: 'unsupported_media_type', message: 'content-type must be application/json' } };
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > BODY_LIMIT) {
      req.resume();
      return { ok: false, status: 413, error: { code: 'payload_too_large', message: `request body exceeds ${BODY_LIMIT} bytes` } };
    }
    chunks.push(chunk);
  }
  let value;
  try {
    value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return { ok: false, status: 400, error: { code: 'bad_request', message: 'request body is not valid JSON' } };
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, status: 400, error: { code: 'bad_request', message: 'request body must be a JSON object' } };
  }
  return { ok: true, value };
}

/**
 * Write one JSON response.
 * @param {import('node:http').ServerResponse} res response.
 * @param {number} status status code.
 * @param {object} payload body.
 * @returns {void}
 */
function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(payload));
}

/**
 * Require a non-empty string field.
 * @param {unknown} value candidate.
 * @param {string} name field name.
 * @returns {string} the string.
 */
function requireString(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

/**
 * Accept an optional string field.
 * @param {unknown} value candidate.
 * @returns {string | undefined} the string, or undefined.
 */
function optionalString(value) {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}
