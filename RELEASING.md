# Releasing

All packages are published under the `@mercurjs` scope on npm, except
`create-mercur-app`, which must stay unscoped so `npm create mercur-app`
resolves to it.

- **Stable** releases use the `latest` npm tag (default)
- **Release candidate** (`rc`) releases use the `rc` npm tag — a preview of an
  upcoming stable release, published for testing before it is promoted
- **Canary** releases use the `canary` npm tag

## Published Packages

- `create-mercur-app`
- `@mercurjs/cli`
- `@mercurjs/client`
- `@mercurjs/types`
- `@mercurjs/dashboard-sdk`
- `@mercurjs/dashboard-shared`
- `@mercurjs/core`
- `@mercurjs/admin`
- `@mercurjs/vendor`
- `@mercurjs/stripe-connector-plugin`

`@mercurjs/registry` is private and not published.

## Internal Dependencies

Published packages depend on each other (e.g. `@mercurjs/admin` → `@mercurjs/client`).
These cross-dependencies **must be pinned to the exact release version** in each
package's `package.json` — never `workspace:*`.

`npm publish` (used by the release workflow) does not resolve the `workspace:`
protocol the way bun/pnpm/yarn do, so a `workspace:*` specifier is published
verbatim and every yarn/npm consumer then fails with `Workspace not found`.
Pinning the exact version makes the tarballs install correctly under any package
manager while still linking to the local workspace during development (the local
package satisfies the exact version).

When bumping the release version, bump these internal specifiers to the same
value. Only the dev-only, never-published workspaces (the repo-root
`package.json` and `apps/*`) may keep `workspace:*`.

