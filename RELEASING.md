# Releasing

All packages are published under the `@mercurjs` scope on npm.

- **Stable** releases use the `latest` npm tag (default)
- **Canary** releases use the `canary` npm tag

## Published Packages

- `@mercurjs/cli`
- `@mercurjs/client`
- `@mercurjs/types`
- `@mercurjs/dashboard-sdk`
- `@mercurjs/dashboard-shared`
- `@mercurjs/core`
- `@mercurjs/vendor`
- `@mercurjs/payout-stripe-connect`

`@mercurjs/registry` is private and not published.

## How to Release

### Stable Release

1. Bump the version in every package's `package.json`:

```
"version": "2.X.Y"
```

2. Bump every `@mercurjs/*` dependency version inside the `templates/basic` template so newly scaffolded projects pin to the matching release:

   - `templates/basic/package.json` — `@mercurjs/dashboard-sdk`, `@mercurjs/dashboard-shared`, `@mercurjs/client`
   - `templates/basic/packages/api/package.json` — `@mercurjs/core`, `@mercurjs/types`, `@mercurjs/cli`
   - `templates/basic/apps/admin/package.json` — `@mercurjs/admin`
   - `templates/basic/apps/vendor/package.json` — `@mercurjs/vendor`

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

### Canary Release (automated)

Canary releases are **fully automated** — there is no manual version bump and
nothing is committed back to the repo. Every push to the `canary` branch runs
[`.github/workflows/canary.yml`](.github/workflows/canary.yml), which publishes
an ephemeral [Changesets](https://github.com/changesets/changesets) snapshot of
every published `@mercurjs/*` package to npm under the `@canary` dist-tag.

- **Versions are ephemeral and uniform**, e.g. `2.2.0-canary-20260615125707`
  (calculated base + UTC timestamp). All packages share the same version because
  they are version-locked via the `fixed` group in
  [`.changeset/config.json`](.changeset/config.json).
- **Nothing is committed.** The snapshot version is written only to the npm
  tarball, never back to git — so this is fully compatible with branch
  protection on `canary`.
- Internal dependencies use `workspace:*` and are rewritten to the snapshot
  version at publish time by `changeset publish`.

To consume a canary build:

```bash
npm install @mercurjs/cli@canary
```

To reproduce a snapshot locally without publishing:

```bash
bunx changeset add            # or drop a file in .changeset/
bun run version:canary        # changeset version --snapshot canary
# inspect the bumped package.json files, then discard with: git checkout -- packages
```

> The previous manual flow (hand-bumping `2.X.Y-canary.Z`, committing, and
> pushing a tag) is superseded. The `NPM_TOKEN` secret is still required.

## Installing Packages

```bash
# Stable (latest)
npm install @mercurjs/cli

# Canary
npm install @mercurjs/cli@canary
```

## Versioning Convention

```
v2.0.0-canary.0   # first canary
v2.0.0-canary.1   # second canary
...
v2.0.0             # stable
v2.0.1             # patch
v2.1.0             # minor
```

## Requirements

- `NPM_TOKEN` secret in GitHub repo settings (npm automation token)
- Use conventional commits (`feat:`, `fix:`, `chore:`) for changelog generation
- All GitHub Actions must be pinned to full-length commit SHAs (org policy)
