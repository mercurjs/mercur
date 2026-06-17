#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="/Users/viktorholik/Desktop/mercur"
WORKTREES_DIR="$REPO_ROOT/.claude/worktrees"

usage() {
  echo "Usage: $0 [worktree-name|--main|--list]"
  echo
  echo "Available worktrees:"
  if [ -d "$WORKTREES_DIR" ]; then
    ls -1 "$WORKTREES_DIR"
  fi
  exit 1
}

if [ $# -lt 1 ] || [ "${1:-}" = "--list" ] || [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
fi

if [ "$1" = "--main" ]; then
  TARGET="$REPO_ROOT"
else
  TARGET="$WORKTREES_DIR/$1"
fi

if [ ! -d "$TARGET" ]; then
  echo "Error: $TARGET does not exist"
  usage
fi

echo "→ Using: $TARGET"
cd "$TARGET"

echo "→ git branch: $(git rev-parse --abbrev-ref HEAD)"

PORTS=(9000 7000 7001)
for port in "${PORTS[@]}"; do
  pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "→ Port $port busy (pids: $pids) — killing"
    kill $pids 2>/dev/null || true
    sleep 1
    pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
      echo "→ Port $port still busy — force killing"
      kill -9 $pids 2>/dev/null || true
    fi
  fi
done

ENV_SOURCES=(
  "apps/api/.env"
  "apps/api/.env.test"
)
for rel in "${ENV_SOURCES[@]}"; do
  src="$REPO_ROOT/$rel"
  dst="$TARGET/$rel"
  if [ -f "$src" ] && [ ! -f "$dst" ]; then
    echo "→ Copying $rel from main repo"
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
  fi
done

if [ ! -d node_modules ]; then
  echo "→ node_modules missing — running bun install"
  bun install
fi

echo "→ Building packages"
bun run build

echo "→ Running medusa db:migrate"
(cd apps/api && bunx medusa db:migrate)

pids=()
cleanup() {
  echo
  echo "→ Stopping dev processes"
  for pid in "${pids[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "→ Starting apps/api"
(cd apps/api && bun run dev) &
pids+=($!)

echo "→ Starting apps/admin-test"
(cd apps/admin-test && bun run dev) &
pids+=($!)

echo "→ Starting apps/vendor"
(cd apps/vendor && bun run dev) &
pids+=($!)

wait
