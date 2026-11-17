# dsh-ledger-domain

**账本领域层的 DSH 展示页**。领域逻辑不在这里：它属于独立的 Python 核心库 [`ledger-domain-core`](../ledger-domain-core/README.md)。本插件只做三件事：

1. 在侧栏注册「账本」入口，渲染对账 / 审核 / 账户三个视图；
2. 对浏览器请求做 DSH 会话校验与形状校验；
3. 执行 `python -m ledger_domain ...`，把核心库返回的 JSON 原样投影成面板数据。

## 三个独立项目

| 项目 | 根目录 | 职责 |
|---|---|---|
| Python 核心库 | `/home/daihaorui/桌面/GitHub/ledger-domain-core` | 别名/周期治理、对账重建、草稿队列、校验后原子写入、查询投影 |
| 账本源 | `/home/daihaorui/桌面/GitHub/Assets` | 只存 `.bean`、单据和账本资源 |
| 本插件 | `/home/daihaorui/桌面/GitHub/dsh-ledger-domain` | 只做展示与 CLI 桥，不含领域逻辑 |

插件通过 `corePath + pythonPath` 找核心库。核心库对账本根目录只认 `--root`，不依赖 DSH。

## 账本引擎

普通用户不需要手动装 Python/Beancount。插件有两种引擎：

- **托管引擎（默认给新用户）**：在 `~/.dsh/ledger-engine` 建一个私有 venv，自动安装 `beancount` 与 `beanquery`，把核心库复制进去；面板显示「安装 / 修复账本引擎」，一次点击完成。首次需要网络与几分钟。
- **外部引擎（开发机）**：配置 `pythonPath` 指向已有账本 venv，`corePath` 指向核心库源码；插件直接使用，不再安装。

核心库源码更新后，托管引擎会显示为需要修复；点一次「修复」即可。引擎自检与安装日志都在面板里，不需要终端。

托管安装的前提：系统已有 Python 3.11+、首次安装能访问包索引、`corePath` 指向核心库源码。正式发行时应把核心库作为插件依赖或随包附带，普通用户就不用提供 `corePath`。

## 首次启动：从零创建账本

如果配置的 `root` 还没有 `main.bean`，面板显示创建向导：

- 填账本名称、主币种；
- 点「创建账本」→ 插件调用核心库 `init`；
- 核心库按 **Beancount-Trans-Assets 的目录约定和科目命名** 生成一份干净模板：`main.bean`、`account/*.bean`、当前年度 `YYYY/00.bean` + 12 个月、`trans/main.bean`、`document/`、`.gitignore`、`README.md`；
- 起步科目含现金、工资卡、支付宝、微信、信用卡、餐饮、交通、房租、购物、娱乐、医疗、其他支出、工资、其他收入、期初余额、调整；
- 生成后先在临时目录跑 `bean-check`，通过才 rename 到目标路径。

创建完成后可在「审核」页点「记一笔」手动记第一笔；AI 账单提案适配器之后直接调用核心库，不经过本插件。

## 面板

- **对账**：按 `open` 指令的 `reconcile` metadata 列出逾期/待办账户；提交申报余额，核心库做 `bean-check` 后原子写入，不一致时显示账本累计值与差异且零写入。
- **审核**：AI 或手动草稿由核心库入队；面板只负责选择未分类账户、可选把商户写成别名、批准或驳回。批准走核心库的完整门禁。
- **账户**：搜索账户，编辑别名与周期；隐式账户（`auto_accounts` 创建）只读。

## HTTP 契约

面板只注册 `/ledger-api/*` 十一条路由：

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
| `POST /ledger-api/draft/submit` | `submit-draft`（JSON stdin） |
| `POST /ledger-api/draft/approve` | `approve-draft`（JSON stdin） |
| `POST /ledger-api/draft/reject` | `reject-draft`（JSON stdin） |

核心库 stdout 固定为 `{"ok": true, "value": ...}` 或 `{"ok": false, "error": {...}}`；路由把 `value` 展开为面板响应。未认证请求由 DSH 的 `connection.requestRejection` 返回 401。

本插件**不注册任何 Agent 工具**。AI 提案/查询适配器应直接调用核心库或同一 CLI 契约，而不是经过面板路由。

## 配置

`cordis.patch.yml`：

| 键 | 含义 |
|---|---|
| `root` | 账本根目录（含 `main.bean`） |
| `corePath` | Python 核心库项目根（写入 `PYTHONPATH`） |
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
plugin_manager action=install_bundle target=/home/daihaorui/桌面/GitHub/dsh-ledger-domain
```

更新核心库不需要重装插件；插件每次请求都重新执行核心 CLI。更新插件代码后刷新页面即可（Host 桥接代码需要重载插件行或重启）。

## 已知限制

- 托管引擎首次安装需要网络（从包索引安装 `beancount` 与 `beanquery`）；装好后可离线使用。
- 新账本只能创建在空目录；如果 `root` 已有文件但没有 `main.bean`，创建会被核心库拒绝，需要把 `root` 指向空目录。
- 导入已有账本（目录选择、校验、接管）尚未实现；当前通过配置 `root` 指向已有账本。
- 本插件不缓存核心数据；每次请求起一个 Python 进程，账本很大时是秒级。
- 面板只做展示；所有业务错误都来自核心库的 `code/message/details`，插件不补充规则。
- 无 Agent 工具是刻意边界：模型要写账本，应直接调用核心库，并按核心库的草稿/审批契约走。
- `.ledger/` 是账本根下的运行态，已在账本源 `.gitignore`。

## CI

Jenkins Multibranch Pipeline，配置与本地等价命令见 [docs/CI.md](docs/CI.md)。
