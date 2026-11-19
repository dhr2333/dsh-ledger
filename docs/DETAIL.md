# 本地账本（dsh-ledger）

## 它是什么

`dsh-ledger` 是 DSH 的账本展示页，背后是独立的 Python 核心库 [`ledger-domain-core`](https://github.com/dhr2333/ledger-domain-core)。面板不含账本规则：它做三件事——注册「本地账本」入口、校验浏览器请求、执行 `python -m ledger_domain` 并把返回的 JSON 投影成页面。

账本本身是本地纯文本 Beancount：交易写 `trans/collect.bean`，对账写 `trans/reconciliation.bean`，`main.bean` / `account/*.bean` 是账户与结构配置。没有服务、数据库或账号。

## 适合谁

- 想用复式记账，但不想先学会计/科目/Beancount 语法的人；
- 愿意用 Agent 读账单、但不愿 Agent 直接改账本的人；
- 在意数据所有权，希望账本可读、可备份、可带走的人。

不适合：需要多币种、多人协作、手机 App、自动抓取银行流水，或完全不想审核的人。

## 三个入口

### 审核

- **待对账**：按账户 `open` 指令的 `reconcile` 周期列出到期/逾期/未对账的资产、负债账户；
- **待审核**：Agent 或补记产生的草稿，只读，只能批准或驳回；
- **补记**：次级入口，用于现金、转账、收入等没有来源的条目；保存后仍进入草稿队列，不会直接写账本。支出/收入的分类可选父账户或子账户，资产/负债的来源只列叶子账户。

### 对账

打开表单先调 `reconcile-preview`，显示预期余额、create/update 模式和上次对账。人只填**实际余额**，差额随输入即时计算；差额非 0 时才出现「差额分配」，默认 0 行、点「添加分配」才出现表格。没有分配或没分完时，Core 自动把剩余兜底到权益账户。

提交时面板内部先取最新预览，再带 `previewId` / `ledgerRevision` / `inputsHash` / `directivesHash` 提交。Core 重算、影子 `bean-check`、锁内原子写，返回文件/行号与 `nextDue`。

同一 `asOf` 再次提交是「更新最近一次」：替换 block，旧历史 `superseded`，更早期间不可改。对账后仍允许补记日期 ≤ `asOf` 的草稿：有 `pad` 时被吸收；没有 `pad` 时自动补一个；失败才提示用「更新最近一次」。

### 账户

- 五类树：Assets / Liabilities / Equity / Income / Expenses；
- 账户是否可记账取决于它有没有 `open` 指令，而不是有没有子账户：
  - 资产/负债/权益的父路径通常只是分组，不 `open`，因此不可选中、不可记账；只有叶子账户可编辑、可记账、可对账；
  - 支出/收入的父账户可以和子账户同时 `open`：父节点既能在树上选中记一笔，也能展开查看子账户；
- 资产/负债叶子显示**当前余额**（截至今天，只读，来自 `query-balances`）；余额为 0 的账户和支出/收入/权益不显示金额；带成本的持仓不显示（没有单一可比金额）；
- 别名就地编辑；资产/负债叶子可改对账周期，也可在详情内直接发起/更新对账；
- 资产/负债账户有子账户时禁用周期编辑，提示只有叶子可对账；支出/收入的父子关系不受此限制；
- 新增账户走弹窗（账户路径 + 别名），币种取账本运行币种，开立日取当天；
- 已关闭/隐式账户默认隐藏，可切换显示。

## 一次写入怎么走

```text
浏览器面板
  → POST /ledger-api/reconcile/commit（或 /draft/approve、/account/open）
  → 插件：会话校验 + JSON 形状校验
  → spawn python -m ledger_domain ...（stdin JSON）
  → 核心库：解析 → 重算 → 影子树 bean-check → 文件锁 → 原子追加/替换
  → stdout {"ok": true, "value": {...}}
  → 面板刷新 bootstrap
```

任何一步失败，核心库返回 `{"ok": false, "error": {code, message, details}}`；插件不改写、不重试、不兜底。

## 安装与引擎

插件市场（npm）安装即可：

```bash
dsh plugin --profile web add @dhr2333/dsh-ledger
```

发布包自带 Python 核心库（`vendor/core/ledger_domain`）和账本模板（`vendor/assets`），由 `prepack` 从 `ledger-domain-core` / `ledger-domain-assets` 复制生成；DSH 不会在安装后再去拉取其他仓库。首次打开时点一次「安装 / 修复账本引擎」即可。

开发时可以用一条命令安装源码（需要 git、pnpm）：

```bash
curl -fsSL https://raw.githubusercontent.com/dhr2333/dsh-ledger/main/scripts/install.sh | bash
```

它把三个仓库放到 `$DSH_HOME/ledger-domain-src/`，用 `dsh plugin add` 安装面板，并把 `@dhr2333/dsh-ledger` 选进 profile 的 bundle 列表。插件发现 `corePath` / `templatePath` 的顺序是：显式配置 → 环境变量 → 同级源码 checkout → 包内 `vendor/` → `$DSH_HOME/ledger-domain-src` → `$DSH_HOME`。

面板有两种引擎：

- **托管引擎（默认）**：在 `$DSH_HOME/ledger-engine` 建私有 venv，安装 `beancount`、`beanquery`、`mcp`，并把核心库复制进去（来源可以是源码 checkout，也可以是包内 `vendor/core`）；面板显示「安装 / 修复账本引擎」，一次点击完成。
- **外部引擎（开发机）**：配置 `pythonPath` 指向已有 venv，`corePath` 指向核心库源码；插件直接使用，不再安装。

核心库（源码 checkout 或包内副本）更新后，托管引擎会按内容指纹发现副本过期并提示修复；点一次「修复」即可。

## 初始化

`root` 没有 `main.bean` 时，面板显示创建向导：

1. 填账本名称；
2. 用宿主目录选择器选位置（默认配置的 `root`）；
3. 找 `ledger-domain-assets` 模板：`templatePath` → 插件同级 → 包内 `vendor/assets` → `corePath` 同级 → `$DSH_HOME/ledger-domain-src` → `$DSH_HOME`；
4. 复制到 staging，写入标题，跳过 `.git` / `.venv` / `.ledger`；
5. 真实 `bean-check` 通过后原子 rename 到 `root`，失败时目标零改动；
6. 成功后把账本目录登记为 DSH 工作区。

模板是 55 个账户的新布局：`main.bean` + `account/*.bean` + `trans/collect.bean` + `trans/reconciliation.bean` + `trans/main.bean` + `AGENTS.md`。已有 `main.bean` 的目录直接打开，不覆盖、不迁移。

## 数据与备份

```text
ledger/
├── main.bean
├── account/*.bean
├── trans/collect.bean
├── trans/reconciliation.bean
└── .ledger/              # 草稿、锁、审计、对账历史
```

- 账本真相只在 `.bean`；`.ledger/` 是运行态，可删，但会丢草稿与审计追溯。
- 可以用 Git；`.gitignore` 已排除 `.ledger/`，`trans/collect.bean` 与 `trans/reconciliation.bean` 必须跟踪。
- Core 不自动提交/推送，面板不提供提交、回滚、冲突处理。

## 边界与限制

- **唯一写者**：Core 写整个账本；插件不含账本规则，不直接写文件。
- **Agent 边界**：不注册 Agent 写工具；Agent 只能提交草稿/结构提案，批准由人触发。
- **无硬安全边界**：同 OS 用户 + 全 shell 下，Agent 仍可绕过 `AGENTS.md` 直接改文件。
- 默认单币种；多币种账户拒绝对账。
- 不内置账单解析/导入；由 Agent 完成。
- 不做多用户、移动端、月结批次、对账撤销。
- 对账漂移不主动告警；补记被 `pad` 吸收后，重看预期余额才能发现。
- POSIX 优先，Windows 未验证。

## 开发者附录

### HTTP 路由

面板只注册 `/ledger-api/*` 二十一条路由：

`engine` / `engine/install` / `health` / `setup` / `init` / `bootstrap` / `balances` / `balance` / `reconcile/preview` / `reconcile/commit` / `reconcile/history` / `metadata` / `account/open` / `draft/submit` / `draft/approve` / `draft/approve-all` / `draft/reject` / `operation/approve` / `operation/approve-all` / `operation/reject` / `workspace`。

### 配置

```yaml
# profile 的 cordis.patch.yml，id 与 bundle 行相同
- id: ledger-domain
  config:
    root: "/path/to/ledger"          # 默认 $DSH_HOME/ledger
    corePath: "/path/to/ledger-domain-core"   # 留空自动发现
    templatePath: "/path/to/ledger-domain-assets"  # 留空自动发现
    # pythonPath: "/path/to/ledger/.venv/bin/python"  # 外部引擎才需要
```

`beanCheck` / `beanQuery` 含 `/` 时相对 `root`；留空会回退到引擎 venv。`stateDir` 默认 `.ledger`。

### Core CLI

```bash
python -m ledger_domain --root /path/to/ledger status
python -m ledger_domain --root /path/to/ledger due
python -m ledger_domain --root /path/to/ledger reconcile-preview
python -m ledger_domain --root /path/to/ledger reconcile-commit
```

stdout 固定为 `{"ok": true, "value": ...}` 或 `{"ok": false, "error": {code, message, details}}`。

## 链接

- 仓库：<https://github.com/dhr2333/dsh-ledger>
- 核心库：<https://github.com/dhr2333/ledger-domain-core>
- 模板：<https://github.com/dhr2333/ledger-domain-assets>
- 使用说明：<https://github.com/dhr2333/dsh-ledger#readme>
- License：MIT
