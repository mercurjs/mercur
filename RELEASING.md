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

2. Commit and tag:

```bash
git add -A
git commit -m "chore: v2.X.Y"
git tag v2.X.Y
git push origin main --tags
```

3. The GitHub Action (`.github/workflows/release.yml`) triggers automatically and:
   - Generates a GitHub Release with changelog via `changelogithub`
   - Builds all packages with `bun run build` (Turborepo)
   - Publishes every non-private package to npm with `--tag latest`

### Canary Release

1. Bump the version in every package's `package.json`:

```
"version": "2.X.Y-canary.Z"
```

Where `Z` is the next incremental number (0, 1, 2, ...).

2. Commit and tag:

```bash
git add -A
git commit -m "chore: v2.X.Y-canary.Z"
git tag v2.X.Y-canary.Z
git push origin canary --tags
```

3. The GitHub Action detects `canary` in the tag name and publishes with `--tag canary`.

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
