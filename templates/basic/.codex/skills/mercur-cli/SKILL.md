---
name: mercur-cli
description: Use Mercur CLI commands correctly inside a project created from the Mercur basic starter. Use when choosing between `create`, `init`, `add`, `search`, `view`, and `diff`.
---

# Mercur CLI

Use this skill when:
- creating a new Mercur project
- initializing `blocks.json`
- searching, viewing, adding, or diffing blocks
- deciding whether a command should run from the project root or a workspace

## Command map

- `create` — create a new Mercur project
- `init` — create `blocks.json` in an existing project
- `search` — search the registry
- `view` — inspect a block before installation
- `add` — install a block
- `diff` — compare local installed block files against the registry

## Where commands run

- Run Mercur CLI registry commands from the project root where `blocks.json` lives.
- Run backend verification from `packages/api` after install if backend files changed.
- Run admin or vendor verification from `apps/admin` or `apps/vendor` after UI installs or edits.

## Common flows

### Discover and inspect a block

```bash
npx @mercurjs/cli@canary search --query review
npx @mercurjs/cli@canary view reviews
```

### Add a block

```bash
npx @mercurjs/cli@canary add reviews
```

### Check local drift

```bash
npx @mercurjs/cli@canary diff reviews
```

## After `add`

Always inspect:
- where files landed based on `blocks.json`
- whether `packages/api/medusa-config.ts` needs an update
- whether route types need codegen
- whether backend or app builds should run

## Avoid

- running registry commands outside the project root
- guessing block names without `search` or `view`
- assuming an installed block only changed one workspace
