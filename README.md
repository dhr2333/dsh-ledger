# dsh-ledger-domain

**账本的 DSH 展示页**。账本规则不在这里：它属于独立的 Python 核心库 [`ledger-domain-core`](../ledger-domain-core/README.md)。本插件只做三件事：

1. 在侧栏注册「账本」入口，渲染「审核」（对账 + 草稿审核）和「账户」两个视图；
2. 对浏览器请求做 DSH 会话校验与形状校验；
3. 执行 `python -m ledger_domain ...`，把核心库返回的 JSON 原样投影成面板数据。

## 三个独立项目

| 项目 | 目录 | 职责 |
|---|---|---|
| Python 核心库 | 独立仓库 `ledger-domain-core` | 别名/周期治理、对账重建、草稿队列、校验后原子写入、查询投影 |
| 账本源 | 任意目录，含 `main.bean` | 只存 `.bean` 和账本资源 |
| 本插件 | 本仓库 | 只做展示与 CLI 桥，不含账本规则 |

插件通过 `corePath + pythonPath` 找核心库。核心库对账本根目录只认 `--root`，不依赖 DSH。

## 账本引擎

普通用户不需要手动装 Python/Beancount。插件有两种引擎：

- **托管引擎（默认给新用户）**：在 `~/.dsh/ledger-engine` 建一个私有 venv，自动安装 `beancount`、`beanquery` 与 `mcp`，把核心库复制进去；面板显示「安装 / 修复账本引擎」，一次点击完成。首次需要网络与几分钟。
- **外部引擎（开发机）**：配置 `pythonPath` 指向已有账本 venv，`corePath` 指向核心库源码；插件直接使用，不再安装。

核心库源码更新后，托管引擎会显示为需要修复；点一次「修复」即可。引擎自检与安装日志都在面板里，不需要终端。

托管安装的前提：系统已有 Python 3.11+、首次安装能访问包索引、`corePath` 指向核心库源码。正式发行时应把核心库作为插件依赖或随包附带，普通用户就不用提供 `corePath`。

## 首次启动

`root` 还没有 `main.bean` 时，面板显示创建向导。向导只填名称，位置通过「选择目录…」由宿主目录选择器决定（默认取配置的 `root`，只读展示；无原生选择器时用面板内置目录浏览器）；创建成功后所选位置会记住，重启后仍打开它。初始化由本插件实现，不调用核心库的 legacy `init`：

1. 找 `ledger-domain-assets` 模板：`templatePath` → 插件同级目录 → `corePath` 同级目录 → `$DSH_HOME/ledger-domain-assets`；
2. 复制模板到所选位置同级的临时 staging 目录，写入账本名称（运行币种沿用模板默认 CNY），跳过 `.git`、`.venv`、`.ledger`；
3. 在 staging 里用真实 `bean-check` 校验；
4. 通过后才原子 rename 到 `root`，失败时目标目录零改动。

模板是 `ledger-domain-assets` 的新布局：`main.bean` + `account/*.bean` + `trans/collect.bean` + `trans/reconciliation.bean` + `trans/main.bean` + `AGENTS.md`，共 55 个账户。创建位置必须是空目录（或不存在）；选到已有 `main.bean` 的目录会直接打开该账本并记住，已有账本不会被覆盖。

## 面板

- **审核**：
  - 对账：按 `open` 指令的 `reconcile` metadata 列出逾期/待对账/未对账账户；面板预览预期余额与分配，提交后核心库做 `bean-check` 并原子写入；同一 `as_of` 可更新最近一次。
  - 审核：草稿由核心库入队；DSH 中草稿只读，只能批准或驳回。需要调整请驳回，让 Agent 修正后重新提案。
- **账户**：五类树形展示，父分组用内置中文路径表只读展示，叶子账户在右侧详情里编辑别名/周期；资产/负债叶子账户可在详情内直接发起或更新对账；默认隐藏已关闭/隐式账户，新增账户走弹窗（只填账户与别名）；有子账户的账户禁用周期编辑。

## HTTP 契约

面板只注册 `/ledger-api/*` 二十条路由：

| 路由 | 核心命令 |
|---|---|
| `GET /ledger-api/engine` | 引擎自检（托管/外部） |
| `POST /ledger-api/engine/install` | 安装/修复托管引擎 |
| `GET /ledger-api/health` | `health` |
| `GET /ledger-api/setup` | `setup`（是否已初始化） |
| `POST /ledger-api/init` | 插件初始化：复制模板 + `bean-check` + 原子落盘（新布局） |
| `GET /ledger-api/bootstrap` | `bootstrap` |
| `POST /ledger-api/balance` | `balance`（JSON stdin） |
| `POST /ledger-api/reconcile/preview` | `reconcile-preview`（JSON stdin） |
| `POST /ledger-api/reconcile/commit` | `reconcile-commit`（JSON stdin） |
| `GET /ledger-api/reconcile/history` | `reconcile-history` |
| `POST /ledger-api/metadata` | `metadata`（JSON stdin） |
| `POST /ledger-api/account/open` | `account-open`（JSON stdin） |
| `POST /ledger-api/draft/submit` | `submit-draft`（JSON stdin） |
| `POST /ledger-api/draft/approve` | `approve-draft`（JSON stdin） |
| `POST /ledger-api/operation/approve` | `op-approve`（Agent 提议的结构变更） |
| `POST /ledger-api/operation/reject` | `op-reject` |
| `POST /ledger-api/operation/approve-all` | `op-approve-all`（区块一键批准） |
| `POST /ledger-api/draft/approve-all` | `approve-all-drafts`（区块一键批准） |
| `POST /ledger-api/draft/reject` | `reject-draft`（JSON stdin） |
| `POST /ledger-api/workspace` | 把 `root` 登记为 DSH 工作区（幂等，按规范路径） |

