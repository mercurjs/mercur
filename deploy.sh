#!/usr/bin/env bash
# Deploy Mercur to the VPS.
# Runs locally; everything inside the heredoc executes on the remote host.
#
# Usage:
#   ./deploy.sh                       # default host
#   MERCUR_HOST=root@1.2.3.4 ./deploy.sh
#   MERCUR_BRANCH=canary ./deploy.sh
set -euo pipefail

HOST="${MERCUR_HOST:-root@167.233.17.178}"
BRANCH="${MERCUR_BRANCH:-main}"
BACKEND_URL="${MERCUR_BACKEND_URL:-https://new.mercur.dev}"

echo "→ Deploying $BRANCH to $HOST (backend: $BACKEND_URL)"

ssh -o ConnectTimeout=10 "$HOST" \
  BRANCH="$BRANCH" \
  MERCUR_BACKEND_URL="$BACKEND_URL" \
  bash -s <<'REMOTE'
set -euo pipefail

SOURCE_DIR="/root/mercur"
DEPLOY_DIR="/root/marketplace"
SERVICE="mercur-api"
LOCK="/tmp/mercur-deploy.lock"

exec 9>"$LOCK"
flock -n 9 || { echo "Another deploy is already running"; exit 1; }

log() { echo "[$(date +'%F %T')] $*"; }

# 1. Pull upstream
log "Fetching $BRANCH"
cd "$SOURCE_DIR"
git fetch --prune origin "$BRANCH"
git reset --hard "origin/$BRANCH"
log "Now at $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"

# 2. Sync templates/basic → /root/marketplace.
#    Preserve .env files, the lockfile shim, and build output across runs.
log "Syncing templates/basic → $DEPLOY_DIR"
rsync -a --delete \
  --exclude='node_modules/' \
  --exclude='.medusa/' \
  --exclude='packages/api/.env' \
  --exclude='packages/api/.env.local' \
  --exclude='yarn.lock' \
  "$SOURCE_DIR/templates/basic/" "$DEPLOY_DIR/"

# Re-seed the yarn lockfile shim (yarn refuses to install in templates/basic
# without it because the parent of the original is a bun workspace).
[ -f "$DEPLOY_DIR/yarn.lock" ] || touch "$DEPLOY_DIR/yarn.lock"

# Re-apply the codegen stub. The published @mercurjs/core ships a codegen
# output that references route modules absent from the package; running real
# codegen would just re-introduce the broken references. The Routes type is
# only used for client-side type inference at build time — runtime unaffected.
mkdir -p "$DEPLOY_DIR/packages/api/.mercur/_generated"
cat > "$DEPLOY_DIR/packages/api/.mercur/_generated/index.ts" <<'STUB'
// Stubbed at deploy time — see deploy.sh
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Routes = any
STUB

# Re-create the appDir symlinks for admin-ui / vendor-ui modules.
# The compiled medusa-config.js runs from .medusa/server/, two folders
# deeper than the source. Its `path.join(__dirname, '../../apps/admin')`
# resolves to packages/api/apps/admin, which doesn't exist by default.
mkdir -p "$DEPLOY_DIR/packages/api/apps"
ln -sfn "$DEPLOY_DIR/apps/admin" "$DEPLOY_DIR/packages/api/apps/admin"
ln -sfn "$DEPLOY_DIR/apps/vendor" "$DEPLOY_DIR/packages/api/apps/vendor"

# Patch the dashboard Vite configs. @mercurjs/dashboard-sdk defaults
# backendUrl to http://localhost:9000 — that gets baked into the SPA
# bundle and breaks every non-local deployment. We pass an empty string
# so API calls go to the same origin the dashboard is served from.
for app in admin vendor; do
  cat > "$DEPLOY_DIR/apps/$app/vite.config.ts" <<VITE
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { mercurDashboardPlugin } from "@mercurjs/dashboard-sdk"

export default defineConfig({
  plugins: [
    react(),
    mercurDashboardPlugin({
      medusaConfigPath: "../../packages/api/medusa-config.ts",
      backendUrl: process.env.MERCUR_BACKEND_URL ?? "",
    }),
  ],
})
VITE
done

# Declare MERCUR_BACKEND_URL in turbo.json so Turbo passes it through
# to vite. Without this turbo treats it as an undeclared env var and
# strips it from the child process — the build then sees the empty
# fallback and bakes a broken baseUrl into the bundle.
python3 -c "
import json
with open('$DEPLOY_DIR/turbo.json') as f: t = json.load(f)
env = t['tasks']['build'].setdefault('env', [])
for v in ['MERCUR_BACKEND_URL', 'NODE_ENV']:
    if v not in env: env.append(v)
with open('$DEPLOY_DIR/turbo.json', 'w') as f: json.dump(t, f, indent=2)
"

# 3. Install + build the workspace
cd "$DEPLOY_DIR"
log "yarn install (workspace)"
yarn install >/tmp/mercur-yarn.log 2>&1 || { tail -n 40 /tmp/mercur-yarn.log; exit 1; }

log "yarn build"
yarn build >/tmp/mercur-build.log 2>&1 || { tail -n 40 /tmp/mercur-build.log; exit 1; }

# 4. Prepare the compiled server (`.medusa/server` is recreated by `medusa build`)
PROD_DIR="$DEPLOY_DIR/packages/api/.medusa/server"
log "Preparing prod dir at $PROD_DIR"
cp "$DEPLOY_DIR/packages/api/.env" "$PROD_DIR/.env"
touch "$PROD_DIR/yarn.lock"
[ -f "$PROD_DIR/.yarnrc.yml" ] || echo "nodeLinker: node-modules" > "$PROD_DIR/.yarnrc.yml"

cd "$PROD_DIR"
log "yarn install (prod)"
yarn install >/tmp/mercur-yarn-prod.log 2>&1 || { tail -n 40 /tmp/mercur-yarn-prod.log; exit 1; }

# 5. Run DB migrations (idempotent)
log "DB migrate"
cd "$DEPLOY_DIR/packages/api"
yarn medusa db:migrate 2>&1 | tail -n 8

# 6. Restart the API service
log "Restarting $SERVICE"
systemctl restart "$SERVICE"

# 7. Wait for it to become healthy
for i in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:9000/health >/dev/null 2>&1; then
    log "API healthy ✓ ($(curl -s http://127.0.0.1:9000/health))"
    exit 0
  fi
  sleep 2
done

log "API did not become healthy in 40s — inspect: journalctl -u $SERVICE -n 100"
exit 1
REMOTE

echo "✓ Deploy finished"
echo "  Admin:  http://167.233.17.178:9000/dashboard"
echo "  Vendor: http://167.233.17.178:9000/seller"
