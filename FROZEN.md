# ACTIVE

Status: **active** since 2026-11-17 for the MVP-0 vertical slice; reconciliation closed loop since 2026-11-18.

The panel now exposes:

- two views: 审核 (reconciliation + draft review) and 账户;
- 账户五类树 + 右侧详情表单；默认隐藏已关闭/隐式，新增账户弹窗;
- 资产/负债叶子显示当前余额（只读 `query-balances`；0 余额不显示）;
- reconciliation preview/commit/update with allocations and directive preview;
- draft review lets a person edit the description and the unique funding account only; these two directly determine trust and are the lowest-cognitive-load judgments, while amounts, dates, categories and entry metadata stay read-only; the default card shows the date with payee and description, the two postings with amounts, blocking issues and approve/reject, while the original bill row sits behind a Details disclosure; clicking the description or the funding account edits it in place, and the edit is saved when the field loses focus;
- unclassified postings no longer block approval: the panel rewrites them to `Expenses:Uncategorized` / `Income:Uncategorized` and creates either account with `account-open` when missing;
- entry metadata from Agent drafts (`time` / `uuid` / `status`) is rendered by Core into the ledger entry (requires core >= 0.1.2);
- manual entry asks for a funding account only (an asset, a liability, or `Equity:Adjustments` when the entry is an explicit adjustment); the category falls back automatically;
- import batches: a batch card shows source, status, counts, row coverage, skipped rows and batch actions; the human can approve/reject a whole batch and void an approved batch with appended reversing entries;
- Agent tools: `ledger_context` / `ledger_declare_sources` / `ledger_import_status` / `ledger_propose_batch` / `ledger_submit_operations` / `ledger_queue` are proposal-only; they never approve, reject or void;
- Batch coverage is a row-index bijection: `source.rows` and every `drafts[].source.index` are required, and `drafts[].source.index` + `skipped[].index` must cover `0..rows-1` exactly once; `skipped[].reasonCode` is a closed set;
- draft postings carry `role` (`category` / `funding`) and `fallback` (`expense` / `income`); an unresolved funding account blocks approval and is never rewritten to `Uncategorized`;
- `metadata.uuid` is an idempotency key checked against the ledger, not only the pending queue;
- operation cards show the full payload and "unblocks N drafts"; the reason is labelled as the proposal reason;
- account creation via `account-open`;
- engine install includes `mcp`;
- the market install ships a per-platform engine runtime (CPython 3.12 +
  offline wheelhouse), so Windows and macOS users do not install Python;
  supported platforms are win32-x64, win32-arm64 (x64 runtime under Windows on
  ARM emulation), darwin-x64, darwin-arm64, linux-x64 and linux-arm64;
  the managed engine copies the runtime into `$DSH_HOME/ledger-engine/python`
  and installs the wheelhouse with `pip --no-index`; a missing platform package
  falls back to a system Python 3.11+ (64-bit) with network access;
- ledger initialization is implemented by the plugin: it copies the
  `ledger-domain-assets` template, validates a staging tree, then renames it
  into place; the creation wizard asks for a name and picks a location through
  the host directory picker (default configured root, picked path remembered
  per configured root); picking an initialized folder opens it, and no main
  currency is asked for; the
  core's legacy `init` is not called;
- manual entry is downgraded to a secondary 补记 entry in the review view.

Still out: account close, BQL preset end-to-end test, month-end batch, reconcile revoke, single-entry `transaction-void` (batch void exists), batch partial void.

Design source: local Obsidian note `本地账本系统设计基线` (v0.26).
