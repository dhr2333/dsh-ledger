# 账本领域层（dsh-ledger-domain）

## 它是什么

这本 Beancount 账本的 **DSH 展示页**。领域核心是独立的 Python 项目 `ledger-domain-core`；插件本身没有账本语义，只负责页面、会话校验和 `python -m ledger_domain` 调用。

三个根目录互不包含：

```
~/桌面/GitHub/ledger-domain-core    Python 核心库（唯一的领域实现）
~/桌面/GitHub/Assets                账本源（只存 .bean 与单据）
~/桌面/GitHub/dsh-ledger-domain     本插件（只做展示与 CLI 桥）
```

## 一次写入怎么走

```
浏览器面板
  → POST /ledger-api/balance
  → 插件：connection.requestRejection + JSON 形状校验
  → spawn python -m ledger_domain ... balance（stdin JSON）
  → 核心库：解析/别名解析 → 影子树 bean-check → 文件锁 → 原子追加
  → stdout {"ok": true, "value": {...}}
  → 面板刷新 bootstrap
```

任何一步失败，核心库返回 `{"ok": false, "error": {code, message, details}}`，插件不改写、不兜底、不重试。

## 账本引擎（P1）

插件启动先做引擎自检：

- 托管引擎：`~/.dsh/ledger-engine/venv`，自动安装 `beancount`、`beanquery`，并把核心库 `ledger_domain` 复制到 site-packages；核心源码变化时根据指纹标记为需要修复。
- 外部引擎：`pythonPath` + `corePath`，供开发机使用。

没有引擎时，面板显示「准备账本引擎」，一次点击安装/修复；不需要终端。安装失败会显示有界日志，便于直接看到 pip 错误。

当前托管安装要求系统 Python 3.11+、首次联网、`corePath` 指向核心库源码；发行版应把核心库打包为插件依赖。真正零安装还需要把 Python/Beancount 一并打包成独立引擎。

## 首次启动（P0）

如果 `root` 没有 `main.bean`，面板显示创建向导，而不是错误页：

1. 填账本名称、主币种；
2. 核心库在临时目录生成模板（Beancount-Trans-Assets 的目录约定与科目命名），跑 `bean-check`；
3. 通过后 rename 到 `root`；
4. 面板刷新为正常的三个视图。

模板包含 16 个起步科目（现金、工资卡、支付宝、微信、信用卡、餐饮、交通、房租、购物、娱乐、医疗、其他支出、工资、其他收入、期初余额、调整），工资卡/信用卡默认按月对账。新账本只允许创建在空目录；导入已有账本是后续阶段。

## 面板

### 审核里的「记一笔」

「审核」页顶部可展开手动记账表单：类型（支出/收入）、日期、商户、金额、分类账户、来源账户、备注。保存只生成草稿，进入审核队列；点击批准才写入。AI 提案和手动记账共用同一个队列与同一道门禁。

### 对账

周期来自账户 `open` 指令的 `reconcile` metadata；到期日从最近一条 Balance 断言（没有则用开立日）重建，不落库。填申报余额提交；不一致时显示账本累计值、申报值与差额，原文件零改动。

### 审核

AI 草稿由核心库入队（`submit-draft`），面板读 `bootstrap` 的待审列表。审核可修正未分类账户；勾选「审核即绑定」时先把商户写成该账户别名，再调用 `approve-draft`。核心库重新校验平衡、账户状态、整本账，通过后才追加。

### 账户

搜索并编辑别名/周期。保存只写真正变化的字段，不会在只改别名时顺手写入 `reconcile: "none"`。隐式账户（只有交易/Balance、没有 `open`）显示为「隐式」，元数据只读。

## HTTP 路由

`engine` / `engine/install` / `health` / `setup` / `init` / `bootstrap` / `balance` / `metadata` / `draft/submit` / `draft/approve` / `draft/reject`。`setup` 判断是否已有 `main.bean`；`init` 创建新账本；`draft/submit` 接收手动或外部草稿。未认证请求由 `connection.requestRejection` 返回 401。

## 配置

见 `cordis.patch.yml`。最关键三项：

```yaml
# profile 的 cordis.patch.yml，id 与 bundle 行相同
config:
  root: "/path/to/ledger"          # 默认 $DSH_HOME/ledger
  corePath: "/path/to/ledger-domain-core"  # 托管引擎安装前必填
  # pythonPath: "/path/to/ledger/.venv/bin/python"  # 只在用外部引擎时配置
```

`beanCheck`/`beanQuery` 含 `/` 时相对 `root` 解析；留空优先用 `root/.venv/bin`。`stateDir` 指向账本根下的 `.ledger`，草稿、锁、审计都在那里。

## 边界

- **插件不含领域逻辑**：不解析 `.bean`、不做别名解析、不做周期计算、不写文件。
- **不注册 Agent 工具**：AI 适配器直接调用核心库或 CLI，不经过面板。
- **不引入服务**：没有常驻 Python 服务、没有 MCP、没有数据库；每次请求一个短生命周期进程。
- **不缓存核心数据**：面板每次从核心库读；缓存只可能在核心库内部按文件 mtime 失效。
- **错误只展示**：插件不把核心错误翻译成新规则，只把 code/message 呈现在界面上。

## 安装与刷新

```bash
plugin_manager action=install_bundle target=<本仓库的绝对路径>
```

改动**核心库**不需要重装插件（每次请求重新执行 CLI）。改动**插件 Host/Client 代码**后：Host 桥接需要通过插件管理禁用/启用该行或重启 DSH；浏览器需要刷新页面。

## 已知限制

- 每次请求起 Python 进程；大账本上是秒级。
- 托管引擎首次安装需要网络（`beancount` + `beanquery`）；之后离线可用。
- 引擎安装在 `~/.dsh/ledger-engine`，插件只删除自己的 `venv/` 与标记文件。
- 新账本只支持空目录；已有账本导入尚未实现，需要把 `root` 指向已有账本。
- 手动记账只支持支出/收入两分录，暂不支持拆分、多币种或手续费。
- 面板没有模型工具；模型写账本必须走核心库的草稿/审批接口。
- 无浏览器控制时无法做像素级视觉验收；本项目用槽位检查、无 DOM 渲染冒烟测试和 HTTP 路由测试覆盖。
- 账本只追加到 `YYYY/MM.bean`；没有年份骨架时核心库拒绝写入。
