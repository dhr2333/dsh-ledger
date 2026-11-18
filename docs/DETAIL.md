# 账本展示页（dsh-ledger-domain）

## 它是什么

这本 Beancount 账本的 **DSH 展示页**。账本核心是独立的 Python 项目 `ledger-domain-core`；插件本身没有账本语义，只负责页面、会话校验和 `python -m ledger_domain` 调用。

三个根目录互不包含：

```
~/ledger-domain/ledger-domain-core    Python 核心库（唯一的账本规则实现）
~/ledger-domain/ledger                账本源（只存 .bean 与账本资源）
~/ledger-domain/dsh-ledger-domain     本插件（只做展示与 CLI 桥）
```

## 一次写入怎么走

```text
浏览器面板
  → POST /ledger-api/reconcile/commit（或 /balance、/draft/approve）
  → 插件：connection.requestRejection + JSON 形状校验
  → spawn python -m ledger_domain ... reconcile-commit（stdin JSON）
  → 核心库：解析/别名解析 → 重算预览/hash → 影子树 bean-check → 文件锁 → 原子追加/替换
  → stdout {"ok": true, "value": {...}}
  → 面板刷新 bootstrap
```

任何一步失败，核心库返回 `{"ok": false, "error": {code, message, details}}`，插件不改写、不兜底、不重试。

## 账本引擎（P1）

插件启动先做引擎自检：

- 托管引擎：`~/.dsh/ledger-engine/venv`，自动安装 `beancount`、`beanquery`，并把核心库 `ledger_domain` 复制到 site-packages；核心源码变化时根据指纹标记为需要修复。
- 外部引擎：`pythonPath` + `corePath`，供开发机使用。

没有引擎时，面板显示「准备账本引擎」，一次点击安装/修复；不需要终端。安装失败会显示有界日志，便于直接看到 pip 错误。

当前托管安装要求系统 Python 3.11+、首次联网；`corePath` 留空时自动发现插件同级或 `$DSH_HOME/ledger-domain-src` 下的核心库。发行版应把核心库打包为插件依赖；真正零安装还需要把 Python/Beancount 一并打包成独立引擎。

## 首次启动（P0）

如果 `root` 没有 `main.bean`，面板显示创建向导，而不是错误页。初始化在插件侧实现（`src/host/init.js`），不再调用核心库的 legacy `init`：

1. 填账本名称，再用「选择目录…」通过宿主目录选择器决定账本位置（默认取配置的 `root`，位置只读展示，不能手填；宿主有原生选择器时弹系统对话框，否则打开面板内置目录浏览器，可逐级进入或新建文件夹）；
2. 解析 `ledger-domain-assets` 模板：`templatePath` → 插件同级 → `corePath` 同级 → `$DSH_HOME/ledger-domain-src` → `$DSH_HOME/ledger-domain-assets`；
3. 复制到所选位置同级的 staging 目录（跳过 `.git`、`.venv`、`.ledger`），写入 title / operating_currency（固定模板默认 CNY，向导不再询问主币种）；
4. 在 staging 执行真实 `bean-check`；
5. 通过后原子 rename 到 `root`，失败时目标零改动；随后登记 DSH 工作区。

确认创建的位置会记到 `$DSH_HOME/ledger-domain/active-roots.json`，按配置的 `root` 做键；重启后仍打开所选账本，改 profile 里的 `root` 则回到新配置。`/init` 也接受绝对路径的 `root`，相对路径会被拒绝。

模板使用新布局：`main.bean` + `account/*.bean` + `trans/collect.bean` + `trans/reconciliation.bean` + `trans/main.bean` + `AGENTS.md`，55 个账户。创建只接受空目录（或不存在）；所选位置已有 `main.bean` 时直接打开该账本并记住，指向非空但没有账本的目录仍会拒绝。

## 工作区

账本根目录就是 DSH 工作区目录：`POST /ledger-api/workspace` 调用 Host 的 `ctx.workspaceRegistry.create(root, title)`，按 `realpath` 幂等登记；已存在时返回同一条记录且 `created=false`。`init` 成功后会顺带登记一次。登记只影响 DSH 的工作区列表与会话默认 cwd，不改动账本文件；profile 未启用 workspace 子系统时接口返回 `workspace_unavailable`，账本功能不受影响。

## 面板

### 审核里的「记一笔」

