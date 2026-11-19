# 本地账本（dsh-ledger）

## 它是什么

`dsh-ledger` 是 DSH 的账本面板：Agent 读账单、生成待确认记录，你批准或驳回，到期核对余额。账本是本地纯文本 Beancount，可读、可备份、可带走。

交易写 `trans/collect.bean`，对账写 `trans/reconciliation.bean`，`main.bean` / `account/*.bean` 是账户与结构配置。没有服务、数据库或账号。

## 开始使用

在 DSH 插件市场搜索 `@dhr2333/dsh-ledger`，或执行：

```bash
dsh plugin --profile web add @dhr2333/dsh-ledger
```

首次打开时点「安装 / 修复账本引擎」，然后创建账本（填名称、选空目录），或直接打开已有 `main.bean` 的目录。

## 三个入口

### 审核

- **待对账**：按 `open` 指令的 `reconcile` 周期列出到期、逾期或未对账的资产/负债账户；
- **待审核**：Agent 或补记产生的草稿，只读，只能批准或驳回；
- **补记**：次级入口，用于现金、转账、收入等没有来源的条目；保存后仍进草稿队列。支出/收入分类可选父或子账户，资产/负债来源只列叶子。

### 对账

- 先取预览：预期余额、create/update 模式、上次对账；
- 你只填**实际余额**；差额非 0 时才出现「差额分配」，没分完的兜底到权益；
- 提交时带 `previewId` / `ledgerRevision` / `inputsHash` / `directivesHash`，Core 重算、影子 `bean-check`、锁内原子写；
- 同一 `asOf` 再次提交即「更新最近一次」，旧历史 `superseded`；更早期间不可改；
- 对账后仍可补记日期 ≤ `asOf` 的草稿：有 `pad` 时被吸收，没有时自动补一个。

### 账户

- 五类树：Assets / Liabilities / Equity / Income / Expenses；
- 能否记账取决于有没有 `open`：资产/负债父路径通常只是分组，只有叶子可编辑、可记账、可对账；支出/收入父子可同时 `open`；
- 资产/负债叶子显示当前余额（只读）；余额为 0、带成本持仓、支出/收入/权益不显示金额；
- 别名就地编辑；资产/负债叶子可改周期或在详情内对账，有子账户时禁用周期编辑；
- 新增账户走弹窗（路径 + 别名），币种取账本运行币种，开立日取当天。

## 写入如何保证安全

```text
浏览器面板
  → 会话校验 + JSON 形状校验
  → python -m ledger_domain
  → 解析 → 重算 → 影子树 bean-check → 文件锁 → 原子写入
```

任何一步失败，Core 返回错误，账本零改动；插件不改写、不重试、不兜底。

## 数据与备份

```text
ledger/
├── main.bean
├── account/*.bean
├── trans/collect.bean
├── trans/reconciliation.bean
└── .ledger/              # 草稿、锁、审计、对账历史
```

账本真相只在 `.bean`；`.ledger/` 可删，但会丢草稿与审计。Git 忽略 `.ledger/`、`.venv/`，交易与对账文件必须跟踪；Core 不自动提交。

## 边界与限制

- Core 是唯一写者；插件不含账本规则，不直接写文件。
- Agent 只能提交草稿/结构提案，批准由人触发；同 OS 用户 + 全 shell 下仍可绕过 `AGENTS.md` 改文件。
- 默认单币种；多币种账户不对账。
- 不内置账单解析/导入，解析由 Agent 完成。
- 不做多用户、移动端、月结批次、对账撤销；对账漂移不主动告警。
