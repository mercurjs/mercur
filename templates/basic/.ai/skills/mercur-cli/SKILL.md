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

- Run Mercur CLI registry commands (`search`, `view`, `add`, `diff`) from the **project root** where `blocks.json` lives.
- Run `medusa` commands (`db:generate`, `db:migrate`) from `packages/api` using `bunx medusa`.
- Run admin or vendor verification from `apps/admin` or `apps/vendor`.

## Common flows

### Discover and inspect a block

```bash
npx @mercurjs/cli@canary search --query <keyword>
npx @mercurjs/cli@canary view <block-name>
```

### Add a block

```bash
npx @mercurjs/cli@canary add <block-name>
```

**Important:** When CLI asks to overwrite `middlewares.ts`, always decline (`n`) and merge manually.

### Check local drift

```bash
npx @mercurjs/cli@canary diff <block-name>
```

## After `add`

Follow the block docs output, but verify everything against the actual installed files:

1. **Middleware**: Read the actual middleware file to get the correct export name and path. Add the import and spread to `src/api/middlewares.ts`.
2. **medusa-config.ts**: Add modules, providers, plugin options, or env-driven config as docs specify.
3. **Migrations**: If the block added a module with models, run `bunx medusa db:generate <module>` and `bunx medusa db:migrate` from `packages/api`.
4. **Dependencies**: If the dev server fails with "Cannot find module", install the missing dependency with `bun add <package>` in the correct workspace.
5. **Env vars**: Add any required environment variables to `.env`.
6. **Validation**: Run the dev server and check for startup errors before moving on.

## Known CLI behaviors

- CLI may prompt "You need to create a blocks.json" even when it exists — this happens when running from the wrong directory.
- CLI's `add` outputs the block docs after installation — read them carefully but verify against installed files.
- CLI may install files from one block that overlap with another block (shared files). Declining overwrites preserves existing work.
- The `search` command with `--query ""` returns all available blocks.

## Avoid

- running registry commands outside the project root
- guessing block names without `search` or `view`
- accepting `middlewares.ts` overwrite from CLI
- assuming an installed block only changed one workspace
- trusting block docs blindly for import paths or dependencies
- skipping dev server validation after installing a block
