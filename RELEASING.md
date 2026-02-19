# Releasing

All packages are published under the `@mercurjs` scope with the `canary` npm tag.

## Published Packages

- `@mercurjs/cli`
- `@mercurjs/client`
- `@mercurjs/types`
- `@mercurjs/dashboard-sdk`
- `@mercurjs/dashboard-shared`
- `@mercurjs/core-plugin`
- `@mercurjs/vendor`

`@mercurjs/registry` is private and not published.

## How to Release

1. Bump the version in every package's `package.json`:

```
"version": "2.0.0-canary.X"
```

Where `X` is the next incremental number (0, 1, 2, ...).

2. Commit and tag:

```bash
git add -A
git commit -m "chore: v1.6.0-canary.X"
git tag v1.6.0-canary.X
git push origin <branch> --tags
```

3. The GitHub Action (`.github/workflows/release.yml`) triggers automatically and:
   - Generates a GitHub Release with changelog via `changelogithub`
   - Builds all packages with `bun run build` (Turborepo)
   - Publishes every non-private package to npm with `--tag canary`

## Installing Canary Packages

```bash
npm install @mercurjs/cli@canary
```

## Versioning Convention

```
v2.0.0-canary.0   # first canary
v2.0.0-canary.1   # second canary
v2.0.0-canary.2   # third canary
...
v2.0.0             # stable (when ready)
```

## Requirements

- `NPM_TOKEN` secret in GitHub repo settings (npm automation token)
- Use conventional commits (`feat:`, `fix:`, `chore:`) for changelog generation
