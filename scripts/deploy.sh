#!/usr/bin/env bash
# Deploy Mercur to the VPS.
# Runs locally; everything inside the heredoc executes on the remote host.
#
# Multiple independent instances live side by side on one host. Each has its
# own deploy dir, systemd service, port, domain, Postgres database and Redis
# db-index. Select one with MERCUR_INSTANCE (default 1 = the original deploy).
# Instance 2 (public-demo) is bootstrapped on first deploy if its host
# artifacts are missing — .env, Postgres DB, systemd unit and Caddy vhost.
# Every bootstrap step is idempotent, so re-deploying is safe.
#
# Usage:
#   ./deploy.sh                          # instance 1 (new.mercur.dev :9000)
#   MERCUR_INSTANCE=2 ./deploy.sh        # instance 2 (platform.mercurjs.com :9001)
#   MERCUR_HOST=root@1.2.3.4 ./deploy.sh
#   MERCUR_BRANCH=main ./deploy.sh
#   MERCUR_BACKEND_URL=https://x.dev MERCUR_INSTANCE=2 ./deploy.sh  # override domain
set -euo pipefail

HOST="${MERCUR_HOST:-root@167.233.17.178}"
BRANCH="${MERCUR_BRANCH:-main}"
INSTANCE="${MERCUR_INSTANCE:-1}"

# Per-instance configuration. Everything instance-scoped is derived here and
# passed to the remote over the ssh env line. Instance 1 keeps the original
# values so `./deploy.sh` behaves exactly as before.
case "$INSTANCE" in
  1)
    DEPLOY_DIR="/root/marketplace"
    SERVICE="mercur-api"
    PORT="9000"
    BACKEND_URL="${MERCUR_BACKEND_URL:-https://new.mercur.dev}"
    DB_NAME=""        # existing DB — leave the .env DATABASE_URL untouched
    REDIS_DB=""       # existing Redis db-index — leave REDIS_URL untouched
    ;;
  2)
    DEPLOY_DIR="/root/public-demo"
    SERVICE="mercur-api-public-demo"
    PORT="9001"
    BACKEND_URL="${MERCUR_BACKEND_URL:-https://platform.mercurjs.com}"
    DB_NAME="public-demo"
    REDIS_DB="1"
    ;;
  *)
    echo "Unknown MERCUR_INSTANCE='$INSTANCE' (expected 1 or 2)" >&2
    exit 1
    ;;
esac

DOMAIN="${BACKEND_URL#https://}"
DOMAIN="${DOMAIN#http://}"
DOMAIN="${DOMAIN%/}"

echo "→ Deploying $BRANCH to $HOST (instance $INSTANCE: $BACKEND_URL, :$PORT, $DEPLOY_DIR)"

ssh -o ConnectTimeout=10 "$HOST" \
  BRANCH="$BRANCH" \
  INSTANCE="$INSTANCE" \
  DEPLOY_DIR="$DEPLOY_DIR" \
  SERVICE="$SERVICE" \
  PORT="$PORT" \
  DOMAIN="$DOMAIN" \
  MERCUR_BACKEND_URL="$BACKEND_URL" \
  DB_NAME="$DB_NAME" \
  REDIS_DB="$REDIS_DB" \
  bash -s <<'REMOTE'
set -euo pipefail

SOURCE_DIR="/root/mercur"

# Instance 1 is the canonical template every other instance clones from.
BASE_DEPLOY_DIR="/root/marketplace"
BASE_ENV="$BASE_DEPLOY_DIR/packages/api/.env"

LOCK="/tmp/mercur-deploy-$INSTANCE.lock"

exec 9>"$LOCK"
flock -n 9 || { echo "Another deploy for instance $INSTANCE is already running"; exit 1; }

log() { echo "[$(date +'%F %T')] [i$INSTANCE] $*"; }

# 1. Pull upstream (shared source checkout — all instances build from it)
log "Fetching $BRANCH"
cd "$SOURCE_DIR"
# Explicit refspec so the remote-tracking ref updates (a bare
# `git fetch origin <branch>` only writes FETCH_HEAD on some setups).
git fetch --prune origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"
git reset --hard "origin/$BRANCH"
log "Now at $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"

# 2. Sync templates/basic → $DEPLOY_DIR.
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

# 2.5 Provision instance-scoped host artifacts. All steps are idempotent and
#     no-op for instance 1 (its DB/env/service/vhost already exist), so this
#     block is safe to run on every deploy.
ENV_FILE="$DEPLOY_DIR/packages/api/.env"

# set_env FILE KEY VALUE — upsert a KEY=VALUE line.
set_env() {
  local f="$1" k="$2" v="$3"
  if grep -q "^$k=" "$f"; then
    sed -i "s#^$k=.*#$k=$v#" "$f"
  else
    printf '%s=%s\n' "$k" "$v" >> "$f"
  fi
}

