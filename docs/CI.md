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

## 构建做什么

1. checkout 当前 commit；
2. 把工作区 tar 流送进 Node 22 容器；
3. 对 `index.js`、`client.js`、`src/options.js`、`src/host/routes.js`、`src/host/engine.js` 跑 `node --check`；
4. 跑 `scripts/check-bundle.mjs`：
   - 校验 `package.json`、bundle patch、locale meta/detail、icon；
   - 用最小 React/ModuleLoader shim 加载 `client.js`，确认 `main` / `sidebar.panellist` 注册；
   - 提取 client 中所有 `t('...')`，确认中英文字典没有缺键；
   - 确认插件源码不注册 Agent 工具；
   - 样式对比度：文字颜色不得与同一样式的背景来自同一色系别名（`--dsw-alias-brand-primary`、`--dsw-alias-brand-primary-invert`、`--dsw-alias-label-primary`、`--dsw-alias-brand-text` 在主题里同值，曾让主按钮文字与底色同色而不可见）。

CI 不安装引擎、不访问账本、不写用户目录。

## npm 发布

发布包必须自带核心库和模板，否则插件市场安装后无法建账：

```bash
node scripts/vendor.mjs --check   # 发布前确认 vendor/ 与两个源码 checkout 一致
npm publish
```

`prepack` 会自动重新生成 `vendor/`（`ledger_domain` + `assets` + `manifest.json`），并把来源 commit 写进 manifest；`vendor/` 不提交到 git。发布前先更新同级的 `ledger-domain-core` / `ledger-domain-assets`，否则会打包旧副本。CI 只有本仓库的 checkout，因此不生成也不校验 `vendor/`。

## 本地等价命令

```bash
for file in index.js client.js src/options.js src/host/routes.js src/host/engine.js src/host/init.js scripts/vendor.mjs scripts/check-bundle.mjs; do
  node --check "$file"
done
node scripts/check-bundle.mjs
```

## 凭据

GitHub Branch Source 使用 Jenkins 已有的 GitHub 凭据（与 `LedgerKernel` 相同）；仓库本身不保存任何 token。若仓库改为私有，需确认该凭据具备读取私有仓库的 `repo` 权限。

## 分支保护（可选）

构建成功后，Jenkins Git 插件回写的 commit status context 为 `continuous-integration/jenkins/branch`；如需强制，可在 GitHub 分支保护中要求该检查。
