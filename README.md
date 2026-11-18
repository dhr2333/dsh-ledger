# ledger

**把账单交给 AI，你只负责点批准和对账。**

`ledger` 是 DeepSeek Harness（DSH）的账本面板：AI 助手读账单、认商户、匹配分类，生成待确认记录；你在面板里批准或驳回，到期时核对一次余额。账本本身是**本地纯文本 Beancount**，可读、可备份、可带走。

它不是 SaaS，也不是“AI 自动记账”。

## 它解决什么问题

| 传统记账 | ledger |
|---|---|
| 先学会计、科目、借贷方向 | 分类交给 AI 助手，你只需要核对 |
| 记完流水就结束，月底对不上 | 到期对账：预期余额、实际余额、差额分配 |
| 数据在别人的数据库里 | 账本是本地文件，没有服务、没有账号 |
| AI 自动写账，错了也不知道 | AI 只能提案，写入必须过人，失败零写入 |

适合：试过记账但被科目/语法/坚持劝退的人；在意数据所有权的人；已经在 DSH 里工作、想让 AI 参与记账的人。

不适合：想完全自动、不愿花一分钟审核的人；需要多币种、多人协作、手机 App 或自动抓取银行流水的人。

## 安装

### 一条命令（推荐）

需要 DSH、Python 3.11+、git、pnpm 和网络：

```bash
curl -fsSL https://raw.githubusercontent.com/dhr2333/dsh-ledger-domain/main/scripts/install.sh | bash
```

它会：

1. 把 `ledger-domain-core`、`ledger-domain-assets`、`dsh-ledger-domain` 放到 `$DSH_HOME/ledger-domain-src/`；
2. 用 `dsh plugin --profile web add` 把面板装进 profile；
3. 把 `@dhr2333/ledger` 选进 `dsh.profile.bundles`；
4. 刷新页面（没有 HMR 就重启 DSH）。

默认账本目录是 `$DSH_HOME/ledger`。插件会自动发现同目录的核心库和模板，不需要再写 `corePath` / `templatePath`。

常用参数：

| 参数 | 作用 |
|---|---|
| `--profile web` | 装到哪个 DSH profile（默认 `web`） |
| `--dir ~/ledger` | 源码目录（默认 `$DSH_HOME/ledger-domain-src`） |
| `--update` | 更新已有 checkout |
| `--dry-run` | 只打印命令，不改文件 |

### npm 安装（高级）

面板已发布到 npm，但 **npm 包只包含面板，不包含 Python 核心库和账本模板**：

```bash
dsh plugin --profile web add @dhr2333/ledger
```

使用前需要已有 `ledger-domain-core` / `ledger-domain-assets`，并让插件能找到它们（默认在 `$DSH_HOME/ledger-domain-src/`）。普通用户请用上面的一条命令。

## 第一次打开

1. 侧栏打开「账本」；没有 `main.bean` 时显示创建向导；
2. 填账本名称，选一个空目录或新目录；
3. 面板复制 55 个账户的模板，跑真实 `bean-check`，通过后原子落盘；
4. 首次对账前，点「安装 / 修复账本引擎」准备 Python 运行时（`beancount`、`beanquery`、`mcp`）。

## 日常：两个动作

### 1. 账单交给 AI，你审核

- AI 助手读账单/对话，生成**待确认记录**（草稿）；
- 你在「审核」里逐条看：账户、金额、分类、备注；
- 批准后 Core 校验整本账并原子写入；驳回则让 AI 重新提案；
- 面板中的草稿是只读的：不能改，只能批准或驳回。

### 2. 到期对账，只填一个数

- 到期的资产/负债账户出现在「待对账」；
- 面板先算预期余额，你只填**实际余额**；
- 差额非 0 时，可以分配到真实科目（保留日期/标签/备注），剩下的才进权益兜底；
- 提交后 Core 重算、`bean-check`、原子写入，`nextDue` 自动推进。

对账不是锁：对账后仍可补记。有 `pad` 时由 `pad` 吸收；没有 `pad` 时自动补一个；失败才要求“更新最近一次”。

## 为什么可信

- **Core 是唯一写者**：面板不含账本规则，只做展示和 CLI 桥。
- **AI 没有写工具**：只能提交草稿/结构提案，批准由人触发。
- **写门禁**：影子树 `bean-check` → 写锁 → 原子替换；失败零写入。
- **无服务、无数据库、无账号**：每次请求起一个短生命周期 Python 进程。

## 数据在哪

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
- 可以用 Git，但 Core 不会自动 `add/commit/push`，提交节奏和冲突由你处理。

## 已知限制

- 默认单币种；多币种账户暂不对账。
- 不内置账单解析/导入；解析由 AI 助手完成。
- 不做多用户、移动端、月结批次、对账撤销。
- 对账漂移当前不主动告警；补记被 `pad` 吸收后，重看预期余额才能发现。
- 依赖 DSH；面板需要 Python 3.11+，首次安装引擎需要网络。
- POSIX 优先，Windows 未验证。

## 开发

- 本仓库只做 DSH 面板；领域逻辑在 [`ledger-domain-core`](https://github.com/dhr2333/ledger-domain-core)。
- 路由、配置、引擎与写入细节见 [docs/DETAIL.md](docs/DETAIL.md)。
- `npm run check` 做 bundle 静态检查。

## License

MIT。