# (a) .env — clone instance 1's env, then swap the instance-scoped keys.
if [ ! -f "$ENV_FILE" ]; then
  log "Bootstrapping $ENV_FILE from $BASE_ENV"
  mkdir -p "$(dirname "$ENV_FILE")"
  cp "$BASE_ENV" "$ENV_FILE"

  # DATABASE_URL: keep host/creds, swap the database name to $DB_NAME.
  if [ -n "$DB_NAME" ]; then
    sed -i -E "s#^(DATABASE_URL=.*/)[^/?]+(\?.*)?\$#\1${DB_NAME}\2#" "$ENV_FILE"
  fi
  # REDIS_URL: dedicated db-index so instances don't share keys.
  if [ -n "$REDIS_DB" ]; then
    sed -i -E "s#^(REDIS_URL=[^[:space:]]*?)(/[0-9]+)?\$#\1/${REDIS_DB}#" "$ENV_FILE"
  fi
  # Port + CORS + vendor URL for this instance's domain.
  set_env "$ENV_FILE" PORT "$PORT"
  set_env "$ENV_FILE" STORE_CORS  "https://$DOMAIN"
  set_env "$ENV_FILE" ADMIN_CORS  "https://$DOMAIN"
  set_env "$ENV_FILE" VENDOR_CORS "https://$DOMAIN"
  set_env "$ENV_FILE" AUTH_CORS   "https://$DOMAIN"
  set_env "$ENV_FILE" MERCUR_VENDOR_URL "https://$DOMAIN/seller"
  log "Wrote instance .env (PORT=$PORT, DB=$DB_NAME, REDIS db $REDIS_DB)"
else
  # Existing instance: keep credentials, just ensure PORT matches.
  set_env "$ENV_FILE" PORT "$PORT"
fi

# (b) Postgres database — create if missing (owned by the same role as the
#     base instance). Uses the local `postgres` superuser via sudo.
if [ -n "$DB_NAME" ] && command -v psql >/dev/null 2>&1; then
  if sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
    log "Postgres database $DB_NAME already exists"
  else
    DB_OWNER=$(sed -nE 's#^DATABASE_URL=[a-z]+://([^:]+):.*#\1#p' "$ENV_FILE")
    log "Creating Postgres database $DB_NAME (owner ${DB_OWNER:-mercur})"
    sudo -u postgres createdb -O "${DB_OWNER:-mercur}" "$DB_NAME"
  fi
fi

# (c) systemd unit — self-contained, matching the base instance's runtime
#     (bun run start, EnvironmentFile=.env so PORT is read from it).
UNIT="/etc/systemd/system/$SERVICE.service"
if [ ! -f "$UNIT" ]; then
  log "Bootstrapping systemd unit $UNIT"
  cat > "$UNIT" <<UNITEOF
[Unit]
Description=Mercur Medusa API (instance $INSTANCE)
After=network.target postgresql.service redis-server.service
Requires=postgresql.service redis-server.service

[Service]
Type=simple
WorkingDirectory=$DEPLOY_DIR/packages/api/.medusa/server
EnvironmentFile=$DEPLOY_DIR/packages/api/.env
ExecStart=/usr/local/bin/bun run start
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/$SERVICE.log
StandardError=append:/var/log/$SERVICE.err.log

[Install]
WantedBy=multi-user.target
UNITEOF
  systemctl daemon-reload
  systemctl enable "$SERVICE"
fi

# (d) Caddy vhost — reverse-proxy the domain to this instance's port, with the
#     /dist → /static rewrite the file provider depends on.
CADDYFILE="/etc/caddy/Caddyfile"
if [ -f "$CADDYFILE" ] && ! grep -qE "^[[:space:]]*$DOMAIN[[:space:]]*\{" "$CADDYFILE"; then
  log "Appending Caddy vhost for $DOMAIN → :$PORT"
  mkdir -p /var/log/caddy
  cat >> "$CADDYFILE" <<CADDYEOF

