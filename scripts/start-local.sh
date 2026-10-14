#!/bin/zsh
set -eu
cd "${0:A:h}/.."
BUNDLED_NODE="${FOODLENS_NODE_BIN:-$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin}"
if [[ -x "$BUNDLED_NODE/node" ]]; then
  export PATH="$BUNDLED_NODE:$PATH"
fi
node -e 'if(Number(process.versions.node.split(".")[0])<22){console.error("请先安装 Node.js 22.13+。");process.exit(1)}'
exec node node_modules/expo/bin/cli start --web --port 8081
