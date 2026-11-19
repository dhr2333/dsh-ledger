#!/usr/bin/env bash
#
# One-command installer for the ledger-domain DSH panel.
#
#   curl -fsSL https://raw.githubusercontent.com/dhr2333/dsh-ledger/main/scripts/install.sh | bash
#
# The installer puts the three checkouts next to each other under
# `$DSH_HOME/ledger-domain-src`, installs the panel bundle into a DSH profile,
# and selects it. A fresh install needs no corePath/templatePath config: the
# plugin discovers sibling checkouts (or the standard `$DSH_HOME` layout).
#
# Options:
#   --profile <name>  DSH profile to install into (default: web)
#   --dir <path>      checkout directory (default: checkout parent, else
#                     $DSH_HOME/ledger-domain-src)
#   --ref <ref>       branch or tag to clone (default: main)
#   --update          fast-forward existing checkouts to --ref
#   --skip-install    only lay out the checkouts; do not touch the profile
#   --dry-run         print commands, change nothing
#   -h, --help        show this help

set -euo pipefail

CORE_REPO="https://github.com/dhr2333/ledger-domain-core.git"
ASSETS_REPO="https://github.com/dhr2333/ledger-domain-assets.git"
PLUGIN_REPO="https://github.com/dhr2333/dsh-ledger.git"

PROFILE="${DSH_PROFILE:-web}"
REF="${LEDGER_DOMAIN_REF:-main}"
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
DIR=""
UPDATE=0
DRY_RUN=0
SKIP_INSTALL=0

log() { printf '%s\n' "$*"; }
die() { printf '错误：%s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
One-command installer for the ledger-domain DSH panel.

  curl -fsSL https://raw.githubusercontent.com/dhr2333/dsh-ledger/main/scripts/install.sh | bash

Options:
  --profile <name>  DSH profile to install into (default: web)
  --dir <path>      checkout directory (default: checkout parent, else
                    $DSH_HOME/ledger-domain-src)
  --ref <ref>       branch or tag to clone (default: main)
  --update          fast-forward existing checkouts to --ref
  --skip-install    only lay out the checkouts; do not touch the profile
  --dry-run         print commands, change nothing
  -h, --help        show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile) PROFILE="${2:?--profile 需要一个值}"; shift 2 ;;
    --dir) DIR="${2:?--dir 需要一个值}"; shift 2 ;;
    --ref) REF="${2:?--ref 需要一个值}"; shift 2 ;;
    --update) UPDATE=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --skip-install) SKIP_INSTALL=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "未知参数：$1（用 --help 查看）" ;;
  esac
done

# Resolve the checkout this script belongs to, if it was run from a file.
SCRIPT_PATH="${BASH_SOURCE[0]:-}"
if [[ -n "$SCRIPT_PATH" && -f "$SCRIPT_PATH" ]]; then
  SCRIPT_DIR="$(cd -- "$(dirname -- "$SCRIPT_PATH")" && pwd)"
  REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
else
  SCRIPT_DIR=""
  REPO_ROOT=""
fi

if [[ -z "$DIR" ]]; then
  if [[ -n "$REPO_ROOT" && -f "$REPO_ROOT/package.json" && -d "$(dirname -- "$REPO_ROOT")/ledger-domain-core" ]]; then
    DIR="$(dirname -- "$REPO_ROOT")"
  else
    DIR="$DSH_HOME/ledger-domain-src"
  fi
fi

if [[ "$DRY_RUN" -eq 0 ]]; then
  mkdir -p -- "$DIR"
fi
DIR="$(cd -- "$DIR" 2>/dev/null && pwd || printf '%s' "$DIR")"
PLUGIN_DIR="$DIR/dsh-ledger"

for tool in git node; do
  command -v "$tool" >/dev/null 2>&1 || die "缺少 $tool，请先安装并确保在 PATH 中"
