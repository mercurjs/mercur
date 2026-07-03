#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="/Users/viktorholik/Desktop/mercur"
WORKTREES_DIR="$REPO_ROOT/.claude/worktrees"
STATE_ROOT="$WORKTREES_DIR/.dev-state"

APPS=(api admin vendor)

usage() {
  cat <<EOF
Usage: $0 <worktree-name|--main> [command] [app]

Commands:
  start [app]     Start app(s) in the background on random per-worktree ports
                  (default app: all). 'start all' runs install/build/migrate first.
  stop  [app]     Stop app(s) for this worktree (default: all)
  restart [app]   Stop then start app(s) (default: all)
  status          Show assigned ports and running state
  ports           Print the assigned ports (sourceable: API_PORT/ADMIN_PORT/VENDOR_PORT)
  logs <app>      Tail the log for a single app (api|admin|vendor)
  prepare         Copy env, bun install, build, run db:migrate (no start)

  app is one of: api | admin | vendor | all

Examples:
  $0 spec013-cont               # start everything in the background
  $0 spec013-cont start admin   # (re)start only the admin panel
  $0 spec013-cont status        # see ports + what's running
  $0 spec013-cont stop          # kill all three for this worktree
  $0 --main restart api         # restart only the API in the main checkout

Available worktrees:
EOF
  if [ -d "$WORKTREES_DIR" ]; then
    ls -1 "$WORKTREES_DIR" | grep -v '^\.dev-state$' || true
  fi
  exit 1
}

# ── Argument parsing ─────────────────────────────────────────────────────────
if [ $# -lt 1 ] || [ "${1:-}" = "--list" ] || [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
fi

NAME="$1"; shift
if [ "$NAME" = "--main" ]; then
  TARGET="$REPO_ROOT"
  STATE_KEY="main"
else
  TARGET="$WORKTREES_DIR/$NAME"
  STATE_KEY="$NAME"
fi

if [ ! -d "$TARGET" ]; then
  echo "Error: $TARGET does not exist"
  usage
fi

COMMAND="${1:-start}"; [ $# -ge 1 ] && shift || true
APP="${1:-all}"

STATE_DIR="$STATE_ROOT/$STATE_KEY"
PORTS_FILE="$STATE_DIR/ports.env"
mkdir -p "$STATE_DIR"

# ── Port helpers ─────────────────────────────────────────────────────────────
port_free() {
  ! lsof -ti tcp:"$1" >/dev/null 2>&1
}

find_free_port() {
  local base=$1 span=$2 tries=0 port
  while [ $tries -lt 100 ]; do
    port=$(( base + RANDOM % span ))
    if port_free "$port"; then
      echo "$port"
      return 0
    fi
    tries=$((tries + 1))
  done
  echo "Error: no free port found in range $base-$((base + span))" >&2
  return 1
}

ensure_ports() {
  if [ -f "$PORTS_FILE" ]; then
    # shellcheck disable=SC1090
    source "$PORTS_FILE"
    return
  fi
  API_PORT=$(find_free_port 9000 400)
  ADMIN_PORT=$(find_free_port 7000 400)
  VENDOR_PORT=$(find_free_port 7500 400)
  cat >"$PORTS_FILE" <<EOF
API_PORT=$API_PORT
ADMIN_PORT=$ADMIN_PORT
VENDOR_PORT=$VENDOR_PORT
EOF
  echo "→ Assigned ports for '$STATE_KEY': api=$API_PORT admin=$ADMIN_PORT vendor=$VENDOR_PORT"
}

port_for() {
  case "$1" in
    api) echo "$API_PORT" ;;
    admin) echo "$ADMIN_PORT" ;;
    vendor) echo "$VENDOR_PORT" ;;
  esac
}

pid_file() { echo "$STATE_DIR/$1.pid"; }
log_file() { echo "$STATE_DIR/$1.log"; }

# ── Process control ──────────────────────────────────────────────────────────
kill_port() {
  local port=$1 pids
  pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    kill $pids 2>/dev/null || true
    sleep 1
    pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
    [ -n "$pids" ] && kill -9 $pids 2>/dev/null || true
  fi
}

stop_app() {
  local app=$1 port
  port=$(port_for "$app")
  echo "→ Stopping $app (port $port)"
  kill_port "$port"
  rm -f "$(pid_file "$app")"
}

