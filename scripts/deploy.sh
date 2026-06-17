#!/usr/bin/env bash
# Deploy Mercur to the VPS.
# Runs locally; everything inside the heredoc executes on the remote host.
#
# Usage:
#   ./deploy.sh                       # default host
#   MERCUR_HOST=root@1.2.3.4 ./deploy.sh
#   MERCUR_BRANCH=main ./deploy.sh
set -euo pipefail

HOST="${MERCUR_HOST:-root@167.233.17.178}"
BRANCH="${MERCUR_BRANCH:-canary}"
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
# Explicit refspec so the remote-tracking ref updates (a bare
# `git fetch origin <branch>` only writes FETCH_HEAD on some setups).
git fetch --prune origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"
git reset --hard "origin/$BRANCH"
log "Now at $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"

# 2. Sync templates/basic → /root/marketplace.
#    Preserve .env files, the lockfile shim, and build output across runs.
log "Syncing templates/basic → $DEPLOY_DIR"
rsync -a --delete \
  --exclude='node_modules/' \
  --exclude='.medusa/' \
  --exclude='.yarn/' \
  --exclude='.yarnrc.yml' \
  --exclude='.pnp.*' \
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
# Both the apps/{admin,vendor}/tsconfig.app.json `paths` mapping and
# `@acme/api`'s package.json `exports` field resolve `@acme/api/_generated`
# to `packages/api/.mercur/routes.d.ts`, so write the stub at that exact path.
mkdir -p "$DEPLOY_DIR/packages/api/.mercur"
cat > "$DEPLOY_DIR/packages/api/.mercur/routes.d.ts" <<'STUB'
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

# Normalize package.json for yarn 4 + turbo:
#   1. Rewrite the root `packageManager` from bun to the installed yarn
#      version. Yarn 4 hard-fails on a non-yarn value and turbo refuses
#      to resolve workspaces without the field.
#   2. Rewrite intra-workspace deps to `workspace:*`. Bun accepts bare
#      `*` for workspace packages; yarn 4 treats it as a registry lookup
#      and 404s on `@acme/api`.
# Bun usage in dev is unaffected because this only mutates the synced
# copy under $DEPLOY_DIR.
# Hardcoded — `yarn --version` itself trips the bun packageManager check
# we are about to remove, so we cannot derive it before rewriting.
YARN_VERSION="4.15.0"
log "Normalizing package.json for yarn ($YARN_VERSION)"
YARN_VERSION="$YARN_VERSION" python3 - <<'PY'
import json, os, glob
yarn_version = os.environ["YARN_VERSION"]
roots = ["package.json"] + glob.glob("packages/*/package.json") + glob.glob("apps/*/package.json")
workspace_names = set()
for path in roots:
    if os.path.exists(path):
        with open(path) as f:
            workspace_names.add(json.load(f).get("name"))
workspace_names.discard(None)
for path in roots:
    if not os.path.exists(path):
        continue
    with open(path) as f:
        data = json.load(f)
    changed = False
    if path == "package.json":
        target = f"yarn@{yarn_version}"
        if data.get("packageManager") != target:
            data["packageManager"] = target
            changed = True
    elif "packageManager" in data:
        data.pop("packageManager")
        changed = True
    for key in ("dependencies", "devDependencies", "peerDependencies", "optionalDependencies"):
        deps = data.get(key) or {}
        for name, spec in list(deps.items()):
            if name in workspace_names and spec == "*":
                deps[name] = "workspace:*"
                changed = True
    if changed:
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
            f.write("\n")
PY

# Force node-modules linker. The apps/admin and apps/vendor workspaces
# import vite, @vitejs/plugin-react, and @mercurjs/dashboard-sdk from
# vite.config.ts but only declare them at the workspace root. PnP
# (yarn's default) refuses to resolve undeclared imports per-workspace;
# node-modules hoists root devDeps and matches bun's behavior.
log "Pinning nodeLinker=node-modules"
cat > "$DEPLOY_DIR/.yarnrc.yml" <<'YRC'
nodeLinker: node-modules
enableImmutableInstalls: false
YRC

# Bypass npm's metadata quarantine by pinning quarantined @mercurjs/* deps to
# their tarball URLs. Quarantine blocks `npm view <pkg>@<ver>` metadata for
# up to 24h after publish, but the tarballs themselves are immutable and
# downloadable at registry.npmjs.org/<pkg>/-/<basename>-<ver>.tgz.
# VERSION is derived from the just-synced source tree so we don't have to
# bump deploy.sh on every release.
VERSION=$(python3 -c "import json; print(json.load(open('$SOURCE_DIR/packages/core/package.json'))['version'])")
log "Rewriting quarantined @mercurjs/* deps to tarball URLs (v$VERSION)"
VERSION="$VERSION" python3 - <<'PY'
import json, glob, os
VERSION = os.environ["VERSION"]
SCOPE = "@mercurjs/"
def tarball(name, ver):
    base = name.split("/", 1)[1]
    return f"https://registry.npmjs.org/{name}/-/{base}-{ver}.tgz"
for path in ["package.json"] + glob.glob("packages/*/package.json") + glob.glob("apps/*/package.json"):
    if not os.path.exists(path):
        continue
    with open(path) as f:
        data = json.load(f)
    changed = False
    for key in ("dependencies", "devDependencies", "peerDependencies", "optionalDependencies"):
        deps = data.get(key) or {}
        for name, spec in list(deps.items()):
            if name.startswith(SCOPE) and spec == VERSION:
                deps[name] = tarball(name, VERSION)
                changed = True
    if changed:
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
            f.write("\n")
PY

# Clean yarn caches. The npm registry can flip a just-published version into
# "quarantined" state for a few minutes; yarn caches that metadata and then
# refuses to resolve it (YN0016). Wipe both the global mirror and any local
# `.yarn/cache` so the next install re-fetches fresh metadata.
log "Cleaning yarn cache"
rm -rf "$DEPLOY_DIR/.yarn/cache" "$DEPLOY_DIR/.yarn/install-state.gz"
yarn cache clean --all >/tmp/mercur-yarn-cache.log 2>&1 || true

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
log "Cleaning yarn cache (prod)"
rm -rf "$PROD_DIR/.yarn/cache" "$PROD_DIR/.yarn/install-state.gz"
yarn cache clean --all >/tmp/mercur-yarn-cache-prod.log 2>&1 || true

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
