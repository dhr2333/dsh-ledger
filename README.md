# dsh-ledger

**本地 · 纯文本 · 复式**——DSH 里的账本面板：账本是一本标准复式账，只存在你自己的机器上，是能直接读、能备份、能带走的纯文本 Beancount。Agent 读账单、生成待确认记录；你只确认描述和资金账户，分类可以留空，到期核对余额。

- **本地**：没有服务、数据库或账号，账本只在你自己的目录里。
- **纯文本**：账本真相只在 `.bean` 文件；任何编辑器、Fava、Git 都能直接打开。
- **复式**：五类科目树、对账闭环、权益调整；每笔交易都是标准复式分录。
- **审核**：待对账、待审核、补记；草稿可改描述和资金账户，未分类不阻塞批准，批准时按金额归入 `Expenses:Uncategorized` / `Income:Uncategorized`。Agent 提供的 `time` / `uuid` / `status` 会写入条目 metadata。
- **批次**：Agent 一次导入是一个批次；审核页按批次汇总条数、跳过、覆盖校验、异常与涉及的资金账户，可整批批准/驳回；已批准批次可整批冲销（追加反向交易，不删除历史）。
- **为什么只改两项**：资金账户决定余额能否对上现实，描述决定条目能否被认出——这两项必须由人判断，且认知负荷最低。金额/日期是账单事实，分类/标签是解释层，交给 Agent 与兜底处理；每多一个输入框，面板就从判断面退回录入面。
- **对账**：只填实际余额；差额没分完记入权益调整；校验通过才写入，失败不改动账本。
- **账户**：Assets / Liabilities / Equity / Income / Expenses 五类树，只有最末级资产/负债账户可记账、可对账；分类是可选解释层，真实资产/负债 + 兜底账户才是可信核心。

完整用法见 [docs/DETAIL.md](docs/DETAIL.md)（随插件安装在面板内）。Agent 写入规则见账本根目录 `AGENTS.md`。

## 安装

### 插件市场（推荐）

```bash
dsh plugin --profile web add @dhr2333/dsh-ledger
```

发布包自带账本模板和引擎运行时，不需要再检出其他仓库，也不需要安装 Python。首次安装引擎完全离线；默认账本目录是 `$DSH_HOME/ledger`。

装好后打开「本地账本」，按面板提示点「安装 / 修复账本引擎」，再新建账本或打开已有 `main.bean` 的目录。

支持六个平台：`win32-x64`、`win32-arm64`（x64 运行时，Windows on ARM 模拟执行）、`darwin-x64`、`darwin-arm64`、`linux-x64`、`linux-arm64`。没有匹配运行时包时回退到系统 Python 3.11+（64 位）。

### 从源码安装（开发 / 排障）

需要 DSH、Python 3.11+、git、pnpm 和网络：

```bash
curl -fsSL https://raw.githubusercontent.com/dhr2333/dsh-ledger/main/scripts/install.sh | bash
```

它会：

1. 把 `beancount-guard`、`ledger-domain-assets`、`dsh-ledger` 放到 `$DSH_HOME/ledger-domain-src/`；
2. 用 `dsh plugin --profile web add` 把面板装进 profile；
3. 把 `@dhr2333/dsh-ledger` 选进 `dsh.profile.bundles`；
4. 刷新页面；没有 HMR 就重启 DSH。

| 参数 | 作用 |
|---|---|
| `--profile web` | 装到哪个 DSH profile（默认 `web`） |
| `--dir ~/ledger` | 源码目录（默认 `$DSH_HOME/ledger-domain-src`） |
| `--update` | 更新已有 checkout |
| `--dry-run` | 只打印命令，不改文件 |

插件发现源码时优先使用同级 checkout，所以改了 core / assets 立即生效；没有源码时才用包内副本。

## 仓库职责