`apps/storefront` is the one exception among the apps: it pins exact
`@mercurjs/*` versions rather than `workspace:*`, so both its own `version` and
those specifiers **must** be bumped to the release version on every release too.
If the specifiers lag behind (e.g. storefront stays on an older
`@mercurjs/types`), the package manager pulls the stale published copy from npm
and hoists it to the repo root, where `@mercurjs/core` resolves it and
`medusa build` fails (see issue #1374).

## How to Release

Every release, whatever the channel, follows the same path:

1. Branch off `main` (`chore/v<version>`), bump versions, refresh the lockfile.
2. Run the [pre-release check](#pre-release-check).
3. Open a PR to `main`. `main` is protected by the `Lint` and `Integration tests`
   checks, so the bump cannot be pushed directly.
4. Merge the PR, then tag the **merge commit on `main`** and push only the tag.
   The release workflow triggers on any `v*` tag push and picks the npm tag
   from the tag name (`canary` / `rc` / none → `latest`).

Always tag the merged commit on `main`. Tagging a feature branch publishes
whatever that branch contains under the channel tag, and npm versions cannot be
reused afterwards. There is no long-lived `canary` branch; the one in the repo
is stale and must not be pushed to.

### Pre-release Check

Fresh installs of a scaffolded project resolve transitive dependencies anew, so
they surface peer-dependency drift that the repo's own `bun.lock` hides (e.g.
`@tiptap/*` minor releases that peer on an exact core version, or
`@opentelemetry/api` floating past the range the OpenTelemetry SDK accepts).
Before opening the bump PR, install the template from scratch in a temporary
directory:

```bash
tmp=$(mktemp -d) && cp -R templates/basic/. "$tmp" && cd "$tmp" && rm -rf node_modules bun.lock
bun install 2>&1 | grep -E "warn|error"
```

The output must be empty (a `No version matching` error for `@mercurjs/*` is
expected until the new version is published; temporarily point those
specifiers at the previous release to complete the check). Fix any
`incorrect peer dependency` warning at its source before releasing:

- A version drift inside one package family (tiptap, radix, …): bump the pinned
  versions in the owning package (`packages/dashboard-shared` for tiptap) so
  they match what the family's own ranges resolve to.
- A transitive package floating past a peer range: pin it in
  `templates/basic/package.json` under **both** `overrides` (bun/npm) and
  `resolutions` (yarn), and mirror the pin in the repo-root `overrides`.

### Stable Release

1. Bump the version in every package's `package.json`:

```
"version": "2.X.Y"
```

   Also bump every internal cross-dependency (`@mercurjs/*` and `create-mercur-app`)
   in `packages/*` and `packages/plugins/*` to the same `2.X.Y` (see [Internal Dependencies](#internal-dependencies)).

2. Bump every `@mercurjs/*` dependency version inside the `templates/basic` template so newly scaffolded projects pin to the matching release:

   - `templates/basic/package.json` — `@mercurjs/dashboard-sdk`, `@mercurjs/dashboard-shared`, `@mercurjs/client`
   - `templates/basic/packages/api/package.json` — `@mercurjs/core`, `@mercurjs/types`, `@mercurjs/cli`
   - `templates/basic/apps/admin/package.json` — `@mercurjs/admin`
   - `templates/basic/apps/vendor/package.json` — `@mercurjs/vendor`
   - `apps/storefront/package.json` — its own `version`, plus `@mercurjs/client`, `@mercurjs/types`

3. Refresh the lockfile so workspace versions match `package.json`:

```bash
bun install
```

   Commit the updated `bun.lock` together with the version bumps — CI runs
   `bun install --frozen-lockfile` and will fail otherwise.

4. Commit on a `chore/v2.X.Y` branch, open a PR to `main` and merge it once
   checks pass. Then tag the merge commit:

```bash
git checkout main && git pull
git tag v2.X.Y          # on the merged "chore: v2.X.Y" commit
git push origin v2.X.Y
```

5. The GitHub Action (`.github/workflows/release.yml`) triggers automatically and:
   - Generates a GitHub Release with changelog via `changelogithub`
   - Builds all packages with `bun run build` (Turborepo)
   - Publishes every non-private package to npm with `--tag latest`

### Canary Release

1. Bump the version in every package's `package.json`:

```
"version": "2.X.Y-canary.Z"
```

Where `Z` is the next incremental number (0, 1, 2, ...).

   Also bump every internal cross-dependency (`@mercurjs/*` and `create-mercur-app`)
   in `packages/*` and `packages/plugins/*` to the same `2.X.Y-canary.Z` (see [Internal Dependencies](#internal-dependencies)).
   Since every occurrence of the previous version must move together, a single
   replace covers steps 1 and 2:

```bash
grep -rl "2.X.Y-canary.P" --include=package.json packages apps templates \
  | xargs sed -i '' 's/2\.X\.Y-canary\.P/2.X.Y-canary.Z/g'
```

2. Bump every `@mercurjs/*` dependency version inside the `templates/basic` template to the same `2.X.Y-canary.Z` value:

   - `templates/basic/package.json` — `@mercurjs/dashboard-sdk`, `@mercurjs/dashboard-shared`, `@mercurjs/client`
   - `templates/basic/packages/api/package.json` — `@mercurjs/core`, `@mercurjs/types`, `@mercurjs/cli`
   - `templates/basic/apps/admin/package.json` — `@mercurjs/admin`
   - `templates/basic/apps/vendor/package.json` — `@mercurjs/vendor`
   - `apps/storefront/package.json` — its own `version`, plus `@mercurjs/client`, `@mercurjs/types`

3. Refresh the lockfile so workspace versions match `package.json`:

```bash
bun install
```

   Commit the updated `bun.lock` together with the version bumps — CI runs
   `bun install --frozen-lockfile` and will fail otherwise.

4. Commit on a `chore/v2.X.Y-canary.Z` branch, open a PR to `main` and merge
   it once checks pass. Then tag the merge commit:

```bash
git checkout main && git pull
git tag v2.X.Y-canary.Z   # on the merged "chore: v2.X.Y-canary.Z" commit
git push origin v2.X.Y-canary.Z
```

5. The GitHub Action detects `canary` in the tag name and publishes with `--tag canary`.

6. Verify the publish. The workflow reports success as soon as npm accepts each
   tarball, but large packages (`@mercurjs/core`) can take 10–15 minutes of
   registry-side processing before the version resolves. Check every package:

```bash
for p in core cli client types admin vendor dashboard-sdk dashboard-shared stripe-connector-plugin; do
  echo "@mercurjs/$p: $(npm view @mercurjs/$p dist-tags.canary)"
done
echo "create-mercur-app: $(npm view create-mercur-app dist-tags.canary)"
```

### Release Candidate

A release candidate is a preview of an upcoming stable release. It is believed
shippable and is published so it can be tested before being promoted to
`latest`. Once an `rc` is verified, cut the stable release with the same
`2.X.Y` version (dropping the `-rc.Z` suffix).

1. Bump the version in every package's `package.json`:

```
"version": "2.X.Y-rc.Z"
```

Where `Z` is the next incremental number (0, 1, 2, ...).

   Also bump every internal cross-dependency (`@mercurjs/*` and `create-mercur-app`)
   in `packages/*` and `packages/plugins/*` to the same `2.X.Y-rc.Z` (see [Internal Dependencies](#internal-dependencies)).

2. Bump every `@mercurjs/*` dependency version inside the `templates/basic` template to the same `2.X.Y-rc.Z` value:

   - `templates/basic/package.json` — `@mercurjs/dashboard-sdk`, `@mercurjs/dashboard-shared`, `@mercurjs/client`
   - `templates/basic/packages/api/package.json` — `@mercurjs/core`, `@mercurjs/types`, `@mercurjs/cli`
   - `templates/basic/apps/admin/package.json` — `@mercurjs/admin`
   - `templates/basic/apps/vendor/package.json` — `@mercurjs/vendor`
   - `apps/storefront/package.json` — its own `version`, plus `@mercurjs/client`, `@mercurjs/types`

3. Refresh the lockfile so workspace versions match `package.json`:

```bash
bun install
```

   Commit the updated `bun.lock` together with the version bumps — CI runs
   `bun install --frozen-lockfile` and will fail otherwise.

4. Commit on a `chore/v2.X.Y-rc.Z` branch, open a PR to `main` and merge it
   once checks pass. Then tag the merge commit:

```bash
git checkout main && git pull
git tag v2.X.Y-rc.Z       # on the merged "chore: v2.X.Y-rc.Z" commit
git push origin v2.X.Y-rc.Z
```

5. The GitHub Action detects `rc` in the tag name and publishes with `--tag rc`.

## Installing Packages

```bash
# Stable (latest)
npm install @mercurjs/cli

# Release candidate
npm install @mercurjs/cli@rc

# Canary
npm install @mercurjs/cli@canary
```

## Versioning Convention

```
v2.0.0-canary.0   # first canary
v2.0.0-canary.1   # second canary
...
v2.0.0-rc.0        # first release candidate
v2.0.0-rc.1        # second release candidate
...
v2.0.0             # stable
v2.0.1             # patch
v2.1.0             # minor
```

## Requirements

- `NPM_TOKEN` secret in GitHub repo settings (npm automation token)
- Use conventional commits (`feat:`, `fix:`, `chore:`) for changelog generation
- All GitHub Actions must be pinned to full-length commit SHAs (org policy)
