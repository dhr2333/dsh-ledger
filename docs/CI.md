# CI（Jenkins）

本仓库由内部 Jenkins 的 Multibranch Pipeline 通过 GitHub webhook 构建，配置参考 `LedgerKernel`。

## 作业

| 项 | 值 |
|---|---|
| Jenkins job | `dsh-ledger` |
| 触发 | GitHub `push` / `pull_request` |
| Webhook | `https://jenkins.dhr2333.cn/github-webhook/` |
| Script Path | `Jenkinsfile` |
| 构建环境 | `node:22-bookworm-slim` 一次性容器 |

运行时包使用独立作业 `dsh-ledger-runtime`（`Jenkinsfile.runtime`），需要 Node 22、带 pip 的 Python 3、`tar` 和访问 GitHub / PyPI 的网络。

## 构建做什么

1. checkout 当前 commit；
2. 把工作区 tar 流送进 Node 22 容器；
3. 对 `index.js`、`client.js`、`src/options.js`、`src/host/platform.js`、`src/host/routes.js`、`src/host/engine.js`、`scripts/*.mjs` 跑 `node --check`；
4. 跑 `scripts/check-bundle.mjs`：
   - 校验 `package.json`、bundle patch、locale meta/detail、icon；
   - 校验六个运行时包都出现在 `optionalDependencies` 且版本与主包一致；
   - 校验 `src/host/platform.js` 的 Windows / POSIX 路径映射；
   - 用最小 React/ModuleLoader shim 加载 `client.js`，确认 `main` / `sidebar.panellist` 注册；
   - 提取 client 中所有 `t('...')`，确认中英文字典没有缺键；
   - 确认插件源码不注册 Agent 工具；
   - 样式对比度：文字颜色不得与同一样式的背景来自同一色系别名（`--dsw-alias-brand-primary`、`--dsw-alias-brand-primary-invert`、`--dsw-alias-label-primary`、`--dsw-alias-brand-text` 在主题里同值，曾让主按钮文字与底色同色而不可见）。

CI 不安装引擎、不访问账本、不写用户目录。

## 运行时包构建与发布

`node scripts/build-runtime.mjs --all --pack` 会按 `scripts/runtimes.json`：

1. 下载并校验 python-build-standalone 的 CPython 3.12；
2. 用 `pip download --only-binary=:all:` 拉取目标平台的离线 wheelhouse；
3. 生成 `dist/packages/dsh-ledger-runtime-<os>-<arch>/`，包含 `python/`、`wheelhouse/`、`manifest.json`、`package.json`。

`npm run runtime:pack` 在此之后自动执行 `scripts/check-pack.mjs`。它用 `npm pack` 重新打包每个运行时包、解包 tarball，再检查解释器与 wheelhouse：npm 不收录符号链接，python-build-standalone 的 `bin/python3` 正是符号链接，所以只检查构建目录会漏掉"安装包里没有 python3"（0.3.1 的发布事故）。`src/host/platform.js` 在 `bin/python3` 缺失时会回落到 `bin/python3.12`，`check-pack` 与 `check-bundle` 都会守住这一点。

目标平台：`win32-x64`、`win32-arm64`（x64 运行时，Windows on ARM 模拟执行）、`darwin-x64`、`darwin-arm64`、`linux-x64`、`linux-arm64`。任何平台缺少 wheel 时构建直接失败，不允许带着空 wheelhouse 发布。

发布顺序（版本必须与主包一致）：

```bash
npm run runtime:pack   # 构建六个运行时包并做 tarball 产物校验
node scripts/smoke-runtime.mjs --target linux-x64 --from-tarball
for key in win32-x64 win32-arm64 darwin-x64 darwin-arm64 linux-x64 linux-arm64; do
  npm publish "dist/packages/dsh-ledger-runtime-$key" --access public
done
npm publish   # 主包最后发布
```

发布前冒烟：

- Linux：`node scripts/smoke-runtime.mjs --target linux-x64 --from-tarball`（CI 自动执行；先 `npm pack` 再解包，测的是用户实际下载的产物）；
- 其余平台：在对应系统上运行同一命令（同样加 `--from-tarball`），并完成一次面板流程（安装引擎 → 建账 → 提交并批准草稿 → 对账），结果记入发布检查单；
- Windows x64 额外确认 PATH 中没有 `python3`，且 `%DSH_HOME%\ledger-engine\venv\Scripts\bean-check.exe` 存在。

## npm 发布

发布包必须自带核心库和模板，否则插件市场安装后无法建账：

```bash
node scripts/vendor.mjs --check   # 发布前确认 vendor/ 与两个源码 checkout 一致
npm publish
```

`prepack` 会自动重新生成 `vendor/`（`assets` + `manifest.json`），并把来源 commit 写进 manifest；`vendor/` 不提交到 git。发布前先更新同级的 `beancount-guard` / `ledger-domain-assets`，否则会打包旧模板。CI 只有本仓库的 checkout，因此不生成也不校验 `vendor/`。

## 本地等价命令

```bash
for file in index.js client.js src/options.js src/host/platform.js src/host/routes.js src/host/engine.js src/host/init.js scripts/vendor.mjs scripts/check-bundle.mjs scripts/build-runtime.mjs scripts/check-pack.mjs scripts/smoke-runtime.mjs; do
  node --check "$file"
done
node scripts/check-bundle.mjs
```

## 凭据

GitHub Branch Source 使用 Jenkins 已有的 GitHub 凭据（与 `LedgerKernel` 相同）；仓库本身不保存任何 token。若仓库改为私有，需确认该凭据具备读取私有仓库的 `repo` 权限。

## 分支保护（可选）

构建成功后，Jenkins Git 插件回写的 commit status context 为 `continuous-integration/jenkins/branch`；如需强制，可在 GitHub 分支保护中要求该检查。