$DOMAIN {
  encode gzip zstd

  handle_path /dist/* {
    rewrite * /static{uri}
    reverse_proxy 127.0.0.1:$PORT
  }

  reverse_proxy 127.0.0.1:$PORT

  log {
    output file /var/log/caddy/$DOMAIN.log
  }
}
CADDYEOF
  if command -v caddy >/dev/null 2>&1 && caddy validate --config "$CADDYFILE" >/tmp/caddy-validate.log 2>&1; then
    systemctl reload caddy || systemctl restart caddy || true
  else
    log "Caddy validate failed — vhost appended but NOT reloaded; see /tmp/caddy-validate.log"
  fi
fi

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

# Patch the dashboard Vite configs. Two things baked in here:
#   1. backendUrl: @mercurjs/dashboard-sdk defaults it to http://localhost:9000,
#      which gets baked into the SPA bundle and breaks every non-local deploy.
#      We pass an empty string so API calls go to the same origin the dashboard
#      is served from.
#   2. Plugin loaded via createRequire, not a static import: the plugin's ESM
#      build can't dynamic-require medusa-config.ts, so base detection silently
#      falls back to "/" and every panel asset 404s under its sub-path.
#      createRequire resolves its CJS build, where dynamic require works.
for app in admin vendor; do
  cat > "$DEPLOY_DIR/apps/$app/vite.config.ts" <<VITE
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const { mercurDashboardPlugin } = require("@mercurjs/dashboard-sdk/vite")

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
#
# Rewriting the direct deps in our own manifests is not enough: the published
# @mercurjs/admin and @mercurjs/vendor tarballs declare @mercurjs/* deps of
# their own (dashboard-sdk, dashboard-shared, types, ...) as plain npm specs.
# yarn resolves those transitive edges through the registry and hits the same
# quarantine. We therefore also write `resolutions` for every @mercurjs/* pkg
# at VERSION → tarball URL; resolutions override transitive specs too.
VERSION=$(python3 -c "import json; print(json.load(open('$SOURCE_DIR/packages/core/package.json'))['version'])")

# Rewrites @mercurjs/* deps to tarball URLs (and writes root `resolutions`)
# for the package.json(s) under $1. Used for both the workspace and the
# compiled prod dir — the latter's package.json is regenerated by
# `medusa build` and never inherits the workspace rewrite, so its transitive
# @mercurjs/* edges would otherwise re-hit the quarantine.
#
# VERSION comes from the synced source tree (packages/core/package.json), i.e.
# the latest canary on $BRANCH. We deliberately IGNORE whatever @mercurjs/*
# version templates/basic pins (e.g. an older 2.2.0-rc.0) and force every
# @mercurjs/* dep — direct and transitive — to VERSION. Otherwise the deploy
# ships a stale panel bundle that lags behind main.
rewrite_mercur_deps() {
  ( cd "$1" && VERSION="$VERSION" SOURCE_DIR="$SOURCE_DIR" python3 - <<'PY'
import json, glob, os
VERSION = os.environ["VERSION"]
SOURCE_DIR = os.environ["SOURCE_DIR"]
SCOPE = "@mercurjs/"
def tarball(name, ver):
    base = name.split("/", 1)[1]
    return f"https://registry.npmjs.org/{name}/-/{base}-{ver}.tgz"

# Mirror the bun workspace's single-zod pin into a yarn `resolution`. The repo
# collapses every zod to one version via npm `overrides`; yarn 4 ignores
# `overrides` and reads `resolutions`, so without this Medusa 2.16's transitive
# zod@^4 installs alongside the pinned v3 and the two instances clash
# ("Cannot read properties of undefined (reading '_zod')" on schema parse).
zod_pin = None
try:
    with open(f"{SOURCE_DIR}/package.json") as f:
        zod_pin = (json.load(f).get("overrides") or {}).get("zod")
except Exception:
    pass

# Enumerate every published @mercurjs/* package name from the source tree.
mercur_names = set()
for path in glob.glob(f"{SOURCE_DIR}/packages/*/package.json") + glob.glob(f"{SOURCE_DIR}/packages/providers/*/package.json"):
    with open(path) as f:
        name = json.load(f).get("name")
    if name and name.startswith(SCOPE):
        mercur_names.add(name)

for path in ["package.json"] + glob.glob("packages/*/package.json") + glob.glob("apps/*/package.json"):
    if not os.path.exists(path):
        continue
    with open(path) as f:
        data = json.load(f)
    changed = False
    for key in ("dependencies", "devDependencies", "peerDependencies", "optionalDependencies"):
        deps = data.get(key) or {}
        for name, spec in list(deps.items()):
            # Force any published @mercurjs/* dep to the source-tree VERSION,
            # regardless of the version templates/basic pins. `workspace:*`
            # edges are left alone — those are resolved locally, not fetched.
            if name in mercur_names and not str(spec).startswith("workspace:"):
                url = tarball(name, VERSION)
                if deps[name] != url:
                    deps[name] = url
                    changed = True
    # Force every @mercurjs/* edge (direct + transitive, any requested range)
    # to the VERSION tarball via root resolutions. An unversioned resolution
    # key overrides all specifiers, so a manifest pinning an older tag
    # (e.g. 2.2.0-rc.0) still resolves to VERSION.
    if path == "package.json":
        resolutions = data.get("resolutions") or {}
        for name in sorted(mercur_names):
            url = tarball(name, VERSION)
            if resolutions.get(name) != url:
                resolutions[name] = url
                changed = True
        if zod_pin and resolutions.get("zod") != zod_pin:
            resolutions["zod"] = zod_pin
            changed = True
        if resolutions:
            data["resolutions"] = resolutions
    if changed:
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
            f.write("\n")
PY
  )
}

log "Rewriting quarantined @mercurjs/* deps to tarball URLs (v$VERSION)"
rewrite_mercur_deps "$DEPLOY_DIR"

# Clean yarn caches. The npm registry can flip a just-published version into
# "quarantined" state for a few minutes; yarn caches that metadata and then
# refuses to resolve it (YN0016). Wipe both the global mirror and any local
# `.yarn/cache` so the next install re-fetches fresh metadata.
log "Cleaning yarn cache"
rm -rf "$DEPLOY_DIR/.yarn/cache" "$DEPLOY_DIR/.yarn/install-state.gz"
yarn cache clean --all >/tmp/mercur-yarn-cache-$INSTANCE.log 2>&1 || true

log "yarn install (workspace)"
yarn install >/tmp/mercur-yarn-$INSTANCE.log 2>&1 || { tail -n 40 /tmp/mercur-yarn-$INSTANCE.log; exit 1; }

log "yarn build"
yarn build >/tmp/mercur-build-$INSTANCE.log 2>&1 || { tail -n 40 /tmp/mercur-build-$INSTANCE.log; exit 1; }

# 4. Prepare the compiled server (`.medusa/server` is recreated by `medusa build`)
PROD_DIR="$DEPLOY_DIR/packages/api/.medusa/server"
log "Preparing prod dir at $PROD_DIR"
cp "$DEPLOY_DIR/packages/api/.env" "$PROD_DIR/.env"

# Point the local file provider at the public origin. Without this it
# defaults to http://localhost:9000/static and every uploaded image
# (category thumbnails, product media) renders broken in the dashboards
# served from $MERCUR_BACKEND_URL. Medusa serves the upload dir natively
# at /static; Caddy (the reverse proxy on the host) maps /dist/* onto that
# /static/* route, so files resolve at $MERCUR_BACKEND_URL/dist/<key>.
# That Caddy `handle_path /dist/*` rewrite is required for these URLs to
# resolve — it is maintained per-instance in the Caddy vhost (step 2.5).
FILE_BACKEND_URL="${MERCUR_BACKEND_URL%/}/dist"
if grep -q '^FILE_BACKEND_URL=' "$PROD_DIR/.env"; then
  sed -i "s#^FILE_BACKEND_URL=.*#FILE_BACKEND_URL=${FILE_BACKEND_URL}#" "$PROD_DIR/.env"
else
  printf '\nFILE_BACKEND_URL=%s\n' "$FILE_BACKEND_URL" >> "$PROD_DIR/.env"
fi
log "Set FILE_BACKEND_URL=$FILE_BACKEND_URL"

touch "$PROD_DIR/yarn.lock"
[ -f "$PROD_DIR/.yarnrc.yml" ] || echo "nodeLinker: node-modules" > "$PROD_DIR/.yarnrc.yml"

log "Rewriting quarantined @mercurjs/* deps to tarball URLs (prod, v$VERSION)"
rewrite_mercur_deps "$PROD_DIR"

cd "$PROD_DIR"
log "Cleaning yarn cache (prod)"
rm -rf "$PROD_DIR/.yarn/cache" "$PROD_DIR/.yarn/install-state.gz"
yarn cache clean --all >/tmp/mercur-yarn-cache-prod-$INSTANCE.log 2>&1 || true

log "yarn install (prod)"
yarn install >/tmp/mercur-yarn-prod-$INSTANCE.log 2>&1 || { tail -n 40 /tmp/mercur-yarn-prod-$INSTANCE.log; exit 1; }

# 5. Run DB migrations (idempotent)
log "DB migrate"
cd "$DEPLOY_DIR/packages/api"
yarn medusa db:migrate 2>&1 | tail -n 8

# 6. Restart the API service
log "Restarting $SERVICE"
systemctl restart "$SERVICE"

# 7. Wait for it to become healthy
for i in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; then
    log "API healthy ✓ ($(curl -s http://127.0.0.1:$PORT/health))"
    exit 0
  fi
  sleep 2
done

log "API did not become healthy in 40s — inspect: journalctl -u $SERVICE -n 100"
exit 1
REMOTE

echo "✓ Deploy finished (instance $INSTANCE)"
echo "  Admin:  $BACKEND_URL/dashboard"
echo "  Vendor: $BACKEND_URL/seller"
