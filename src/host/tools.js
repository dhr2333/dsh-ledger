/**
 * Agent-facing tools for the local ledger.
 *
 * Every tool is a thin wrapper over ``runCore``: it can only enqueue proposals
 * (drafts, structure operations) and read the queue. Approval stays in the
 * panel, exactly like the browser half. Tools never touch ``.bean`` files.
 */

import { runCore } from './routes.js';

const OBJECT_OUTPUT = {
  type: 'object',
  additionalProperties: true,
  properties: {},
};

const SOURCE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    kind: { type: 'string', description: 'import | manual | external | ai | quickpath' },
    ref: { type: 'string', description: 'human-readable batch name, e.g. 支付宝 20261016-20261116' },
    channel: { type: 'string', description: 'alipay | wechat | bank | other' },
    rows: { type: 'integer', description: 'number of rows the source file contained' },
    fileName: { type: 'string' },
    fileHash: { type: 'string', description: 'sha256 of the source file, e.g. sha256:...' },
  },
  required: ['ref', 'rows'],
};

const SKIPPED_SCHEMA = {
  type: 'array',
  description: 'rows deliberately not turned into drafts (closed orders, zero amounts, ...)',
  items: {
    type: 'object',
    additionalProperties: false,
    properties: {
      index: { type: 'integer', description: '0-based row index in the source' },
      reasonCode: {
        type: 'string',
        enum: ['closed', 'exact_refund', 'zero_amount', 'internal_transfer', 'interest', 'duplicate_source'],
        description: 'why the row produced no draft (closed set; companions are enforced by Core)',
      },
      reason: { type: 'string', description: 'human note; required when reasonCode is absent' },
      refundOf: { type: 'integer', description: 'row index of the original order, required for exact_refund' },
      refundOfUuid: { type: 'string', description: 'channel transaction id of the original order' },
      duplicateOf: { type: 'string', description: 'batch or file that already recorded this row' },
      date: { type: 'string' },
      payee: { type: 'string' },
      amount: { type: 'string' },
    },
    required: ['index'],
  },
};

const DRAFT_SOURCE_SCHEMA = {
  type: 'object',
  additionalProperties: true,
  properties: {
    kind: { type: 'string', description: 'ai | quickpath | manual | import | external' },
    ref: { type: 'string', description: 'bill or batch reference' },
    index: {
      type: 'integer',
      description:
        '0-based row index this draft owns in the source; together with skipped[].index it must cover 0..rows-1 exactly once',
    },
    evidence: {
      type: 'object',
      additionalProperties: true,
      description: 'original bill row as column -> value; stored in full and shown in review, never written to the ledger',
    },
  },
  required: ['index'],
};