已降级为审核页的次级「补记」入口：类型（支出/收入）、日期、商户、金额、分类账户、来源账户、备注。分类和来源不用原生 select，而是可搜索的弹窗选择，避免账户多时下拉卡住。面板按「上传账单文件让 Agent 提案 → 每天对账 → 按次补记」提示优先级；上传/解析仍由 Agent 在工作区完成，插件不解析账单。补记用于现金、转账、收入等没有来源的条目。保存只生成草稿，进入审核队列；点击批准才写入。

### 对账

周期来自账户 `open` 指令的 `reconcile` metadata；模板默认只给「余额宝」「零钱通」按天对账，其他账户不预置。负债账户的余额正常为负数，表单会在实际余额输入区提示这一点。有 balance 时 `nextDue = add_period(balance.date) - 1 天`，没有 balance 时立即进入审核页的待处理列表并显示「未对账」。面板打开表单先调 `reconcile-preview` 取预期余额、create/update 模式和上次对账；人只填实际余额，差额随输入即时计算（纯减法，权威值仍由核心重算）。只有差额非 0 时才展示「差额分配」区块（未填实际余额或差额为 0 时整块隐藏）；区块内默认 0 行、没有分配时不显示占位文案，点「添加分配」才出现表格；账户用可搜索弹窗选择，避免 60+ 账户的原生 select 卡住。

没有分配行、或分配后仍有剩余时，核心自动把差额 `pad` 到默认权益账户：首次对账为 `Equity:Opening-Balances`，之后为 `Equity:Adjustments`。表单不再展示兜底账户选择器和兜底差额字段；仅在无分配行且差额非 0 时提示「未分配差额自动计入 X」，在有分配行且未分完时提示「剩余 X 将由 X 自动吸收」。`actual`/分配行变化后 400ms debounce 后台重新预览；「确认对账」按钮内部先取最新预览再提交，用户不需要单独点预览。表单不展示截至日期、币种、指令原文和断言日期说明；对账日期默认取面板的今天，由 Core 用 `asOf` 与最近一次 block 比较决定 create/update，因此下一期可以正常推进。同一 `as_of` 再次提交走 update，替换最近一次 block，旧历史 `superseded`；如需对某个历史日补对，只能用 CLI 显式传 `asOf`。

对账后仍允许日期 ≤ `as_of` 的补记：有 pad 时 pad 吸收；没有 pad 时核心自动补 pad；自动补失败返回 `reconcile_update_required`，面板提示用「更新最近一次」处理。

### 审核

AI 草稿由核心库入队（`submit-draft`），面板读 `bootstrap` 的待审列表。DSH 面板把草稿当只读提案：不提供商户/备注编辑、账户解析或「审核即绑定」，`/draft/update` 路由也不再暴露；未解析账户的草稿只能驳回，让 Agent 修正后重新提案。核心库仍保留 `update-draft`（CLI/其他客户端可用）。批准时核心库重新校验平衡、账户状态、整本账，通过后才追加。

### 账户

按 `Assets / Liabilities / Equity / Income / Expenses` 五类展示树形结构；根节点和中间层是虚拟分组，点击叶子账户才打开右侧详情表单。树标签用别名；父分组没有 open/alias，使用内置的完整路径中文表做只读展示（如 `Assets:Savings:Bank`→银行），未命中时回退路径片段，完整路径放在 `title`。搜索匹配别名或规范路径，自动展开命中分支。

审核页的「待对账」列表每行只展示账户别名、科目路径和对账按钮，不显示状态徽标、对账周期、最近断言、下次到期，也不显示分区标题上的计数。

右侧详情只保留账户名/路径、类型徽标和对账入口，不再展示类型、开立日、币种、文件:行、最近断言、下次到期、覆盖至、状态等只读字段；币种仅在非主币种或多币种时附加在路径后，文件:行与开立日放入路径的 `title`。**别名直接在详情首行就地编辑**：平时是加粗的标题文字，不显示输入框或虚线下划线；点击后变成无边框内联输入（只有编辑时有一条下划线），回车或失焦结束编辑、Esc 撤销，保存仍走底部按钮。下方只剩对账周期（非资产/负债不显示）与保存/取消，不再显示「编辑」小标题；没有待保存修改时，非资产/负债账户连这一行也不显示。资产/负债叶子账户在详情里可直接发起或更新对账，对账编辑器内嵌在详情下方，不再必须先去「审核」页。保存只写真正变化的字段，不会在只改别名时顺手写入 `reconcile: "none"`。