- 本仓库只做面板：注册「本地账本」入口、校验浏览器请求、调用 `python -m beancount_guard`、把返回的 JSON 投影成页面。
- 账本规则在 [`beancount-guard`](https://github.com/dhr2333/beancount-guard)，模板在 [`ledger-domain-assets`](https://github.com/dhr2333/ledger-domain-assets)。
- 发布包通过 `vendor/` 自带账本模板；核心库是独立 PyPI 包 `beancount-guard`，由运行时 wheelhouse 离线安装，面板不持有核心源码副本。

## 引擎与路径

- **托管引擎（默认）**：优先使用平台运行时包自带的 CPython 3.12，把它复制到 `$DSH_HOME/ledger-engine/python`，再建私有 venv，用离线 wheelhouse 安装 `beancount`、`beanquery`、`mcp` 和 `beancount-guard`（核心的固定基线）。
- **系统 Python 兜底**：没有匹配的运行时包时，自动探测 `py -3` / `python` / `python3`（要求 3.11+、64 位），联网安装 wheel（核心装最新版，协议不兼容会拒绝）。
- **外部引擎（开发机）**：配置 `pythonPath` 指向已有 venv；该 venv 里 `pip install beancount-guard` 即可，`corePath` 只在需要直接跑核心源码时设置。

核心库 / 模板的查找顺序：显式配置 → 环境变量 → 同级源码 checkout → `$DSH_HOME/ledger-domain-src` → `$DSH_HOME`。托管引擎不读 `corePath`：它通过 pip 拥有唯一一份 `beancount-guard`。

## 核心版本与更新

核心有自己的发布线（PyPI `beancount-guard`），修复不必重新发插件：

- 面板打开时会检查一次 PyPI（12 小时缓存，2 秒超时，离线静默跳过），引擎状态里带 `core.version` / `core.latest`。
- 有新版本时面板显示「升级核心」，点击后在引擎 venv 里 `pip install --upgrade beancount-guard`；安装后校验 `health` 的 `protocol`，超出面板支持窗口会自动回滚到随包基线并提示更新插件。
- 「恢复随包版本」从运行时 wheelhouse 离线重装固定基线，不需要网络。
- 镜像/私有索引：`pypiIndex` 用于版本检查（JSON API），pip 侧沿用 `PIP_INDEX_URL`。

## 配置

```yaml
# profile 的 cordis.patch.yml，id 与 bundle 行相同
- id: ledger-domain
  config:
    root: "/path/to/ledger"          # 默认 $DSH_HOME/ledger
    # corePath: "/path/to/beancount-guard"  # 仅开发：让外部引擎直接跑核心源码
    templatePath: "/path/to/ledger-domain-assets"  # 留空自动发现
    # runtimePath: "/path/to/dsh-ledger-runtime-linux-x64"  # 显式指定运行时包（一般留空）
    # systemPython: "python3"        # 只在内置运行时缺失时用作兜底
    # pythonPath: "/path/to/ledger/.venv/bin/python"  # 外部引擎才需要
    # pypiIndex: "https://pypi.tuna.tsinghua.edu.cn/pypi"  # 仅用于核心版本检查
```

`beanCheck` / `beanQuery` 含 `/` 时相对 `root`；留空会回退到引擎 venv。`stateDir` 默认 `.ledger`。

## HTTP 路由

面板只注册 `/ledger-api/*` 二十八条路由：

`engine` / `engine/install` / `engine/core-upgrade` / `engine/core-rollback` / `health` / `setup` / `init` / `bootstrap` / `balances` / `balance` / `reconcile/preview` / `reconcile/commit` / `reconcile/history` / `metadata` / `account/open` / `draft/submit` / `draft/approve` / `draft/update` / `draft/approve-all` / `draft/reject` / `draft/approve-batch` / `batch/reject` / `batch/void` / `batches` / `operation/approve` / `operation/approve-all` / `operation/reject` / `workspace`。

## Agent 工具

插件注册四个**只提案**工具：`ledger_context` / `ledger_propose_batch` / `ledger_submit_operations` / `ledger_queue`。它们只能提交草稿与结构操作，不能批准或驳回；批准只在面板里。批次契约见账本根目录 `AGENTS.md`。

## Core CLI

```bash
python -m beancount_guard --root /path/to/ledger status
python -m beancount_guard --root /path/to/ledger due
python -m beancount_guard --root /path/to/ledger reconcile-preview
python -m beancount_guard --root /path/to/ledger reconcile-commit
python -m beancount_guard --root /path/to/ledger submit-batch < batch.json
python -m beancount_guard --root /path/to/ledger list-batches
python -m beancount_guard --root /path/to/ledger approve-batch --batch <id>
python -m beancount_guard --root /path/to/ledger reject-batch --batch <id>
python -m beancount_guard --root /path/to/ledger void-batch --batch <id>
```

stdout 固定为 `{"ok": true, "value": ...}` 或 `{"ok": false, "error": {code, message, details}}`。

## 写入路径

```text
浏览器面板
  → POST /ledger-api/...（会话校验 + JSON 形状校验）
  → spawn python -m beancount_guard ...（stdin JSON）
  → 核心库：解析 → 重算 → 影子树 bean-check → 文件锁 → 原子追加/替换
  → stdout {"ok": true, "value": {...}}
```

任何一步失败，核心库返回 `code/message/details`；插件不改写、不重试、不兜底。

## 数据与备份

```text
ledger/
├── main.bean
├── account/*.bean
├── trans/collect.bean          # 交易
├── trans/reconciliation.bean   # balance / pad
└── .ledger/                    # 草稿、批次、锁、审计、对账历史（运行态）
```

- 账本真相只在 `.bean`；`.ledger/` 可删，但会丢草稿和审计追溯。
- 备份整个账本目录最省事；只备份 `.bean` 也能被任何 Beancount 工具打开。
- 可以用 Git，但 Core 不会自动 `add/commit/push`。

## 开发与发布

- `npm run check` 做 bundle 静态检查。
- `npm run vendor` 把账本模板 checkout 复制进 `vendor/`（`prepack` 自动执行）；`npm run vendor:check` 检查副本是否落后。
- `npm run runtime:pack` 生成 `dist/packages/` 下的六个运行时包并做 tarball 产物校验；先发布运行时包，再发布主包，版本必须对齐。
- `npm run runtime:verify` 只跑产物校验：用 `npm pack` 重新打包每个运行时包并解包，确认解释器（`bin/python3` 可能是被 npm 剥离的符号链接）与 wheelhouse 都在。
- 发布前先更新同级的 core / assets，再 `npm publish`；`vendor/`、`dist/`、`.cache/` 不提交到 git。
- CI 配置与本地等价命令见 [docs/CI.md](docs/CI.md)。

## 边界

- Core 是唯一写者；插件不含账本规则，不直接写文件。
- Agent 只能提交草稿/结构提案，批准与冲销由人触发；同 OS 用户 + 全 shell 下仍可绕过 `AGENTS.md` 改文件。
- 批次只做整批批准/驳回/冲销；单条更正留给后续 `transaction-void`。冲销追加反向交易，不删除已写入条目。
- 面板只编辑草稿的描述和资金账户；金额、日期、分类、标签、分录结构、条目 metadata 都不在面板内编辑。
- 条目 metadata（`time` / `uuid` / `status`）由 Agent 在草稿中提供，由 Core 写入；只影响新条目，不回填历史。
- 未分类草稿首次批准时会按需创建 `Expenses:Uncategorized` / `Income:Uncategorized` 兜底账户。
- 默认单币种；不内置账单解析/导入；不做多用户、移动端、月结批次、对账撤销。
- 对账漂移不主动告警；市场安装不依赖系统 Python，源码安装与缺失运行时包时仍走系统 Python。

## License

MIT。
