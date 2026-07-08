#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="/Users/viktorholik/Desktop/mercur"

# api=9000, admin=7001, vendor=7002
PORTS=(9000 7001 7002)

echo "→ Killing previous dev processes"
for port in "${PORTS[@]}"; do
  pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "  • Port $port busy (pids: $pids) — killing"
    kill $pids 2>/dev/null || true
    sleep 1
    pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
      echo "  • Port $port still busy — force killing"
      kill -9 $pids 2>/dev/null || true
    fi
  fi
done

cd "$REPO_ROOT"

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

echo "→ Starting apps/api       (http://localhost:9000)"
(cd "$REPO_ROOT/apps/api" && bun run dev) &
pids+=($!)

echo "→ Starting apps/admin-test (http://localhost:7001)"
(cd "$REPO_ROOT/apps/admin-test" && bun run dev) &
pids+=($!)

echo "→ Starting apps/vendor    (http://localhost:7002)"
(cd "$REPO_ROOT/apps/vendor" && bun run dev) &
pids+=($!)

wait
