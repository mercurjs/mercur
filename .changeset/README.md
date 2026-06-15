# Changesets

This folder is managed by [@changesets/cli](https://github.com/changesets/changesets).

## What it does here

- **`config.json`** version-locks every published `@mercurjs/*` package together
  (`fixed` group) so they always release under one shared version.
- **Canary releases are automatic.** Every push to the `canary` branch runs
  `.github/workflows/canary.yml`, which publishes an ephemeral snapshot of all
  packages to npm under the `@canary` dist-tag. Nothing is committed — snapshot
  versions are not written back to the repo. Install with:

  ```bash
  npm install @mercurjs/cli@canary
  ```

## Adding a changeset (for the upcoming stable flow)

Once the stable release flow lands, describe user-facing changes in your PR:

```bash
bunx changeset
```

Pick the affected packages and a bump level (`patch` / `minor` / `major`), and
write a one-line summary. The file is committed with your PR. Because of the
`fixed` group, bumping any one `@mercurjs/*` package bumps them all.
