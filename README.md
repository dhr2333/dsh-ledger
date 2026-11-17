# dsh-ledger-domain

**账本领域层的 DSH 展示页**。领域逻辑不在这里：它属于独立的 Python 核心库 [`ledger-domain-core`](../ledger-domain-core/README.md)。本插件只做三件事：

1. 在侧栏注册「账本」入口，渲染「待办」（对账 + 审核）和「账户」两个视图；
2. 对浏览器请求做 DSH 会话校验与形状校验；
3. 执行 `python -m ledger_domain ...`，把核心库返回的 JSON 原样投影成面板数据。

## 三个独立项目

| 项目 | 目录 | 职责 |
|---|---|---|
| Python 核心库 | 独立仓库 `ledger-domain-core` | 别名/周期治理、对账重建、草稿队列、校验后原子写入、查询投影 |
| 账本源 | 任意目录，含 `main.bean` | 只存 `.bean`、单据和账本资源 |
| 本插件 | 本仓库 | 只做展示与 CLI 桥，不含领域逻辑 |

插件通过 `corePath + pythonPath` 找核心库。核心库对账本根目录只认 `--root`，不依赖 DSH。

## 账本引擎

普通用户不需要手动装 Python/Beancount。插件有两种引擎：

- **托管引擎（默认给新用户）**：在 `~/.dsh/ledger-engine` 建一个私有 venv，自动安装 `beancount`、`beanquery` 与 `mcp`，把核心库复制进去；面板显示「安装 / 修复账本引擎」，一次点击完成。首次需要网络与几分钟。
- **外部引擎（开发机）**：配置 `pythonPath` 指向已有账本 venv，`corePath` 指向核心库源码；插件直接使用，不再安装。

核心库源码更新后，托管引擎会显示为需要修复；点一次「修复」即可。引擎自检与安装日志都在面板里，不需要终端。

托管安装的前提：系统已有 Python 3.11+、首次安装能访问包索引、`corePath` 指向核心库源码。正式发行时应把核心库作为插件依赖或随包附带，普通用户就不用提供 `corePath`。

## 首次启动

MVP-0 **不在插件里创建账本**。`root` 必须先指向一份已有的 `ledger-domain-assets` 账本（或副本），面板才能工作；初始化后续由 DSH 实现，不在 MVP-0。

如果 `root` 还没有 `main.bean`，面板会提示未初始化，但不会调用核心库 `init`。当前保留的 `POST /ledger-api/init` 只是旧的兼容路由，不在 MVP-0 验收范围。

## 面板

- **待办**：
  - 对账：按 `open` 指令的 `reconcile` metadata 列出逾期/待办账户；提交申报余额，核心库做 `bean-check` 后原子写入。
  - 审核：草稿由核心库入队；可改商户/备注（`update-draft`）、选择未分类账户、可选把商户写成别名，批准或驳回。
- **账户**：搜索账户，编辑别名与周期；新增账户走 `account-open`；隐式账户（`auto_accounts` 创建）只读。

## HTTP 契约

面板只注册 `/ledger-api/*` 十三条路由：

| 路由 | 核心命令 |
|---|---|
| `GET /ledger-api/engine` | 引擎自检（托管/外部） |
| `POST /ledger-api/engine/install` | 安装/修复托管引擎 |
| `GET /ledger-api/health` | `health` |
| `GET /ledger-api/setup` | `setup`（是否已初始化） |
| `POST /ledger-api/init` | `init`（创建账本） |
| `GET /ledger-api/bootstrap` | `bootstrap` |
| `POST /ledger-api/balance` | `balance`（JSON stdin） |
| `POST /ledger-api/metadata` | `metadata`（JSON stdin） |
| `POST /ledger-api/account/open` | `account-open`（JSON stdin） |
| `POST /ledger-api/draft/submit` | `submit-draft`（JSON stdin） |
| `POST /ledger-api/draft/update` | `update-draft`（JSON stdin） |
| `POST /ledger-api/draft/approve` | `approve-draft`（JSON stdin） |
| `POST /ledger-api/draft/reject` | `reject-draft`（JSON stdin） |

核心库 stdout 固定为 `{"ok": true, "value": ...}` 或 `{"ok": false, "error": {...}}`；路由把 `value` 展开为面板响应。未认证请求由 DSH 的 `connection.requestRejection` 返回 401。

本插件**不注册任何 Agent 工具**。AI 提案/查询适配器应直接调用核心库或同一 CLI 契约，而不是经过面板路由。

## 配置

`cordis.patch.yml` 只随包携带默认行，不含任何机器路径；个人配置写在 profile 的 `cordis.patch.yml` 里，用相同的 `id: ledger-domain` 覆盖：

| 键 | 含义 |
|---|---|
| `root` | 账本根目录（含 `main.bean`）；默认 `$DSH_HOME/ledger` |
| `corePath` | Python 核心库项目根（写入 `PYTHONPATH`）。托管引擎安装前必须指向本机的 `ledger-domain-core`，否则面板报 `engine_source_missing` |
| `engineDir` | 托管引擎目录，默认 `$DSH_HOME/ledger-engine` |
| `systemPython` | 创建托管 venv 的解释器，默认 `python3` |
| `pythonPath` | 外部引擎解释器；留空则使用托管引擎 |
| `pythonModule` | 模块名，默认 `ledger_domain` |
| `beanFile` | 根账本文件，默认 `main.bean` |
| `stateDir` | 草稿/锁/审计目录，默认 `.ledger`（在账本根下） |
| `beanCheck` / `beanQuery` | 含 `/` 时相对 `root`；缺失时依次尝试 `root/.venv/bin`、解释器同目录、PATH |
| `timeZone` | 「今天」的时区，默认 `Asia/Shanghai` |
| `graceDays` | 到期后仍算「待办」的天数，默认 3 |
| `timeoutMs` | 单次核心调用超时，默认 120000 |

## 安装

```bash
plugin_manager action=install_bundle target=<本仓库的绝对路径>
```

更新核心库不需要重装插件；插件每次请求都重新执行核心 CLI。更新插件代码后刷新页面即可（Host 桥接代码需要重载插件行或重启）。

## 已知限制

- 托管引擎首次安装需要网络（从包索引安装 `beancount`、`beanquery`、`mcp`）；装好后可离线使用。
- MVP-0 不创建账本；需要先把 `root` 指向 `ledger-domain-assets` 的副本。
- 导入已有账本（目录选择、校验、接管）尚未实现；当前通过配置 `root` 指向已有账本。
- 本插件不缓存核心数据；每次请求起一个 Python 进程，账本很大时是秒级。
- 面板只做展示；所有业务错误都来自核心库的 `code/message/details`，插件不补充规则。
- 无 Agent 工具是刻意边界：模型要写账本，应直接调用核心库，并按核心库的草稿/审批契约走。
- `.ledger/` 是账本根下的运行态，已在账本源 `.gitignore`。

## CI

Jenkins Multibranch Pipeline，配置与本地等价命令见 [docs/CI.md](docs/CI.md)。