/** Register the ledger tools on the host tools service. */
export function registerTools(ctx, options) {
  const tools = ctx.get('tools');
  if (tools === undefined) return;

  /**
   * @param {string} name
   * @param {string} description
   * @param {object} parameters
   * @param {(args: any) => Promise<object>} execute
   */
  const register = (name, description, parameters, execute) => {
    ctx.effect(
      () =>
        tools.register({
          name,
          description,
          parameters,
          output: {
            schema: OBJECT_OUTPUT,
            render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
          },
          execute: async (args) => execute(args ?? {}),
        }),
      `ledger-domain: ${name}`,
    );
  };

  register(
    'ledger_context',
    'Read the ledger root, currency, accounts and pending counts. Call before proposing.',
    { type: 'object', additionalProperties: false, properties: {} },
    async () => {
      const envelope = await runCore(options, 'bootstrap');
      if (!envelope.ok) return { ok: false, error: envelope.error };
      const value = envelope.value ?? {};
      return {
        ok: true,
        root: value.root,
        today: value.today,
        currency: value.operatingCurrency,
        accounts: (value.accounts ?? []).map((account) => ({
          account: account.account,
          name: account.name,
          alias: account.alias,
          openDate: account.openDate,
          period: account.period,
          closed: account.closed,
        })),
        queue: {
          drafts: value.drafts,
          draftsPending: (value.pendingDrafts ?? []).length,
          operations: value.operations,
          operationsPending: (value.pendingOperations ?? []).length,
          batches: (value.batches ?? []).length,
        },
        contract: {
          boundary:
            'You only propose. Approval, rejection and voiding happen in the panel; never edit .bean files or .ledger/.',
          workflow:
            'Declare EVERY attachment with ledger_declare_sources before parsing; one batch per file; call ledger_import_status before your final reply. uncoveredCount > 0 means a whole bill was dropped.',
          coverage:
            'Coverage is a row-index bijection: source.rows and every drafts[].source.index are required; drafts[].source.index + skipped[].index must cover 0..rows-1 exactly once. Core rejects duplicates, gaps and out-of-range indexes.',
          reference:
            'The full write contract is AGENTS.md at the ledger root: funding account rules, skipped reasonCodes, refunds, internal transfers, metadata and documents. Read it before proposing.',
        },
      };
    },
  );

  register(
    'ledger_declare_sources',
    'Declare every attachment of this session before parsing; returns sources still waiting for a batch. Records a checklist only.',
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        sources: {
          type: 'array',
          description: 'all files of this session; re-declaring the same file is idempotent',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              fileName: { type: 'string' },
              fileHash: { type: 'string', description: 'sha256 of the attachment, e.g. sha256:...' },
              rows: { type: 'integer', description: 'row count of the bill, excluding headers' },
              ref: { type: 'string', description: 'human-readable bill name' },
              channel: { type: 'string', description: 'alipay | wechat | bank | other' },
            },
          },
        },
      },
      required: ['sources'],
    },
    async (args) => {
      const envelope = await runCore(options, 'declare-sources', [], { sources: args.sources });
      if (!envelope.ok) return { ok: false, error: envelope.error };
      const value = envelope.value ?? {};
      return {
        ok: true,
        declaredCount: value.declaredCount ?? 0,
        uncoveredCount: value.uncoveredCount ?? 0,
        sources: value.sources ?? [],
        uncovered: value.uncovered ?? [],
      };
    },
  );

  register(
    'ledger_import_status',
    'List declared sources that still have no batch. Call before your final reply; read-only.',
    { type: 'object', additionalProperties: false, properties: {} },
    async () => {
      const envelope = await runCore(options, 'import-status');
      if (!envelope.ok) return { ok: false, error: envelope.error };
      const value = envelope.value ?? {};
      return {
        ok: true,
        declaredCount: value.declaredCount ?? 0,
        uncoveredCount: value.uncoveredCount ?? 0,
        uncovered: value.uncovered ?? [],
        undeclared: value.undeclared ?? [],
        sources: value.sources ?? [],
      };
    },
  );

  register(
    'ledger_queue',
    'Read pending drafts and structure operations. Read-only; it never approves.',
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        limit: { type: 'integer', description: 'maximum entries to return (default 50)' },
      },
    },
    async (args) => {
      const limit = Number.isInteger(args.limit) && args.limit > 0 ? args.limit : 50;
      const envelope = await runCore(options, 'bootstrap');
      if (!envelope.ok) return { ok: false, error: envelope.error };
      const value = envelope.value ?? {};
      return {
        ok: true,
        drafts: (value.pendingDrafts ?? []).slice(0, limit).map((draft) => ({
          id: draft.id,
          date: draft.date,
          payee: draft.payee,
          narration: draft.narration,
          batch: draft.batch ?? null,
          issues: (draft.issues ?? []).map((issue) => issue.code),
        })),
        operations: (value.pendingOperations ?? []).slice(0, limit).map((operation) => ({
          id: operation.id,
          kind: operation.kind,
          summary: operation.summary,
          issues: (operation.issues ?? []).map((issue) => issue.code),
        })),
        batches: (value.batches ?? []).slice(0, limit).map((batch) => ({
          id: batch.id,
          source: batch.source,
          status: batch.status,
          countsByStatus: batch.countsByStatus,
          coverage: batch.coverage,
        })),
      };
    },
  );

  register(
    'ledger_propose_batch',
    'Submit one import batch (source, skipped rows, drafts, optional operations). Enqueues only; a human approves in the panel.',
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        source: SOURCE_SCHEMA,
        claimed: {
          type: 'object',
          additionalProperties: false,
          properties: {
            net: { type: 'string', description: 'net spend claimed by the bill, e.g. 9084.32' },
            currency: { type: 'string' },
          },
        },
        skipped: SKIPPED_SCHEMA,
        drafts: {
          type: 'array',
          description: 'draft objects; see AGENTS.md',
          items: {
            type: 'object',
            additionalProperties: true,
            properties: {
              source: DRAFT_SOURCE_SCHEMA,
            },
          },
        },
        operations: {
          type: 'array',
          description: 'optional structure operations, e.g. account-open / account-redate',
          items: { type: 'object', additionalProperties: true, properties: {} },
        },
      },
      required: ['source', 'drafts'],
    },
    async (args) => {
      const envelope = await runCore(options, 'submit-batch', [], {
        source: args.source,
        claimed: args.claimed,
        skipped: args.skipped ?? [],
        drafts: args.drafts,
      });
      if (!envelope.ok) return { ok: false, error: envelope.error };
      const batch = envelope.value?.batch ?? {};
      const operations = [];
      for (const operation of Array.isArray(args.operations) ? args.operations : []) {
        const submitted = await runCore(options, 'op-submit', [], operation);
        operations.push(
          submitted.ok
            ? { ok: true, id: submitted.value?.operation?.id, summary: submitted.value?.operation?.summary }
            : { ok: false, error: submitted.error },
        );
      }
      return {
        ok: true,
        batchId: batch.id,
        counts: batch.counts,
        coverage: {
          rows: batch.source?.rows ?? null,
          covered:
            (batch.counts?.drafts ?? 0) +
            (batch.counts?.skipped ?? 0) +
            (batch.counts?.duplicates ?? 0) +
            (batch.counts?.failed ?? 0),
        },
        items: envelope.value?.items ?? [],
        operations,
      };
    },
  );

  register(
    'ledger_submit_operations',
    'Submit standalone structure operations (account-open / account-redate / account-metadata / balance). Enqueues only.',
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        operations: {
          type: 'array',
          items: { type: 'object', additionalProperties: true, properties: {} },
        },
      },
      required: ['operations'],
    },
    async (args) => {
      const results = [];
      for (const operation of Array.isArray(args.operations) ? args.operations : []) {
        const submitted = await runCore(options, 'op-submit', [], operation);
        results.push(
          submitted.ok
            ? { ok: true, id: submitted.value?.operation?.id, summary: submitted.value?.operation?.summary }
            : { ok: false, error: submitted.error },
        );
      }
      return { ok: results.every((result) => result.ok), operations: results };
    },
  );
}