start_app() {
  local app=$1 port pidf logf
  port=$(port_for "$app")
  pidf=$(pid_file "$app")
  logf=$(log_file "$app")

  # Free the port in case a previous run (or stale process) is holding it.
  kill_port "$port"

  echo "→ Starting $app on port $port  (logs: $logf)"
  case "$app" in
    api)
      (
        cd "$TARGET/apps/api"
        PORT="$API_PORT" \
        ADMIN_CORS="http://localhost:$ADMIN_PORT,http://localhost:$API_PORT" \
        VENDOR_CORS="http://localhost:$VENDOR_PORT" \
        AUTH_CORS="http://localhost:$ADMIN_PORT,http://localhost:$VENDOR_PORT,http://localhost:$API_PORT" \
        FILE_BACKEND_URL="http://localhost:$API_PORT/static" \
        nohup bun run dev >"$logf" 2>&1 &
        echo $! >"$pidf"
      )
      ;;
    admin)
      (
        cd "$TARGET/apps/admin-test"
        rm -rf node_modules/.vite
        VITE_MERCUR_BACKEND_URL="http://localhost:$API_PORT" \
        VITE_MERCUR_VENDOR_URL="http://localhost:$VENDOR_PORT" \
        nohup bunx vite --port "$ADMIN_PORT" --strictPort >"$logf" 2>&1 &
        echo $! >"$pidf"
      )
      ;;
    vendor)
      (
        cd "$TARGET/apps/vendor"
        rm -rf node_modules/.vite
        VITE_MERCUR_BACKEND_URL="http://localhost:$API_PORT" \
        nohup bunx vite --port "$VENDOR_PORT" --strictPort >"$logf" 2>&1 &
        echo $! >"$pidf"
      )
      ;;
  esac
}

# ── Prepare (env, install, build, migrate) ───────────────────────────────────
prepare() {
  echo "→ Using: $TARGET"
  echo "→ git branch: $(cd "$TARGET" && git rev-parse --abbrev-ref HEAD)"

  local env_sources=("apps/api/.env" "apps/api/.env.test")
  for rel in "${env_sources[@]}"; do
    local src="$REPO_ROOT/$rel" dst="$TARGET/$rel"
    if [ -f "$src" ] && [ ! -f "$dst" ]; then
      echo "→ Copying $rel from main repo"
      mkdir -p "$(dirname "$dst")"
      cp "$src" "$dst"
    fi
  done

  if [ ! -d "$TARGET/node_modules" ]; then
    echo "→ node_modules missing — running bun install"
    (cd "$TARGET" && bun install)
  fi

  echo "→ Building packages"
  (cd "$TARGET" && bun run build --force)

  echo "→ Running medusa db:migrate"
  (cd "$TARGET/apps/api" && bunx medusa db:migrate)
}

print_urls() {
  echo
  echo "→ '$STATE_KEY' is starting up:"
  echo "   API:    http://localhost:$API_PORT"
  echo "   Admin:  http://localhost:$ADMIN_PORT"
  echo "   Vendor: http://localhost:$VENDOR_PORT"
  echo
  echo "   Logs:   $0 $NAME logs <api|admin|vendor>"
  echo "   Stop:   $0 $NAME stop"
}

status() {
  echo "Worktree: $STATE_KEY  ($TARGET)"
  echo "State dir: $STATE_DIR"
  echo
  printf "%-8s %-7s %-9s %s\n" "APP" "PORT" "RUNNING" "URL"
  for app in "${APPS[@]}"; do
    local port running="no"
    port=$(port_for "$app")
    if ! port_free "$port"; then running="yes"; fi
    printf "%-8s %-7s %-9s %s\n" "$app" "$port" "$running" "http://localhost:$port"
  done
}

resolve_apps() {
  case "$1" in
    all) echo "${APPS[@]}" ;;
    api|admin|vendor) echo "$1" ;;
    *) echo "Error: unknown app '$1' (use api|admin|vendor|all)" >&2; exit 1 ;;
  esac
}

# ── Dispatch ─────────────────────────────────────────────────────────────────
ensure_ports

case "$COMMAND" in
  start)
    if [ "$APP" = "all" ]; then
      prepare
    else
      echo "→ Single-app start: skipping install/build/migrate (run '$0 $NAME prepare' if needed)"
    fi
    for app in $(resolve_apps "$APP"); do
      start_app "$app"
    done
    print_urls
    ;;
  stop)
    for app in $(resolve_apps "$APP"); do
      stop_app "$app"
    done
    ;;
  restart)
    for app in $(resolve_apps "$APP"); do
      stop_app "$app"
    done
    if [ "$APP" = "all" ]; then prepare; fi
    for app in $(resolve_apps "$APP"); do
      start_app "$app"
    done
    print_urls
    ;;
  status)
    status
    ;;
  ports)
    cat "$PORTS_FILE"
    ;;
  logs)
    if [ "$APP" = "all" ]; then
      echo "Error: 'logs' needs a single app (api|admin|vendor)" >&2
      exit 1
    fi
    tail -f "$(log_file "$APP")"
    ;;
  prepare)
    prepare
    ;;
  *)
    echo "Error: unknown command '$COMMAND'" >&2
    usage
    ;;
esac
