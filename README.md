# dsh-ledger

DSH 账本面板的维护者参考与兜底说明。用户使用说明见 [docs/DETAIL.md](docs/DETAIL.md)；Agent 写入规则见账本根目录 `AGENTS.md`。

## 仓库职责

- 本仓库只做面板：注册「本地账本」入口、校验浏览器请求、调用 `python -m ledger_domain`、把返回的 JSON 投影成页面。
- 账本规则在 [`ledger-domain-core`](https://github.com/dhr2333/ledger-domain-core)，模板在 [`ledger-domain-assets`](https://github.com/dhr2333/ledger-domain-assets)。
- 发布包通过 `vendor/` 自带核心库和模板；面板不注册 Agent 写工具。

## 安装

### 插件市场

```bash
dsh plugin --profile web add @dhr2333/dsh-ledger
```

发布包自带核心库、账本模板和引擎运行时，不需要再检出其他仓库，也不需要安装 Python。首次安装引擎完全离线；默认账本目录是 `$DSH_HOME/ledger`。

支持六个平台：`win32-x64`、`win32-arm64`（x64 运行时，Windows on ARM 模拟执行）、`darwin-x64`、`darwin-arm64`、`linux-x64`、`linux-arm64`。没有匹配运行时包时回退到系统 Python 3.11+（64 位）。

### 从源码安装

需要 DSH、Python 3.11+、git、pnpm 和网络：

```bash
curl -fsSL https://raw.githubusercontent.com/dhr2333/dsh-ledger/main/scripts/install.sh | bash
```

它会：

1. 把 `ledger-domain-core`、`ledger-domain-assets`、`dsh-ledger` 放到 `$DSH_HOME/ledger-domain-src/`；
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

## 引擎与路径

- **托管引擎（默认）**：优先使用平台运行时包自带的 CPython 3.12，把它复制到 `$DSH_HOME/ledger-engine/python`，再建私有 venv，用离线 wheelhouse 安装 `beancount`、`beanquery`、`mcp`；核心库复制进 site-packages，更新后按内容指纹提示修复。
- **系统 Python 兜底**：没有匹配的运行时包时，自动探测 `py -3` / `python` / `python3`（要求 3.11+、64 位），联网安装 wheel。
- **外部引擎（开发机）**：配置 `pythonPath` 指向已有 venv，`corePath` 指向核心库源码。

核心库 / 模板的查找顺序：显式配置 → 环境变量 → 同级源码 checkout → 包内 `vendor/` → `$DSH_HOME/ledger-domain-src` → `$DSH_HOME`。

## 配置

```yaml
# profile 的 cordis.patch.yml，id 与 bundle 行相同
- id: ledger-domain
  config:
    root: "/path/to/ledger"          # 默认 $DSH_HOME/ledger
    corePath: "/path/to/ledger-domain-core"   # 留空自动发现
    templatePath: "/path/to/ledger-domain-assets"  # 留空自动发现
    # runtimePath: "/path/to/dsh-ledger-runtime-linux-x64"  # 显式指定运行时包（一般留空）
    # systemPython: "python3"        # 只在内置运行时缺失时用作兜底
    # pythonPath: "/path/to/ledger/.venv/bin/python"  # 外部引擎才需要
```

`beanCheck` / `beanQuery` 含 `/` 时相对 `root`；留空会回退到引擎 venv。`stateDir` 默认 `.ledger`。

## HTTP 路由

面板只注册 `/ledger-api/*` 二十一条路由：

`engine` / `engine/install` / `health` / `setup` / `init` / `bootstrap` / `balances` / `balance` / `reconcile/preview` / `reconcile/commit` / `reconcile/history` / `metadata` / `account/open` / `draft/submit` / `draft/approve` / `draft/approve-all` / `draft/reject` / `operation/approve` / `operation/approve-all` / `operation/reject` / `workspace`。

## Core CLI

```bash
python -m ledger_domain --root /path/to/ledger status
python -m ledger_domain --root /path/to/ledger due
python -m ledger_domain --root /path/to/ledger reconcile-preview
python -m ledger_domain --root /path/to/ledger reconcile-commit
```

stdout 固定为 `{"ok": true, "value": ...}` 或 `{"ok": false, "error": {code, message, details}}`。

## 写入路径

```text
浏览器面板
  → POST /ledger-api/...（会话校验 + JSON 形状校验）
  → spawn python -m ledger_domain ...（stdin JSON）
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
└── .ledger/                    # 草稿、锁、审计、对账历史（运行态）
```

- 账本真相只在 `.bean`；`.ledger/` 可删，但会丢草稿和审计追溯。
- 备份整个账本目录最省事；只备份 `.bean` 也能被任何 Beancount 工具打开。
- 可以用 Git，但 Core 不会自动 `add/commit/push`。

## 开发与发布

- `npm run check` 做 bundle 静态检查。
- `npm run vendor` 把两个源码 checkout 复制进 `vendor/`（`prepack` 自动执行）；`npm run vendor:check` 检查副本是否落后。
- `npm run runtime:pack` 生成 `dist/packages/` 下的六个运行时包；先发布运行时包，再发布主包，版本必须对齐。
- 发布前先更新同级的 core / assets，再 `npm publish`；`vendor/`、`dist/`、`.cache/` 不提交到 git。
- CI 配置与本地等价命令见 [docs/CI.md](docs/CI.md)。

## 边界

- Core 是唯一写者；插件不含账本规则，不直接写文件。
- Agent 只能提交草稿/结构提案，批准由人触发；同 OS 用户 + 全 shell 下仍可绕过 `AGENTS.md` 改文件。
- 默认单币种；不内置账单解析/导入；不做多用户、移动端、月结批次、对账撤销。
- 对账漂移不主动告警；市场安装不依赖系统 Python，源码安装与缺失运行时包时仍走系统 Python。

## License

MIT。