done
if [[ "$SKIP_INSTALL" -eq 0 ]]; then
  for tool in dsh pnpm; do
    command -v "$tool" >/dev/null 2>&1 || die "缺少 $tool，请先安装并确保在 PATH 中"
  done
fi

clone_or_update() {
  local name="$1" url="$2" dest="$DIR/$1"
  if [[ -d "$dest/.git" ]]; then
    if [[ "$UPDATE" -eq 1 ]]; then
      log "更新 $name"
      if [[ "$DRY_RUN" -eq 1 ]]; then
        log "  git -C $dest pull --ff-only origin $REF"
      else
        git -C "$dest" pull --ff-only origin "$REF"
      fi
    else
      log "已存在 $name（加 --update 更新）"
    fi
    return
  fi
  if [[ -e "$dest" ]]; then
    die "$dest 已存在但不是 git 仓库；请移走或换 --dir"
  fi
  log "克隆 $name"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "  git clone --depth=1 --branch $REF $url $dest"
  else
    git clone --depth=1 --branch "$REF" "$url" "$dest"
  fi
}

clone_or_update "ledger-domain-core" "$CORE_REPO"
clone_or_update "ledger-domain-assets" "$ASSETS_REPO"
clone_or_update "dsh-ledger" "$PLUGIN_REPO"

if [[ ! -f "$PLUGIN_DIR/package.json" ]]; then
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "  dsh plugin --profile $PROFILE add $PLUGIN_DIR"
    log "  node $PLUGIN_DIR/scripts/register-bundle.mjs <profile>/package.json <bundle-name>"
    log ""
    log "dry-run：未修改源码、profile 或账本"
    exit 0
  fi
  die "插件目录不完整：$PLUGIN_DIR/package.json 不存在"
fi

BUNDLE_NAME="$(node -e "process.stdout.write(JSON.parse(require('node:fs').readFileSync(process.argv[1], 'utf8')).name)" "$PLUGIN_DIR/package.json")"
[[ -n "$BUNDLE_NAME" ]] || die "无法从 $PLUGIN_DIR/package.json 读取包名"

if [[ "$SKIP_INSTALL" -eq 1 ]]; then
  log ""
  log "源码已就位：$DIR"
  log "  插件：$PLUGIN_DIR"
  log "未安装到 DSH profile（--skip-install）。"
  exit 0
fi

log "安装插件到 DSH profile：$PROFILE"
if [[ "$DRY_RUN" -eq 1 ]]; then
  log "  dsh plugin --profile $PROFILE add $PLUGIN_DIR"
else
  dsh plugin --profile "$PROFILE" add "$PLUGIN_DIR"
fi

PROFILE_PACKAGE="$DSH_HOME/profiles/$PROFILE/package.json"
if [[ ! -f "$PROFILE_PACKAGE" ]]; then
  die "profile 未初始化：$PROFILE_PACKAGE（先运行一次 dsh --profile $PROFILE，或检查 --profile）"
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  log "  node $PLUGIN_DIR/scripts/register-bundle.mjs $PROFILE_PACKAGE $BUNDLE_NAME"
  log ""
  log "dry-run：未修改源码、profile 或账本"
  exit 0
fi

node "$PLUGIN_DIR/scripts/register-bundle.mjs" "$PROFILE_PACKAGE" "$BUNDLE_NAME"

if DSH_HOME="$DSH_HOME" dsh --profile "$PROFILE" --dump-config 2>/dev/null | grep -q "id: ledger-domain"; then
  log "校验：profile 已组合出 ledger-domain"
else
  log "提示：暂未在 dump-config 中看到 ledger-domain；重启 DSH 后再检查。"
fi

log ""
log "完成。"
log "  插件：$PLUGIN_DIR"
log "  profile：$PROFILE（$PROFILE_PACKAGE）"
log "  账本默认目录：$DSH_HOME/ledger"
log ""
log "下一步：刷新 DSH 页面；如果侧栏没有「本地账本」，重启 DSH。"
log "首次打开「本地账本」会创建账本并安装托管引擎（需要网络，一次即可）。"
