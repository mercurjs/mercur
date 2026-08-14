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
- `@mercurjs/payout-stripe-connect`

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

### Stable Release

1. Bump the version in every package's `package.json`:

```
"version": "2.X.Y"
```

   Also bump every internal cross-dependency (`@mercurjs/*` and `create-mercur-app`)
   in `packages/*` and `packages/providers/*` to the same `2.X.Y` (see [Internal Dependencies](#internal-dependencies)).

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

4. Commit and tag:

```bash
git add -A
git commit -m "chore: v2.X.Y"
git tag v2.X.Y
git push origin main --tags
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
   in `packages/*` and `packages/providers/*` to the same `2.X.Y-canary.Z` (see [Internal Dependencies](#internal-dependencies)).

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

4. Commit and tag:

```bash
git add -A
git commit -m "chore: v2.X.Y-canary.Z"
git tag v2.X.Y-canary.Z
git push origin canary --tags
```

5. The GitHub Action detects `canary` in the tag name and publishes with `--tag canary`.

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
   in `packages/*` and `packages/providers/*` to the same `2.X.Y-rc.Z` (see [Internal Dependencies](#internal-dependencies)).

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

4. Commit and tag:

```bash
git add -A
git commit -m "chore: v2.X.Y-rc.Z"
git tag v2.X.Y-rc.Z
git push origin canary --tags
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