创建账本（`init`）成功后，插件会顺手把账本根目录登记为 DSH 工作区，标题取账本名称；面板头部不再展示「新建工作区」入口。工作区只记录目录，不含账本数据；未安装 workspace 子系统的 profile 会返回 `workspace_unavailable`，不影响账本读写。

核心库 stdout 固定为 `{"ok": true, "value": ...}` 或 `{"ok": false, "error": {...}}`；路由把 `value` 展开为面板响应。未认证请求由 DSH 的 `connection.requestRejection` 返回 401。

本插件**不注册任何 Agent 工具**。AI 提案/查询适配器应直接调用核心库或同一 CLI 契约，而不是经过面板路由。

## 配置

`cordis.patch.yml` 只随包携带默认行，不含任何机器路径；个人配置写在 profile 的 `cordis.patch.yml` 里，用相同的 `id: ledger-domain` 覆盖：

| 键 | 含义 |
|---|---|
| `root` | 账本根目录（含 `main.bean`）；默认 `$DSH_HOME/ledger` |
| `corePath` | Python 核心库项目根（写入 `PYTHONPATH`）。默认自动发现插件同级或 `$DSH_HOME/ledger-domain-src` 下的 `ledger-domain-core`；自定义布局才需要写 |
| `engineDir` | 托管引擎目录，默认 `$DSH_HOME/ledger-engine` |
| `systemPython` | 创建托管 venv 的解释器，默认 `python3` |
| `pythonPath` | 外部引擎解释器；留空则使用托管引擎 |
| `templatePath` | `ledger-domain-assets` 模板目录；留空时按插件同级、`corePath` 同级、`$DSH_HOME/ledger-domain-src`、`$DSH_HOME` 依次查找 |
| `pythonModule` | 模块名，默认 `ledger_domain` |
| `beanFile` | 根账本文件，默认 `main.bean` |
| `stateDir` | 草稿/锁/审计目录，默认 `.ledger`（在账本根下） |
| `beanCheck` / `beanQuery` | 含 `/` 时相对 `root`；缺失时依次尝试 `root/.venv/bin`、解释器同目录、PATH |
| `timeZone` | 「今天」的时区，默认 `Asia/Shanghai` |
| `graceDays` | 到期后仍算待处理的天数，默认 3 |
| `timeoutMs` | 单次核心调用超时，默认 120000 |

## 安装

一条命令（需要 DSH、Python 3.11+、git、pnpm 和网络）：

```bash
curl -fsSL https://raw.githubusercontent.com/dhr2333/dsh-ledger-domain/main/scripts/install.sh | bash
```

它会：

1. 把 `ledger-domain-core`、`ledger-domain-assets`、`dsh-ledger-domain` 放到 `$DSH_HOME/ledger-domain-src/`；
2. 用 `dsh plugin --profile web add` 把面板装进 profile；
3. 把 `@local/dsh-ledger-domain` 选进 `dsh.profile.bundles`；
4. 刷新页面（没有 HMR 就重启 DSH）。

默认账本目录是 `$DSH_HOME/ledger`；插件会自动发现同目录的核心库和模板，不需要再写 `corePath` / `templatePath`。已有自定义布局仍可在 profile 的 `cordis.patch.yml` 覆盖。

常用参数：

| 参数 | 作用 |
|---|---|
| `--profile web` | 装到哪个 DSH profile（默认 `web`） |
| `--dir ~/ledger-domain` | 源码目录（默认 `$DSH_HOME/ledger-domain-src`） |
| `--update` | 更新已有 checkout |
| `--dry-run` | 只打印命令，不改文件 |
| `--skip-install` | 只拉源码，不动 profile |

从源码 checkout 运行时，直接 `bash scripts/install.sh`；已有布局会被复用。更新核心库不需要重装插件；更新插件代码后刷新页面（Host 桥接需要重载插件行或重启）。

## 已知限制

- 托管引擎首次安装需要网络（从包索引安装 `beancount`、`beanquery`、`mcp`）；装好后可离线使用。
- 创建向导只在空目录初始化模板；选到已有 `main.bean` 的目录时直接接管并记住，不做结构校验或迁移。
- 更复杂的已有账本导入（布局转换、路径映射）尚未实现。
- 本插件不缓存核心数据；每次请求起一个 Python 进程，账本很大时是秒级。
- 面板只做展示；所有业务错误都来自核心库的 `code/message/details`，插件不补充规则。
- 无 Agent 工具是刻意边界：模型要写账本，应直接调用核心库，并按核心库的草稿/审批契约走。
- `.ledger/` 是账本根下的运行态，已在账本源 `.gitignore`。

## CI

Jenkins Multibranch Pipeline，配置与本地等价命令见 [docs/CI.md](docs/CI.md)。
