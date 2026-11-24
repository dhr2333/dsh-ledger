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
  required: ['ref'],
};

const SKIPPED_SCHEMA = {
  type: 'array',
  description: 'rows deliberately not turned into drafts (closed orders, zero amounts, ...)',
  items: {
    type: 'object',
    additionalProperties: false,
    properties: {
      index: { type: 'integer', description: '0-based row index in the source' },
      reason: { type: 'string', description: 'why the row was skipped' },
      date: { type: 'string' },
      payee: { type: 'string' },
      amount: { type: 'string' },
    },
    required: ['index', 'reason'],
  },
};

const DRAFT_SOURCE_SCHEMA = {
  type: 'object',
  additionalProperties: true,
  properties: {
    kind: { type: 'string', description: 'ai | quickpath | manual | import | external' },
    ref: { type: 'string', description: 'bill or batch reference' },
    evidence: {
      type: 'object',
      additionalProperties: true,
      description:
        'the original bill row as column -> value (e.g. 交易时间 / 交易对方 / 商品说明 / 支付方式 / 交易状态); Core stores it in full and the panel shows it in the "only issues" review filter',
    },
  },
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
    'Read the configured local ledger: root, today, currency, accounts (canonical path, alias, open date, reconcile period), queue counts and the batch contract. Call this before proposing anything.',
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
          drafts: 'Each draft: {date, payee, narration, metadata?, source?, postings[]}. Always attach source.evidence with the original bill row (column -> value, e.g. 交易时间 / 交易对方 / 商品说明 / 支付方式 / 交易状态); Core stores it in full and the panel shows it in the "only issues" review filter. A posting is {account|suggested, role?: "category"|"funding", fallback?: "expense"|"income", amount, currency}.',
          unclassified: 'When the category is uncertain leave account null, set suggested to the bill label and role "category"; the panel falls back to Expenses:Uncategorized / Income:Uncategorized.',
          funding: 'A funding posting must resolve to exactly one existing Assets/Liabilities account. Missing: submit account-open; do not invent one. Ambiguous (several cards of one bank, or the bill names only the bank): do not guess, do not open a duplicate bank account, do not fall back; leave account null, set suggested to the bill label with role "funding", and report the candidate accounts to the human. One card = one leaf account: with several cards of one bank, put the last four digits in both the path and the alias (e.g. Assets:Savings:Bank:BOC0814, alias "中国银行 0814").',
          refunds: 'A partial refund is a negative expense: use role "category" and fallback "expense". An exact reversal of a closed order is skipped, not recorded.',
          approval: 'Tools only enqueue. Never call approve/reject; the human does that in the panel.',
        },
      };
    },
  );

  register(
    'ledger_queue',
    'Read the pending draft queue and pending structure operations. Use it to confirm what is waiting for human approval; it never approves anything.',
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
    'Submit one import batch: source metadata, skipped rows, drafts and optional structure operations. Returns a batch id plus per-draft results. Duplicate uuids are reported per item. This only enqueues; a human approves in the panel.',
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
          description: 'draft objects; see ledger_context.contract',
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
    'Submit structure operations (account-open, account-redate, account-metadata, balance) to the review queue. Use it when a batch needs a new bank/card account or an earlier account open date. This only enqueues; a human approves.',
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
