# ACTIVE

Status: **active** since 2026-11-17 for the MVP-0 vertical slice; reconciliation closed loop since 2026-11-18.

The panel now exposes:

- two views: 审核 (reconciliation + draft review) and 账户;
- 账户五类树 + 右侧详情表单；默认隐藏已关闭/隐式，新增账户弹窗;
- reconciliation preview/commit/update with allocations and directive preview;
- draft review is read-only in the panel; Core keeps `update-draft` for other clients;
- account creation via `account-open`;
- engine install includes `mcp`;
- ledger initialization is implemented by the plugin: it copies the
  `ledger-domain-assets` template, validates a staging tree, then renames it
  into place; the creation wizard asks for a name and picks a location through
  the host directory picker (default configured root, picked path remembered
  per configured root); picking an initialized folder opens it, and no main
  currency is asked for; the
  core's legacy `init` is not called;
- manual entry is downgraded to a secondary 补记 entry in the review view.

Still out: account close, BQL preset end-to-end test, month-end batch, reconcile revoke.

Design source: local Obsidian note `本地账本系统设计基线` (v0.25).