已关闭和隐式账户默认隐藏，工具栏的「显示已隐藏」可展开；搜索时隐藏账户命中会临时显示并打标。隐式账户（只有交易/Balance、没有 `open`）元数据只读；有子账户的账户禁用周期编辑，提示只有叶子账户可对账。

新增账户改为弹窗，只填账户路径和别名；币种取账本运行币种，开立日取当天，对账周期不预置。别名清空后点保存会弹确认，确认才发 `clear_alias`；没有独立的「清空别名」按钮。父分组中文名只读，不写回账本；需要新增父级中文时改 `client.js` 的路径表。

## HTTP 路由

`engine` / `engine/install` / `health` / `setup` / `init` / `bootstrap` / `balance` / `reconcile/preview` / `reconcile/commit` / `reconcile/history` / `metadata` / `account/open` / `draft/submit` / `draft/approve` / `draft/approve-all` / `draft/reject` / `operation/approve` / `operation/approve-all` / `operation/reject` / `workspace`。`setup` 判断是否已有 `main.bean`；`init` 创建新账本；`draft/submit` 接收手动或外部草稿。未认证请求由 `connection.requestRejection` 返回 401。

## 配置

见 `cordis.patch.yml`。最关键三项：

```yaml
# profile 的 cordis.patch.yml，id 与 bundle 行相同
config:
  root: "/path/to/ledger"          # 默认 $DSH_HOME/ledger
  corePath: "/path/to/ledger-domain-core"  # 留空则自动发现插件同级或标准安装目录
  # pythonPath: "/path/to/ledger/.venv/bin/python"  # 只在用外部引擎时配置
```

`beanCheck`/`beanQuery` 含 `/` 时相对 `root` 解析；留空优先用 `root/.venv/bin`。`stateDir` 指向账本根下的 `.ledger`，草稿、锁、审计都在那里。

## 边界

- **插件不含账本规则**：不解析 `.bean`、不做别名解析、不做周期计算、不写文件。
- **不注册 Agent 工具**：AI 适配器直接调用核心库或 CLI，不经过面板。
- **不引入服务**：没有常驻 Python 服务、没有 MCP、没有数据库；每次请求一个短生命周期进程。
- **不缓存核心数据**：面板每次从核心库读；缓存只可能在核心库内部按文件 mtime 失效。
- **错误只展示**：插件不把核心错误翻译成新规则；错误和 issue 按 core 返回的 code 映射本地化文案，未知 code 才回退到 core 的 message。

## 安装与刷新

```bash
curl -fsSL https://raw.githubusercontent.com/dhr2333/dsh-ledger-domain/main/scripts/install.sh | bash
```

安装脚本把三个 checkout 放进 `$DSH_HOME/ledger-domain-src`，执行 `dsh plugin --profile web add`，并把 bundle 选进 `dsh.profile.bundles`。插件按「插件同级 → `$DSH_HOME/ledger-domain-src` → `$DSH_HOME`」自动发现 `corePath` / `templatePath`，默认 `root` 是 `$DSH_HOME/ledger`。已有自定义布局仍可在 profile 覆盖路径。

改动**核心库**不需要重装插件（每次请求重新执行 CLI）。改动**插件 Host/Client 代码**后：Host 桥接需要通过插件管理禁用/启用该行或重启 DSH；浏览器需要刷新页面。

## 已知限制

- 每次请求起 Python 进程；大账本上是秒级。
- 托管引擎首次安装需要网络（`beancount` + `beanquery`）；之后离线可用。
- 引擎安装在 `~/.dsh/ledger-engine`，插件只删除自己的 `venv/` 与标记文件。
- 新账本只支持空目录；已有账本导入尚未实现，需要把 `root` 指向已有账本。
- 手动记账只支持支出/收入两分录，暂不支持拆分、多币种或手续费。
- 面板没有模型工具；模型写账本必须走核心库的草稿/审批接口。
- 无浏览器控制时无法做像素级视觉验收；本项目用槽位检查、无 DOM 渲染冒烟测试和 HTTP 路由测试覆盖。
- 交易/对账写入固定目标 `trans/collect.bean` / `trans/reconciliation.bean`；对账 update 原位替换最近一次 block。
