---
name: mercur-blocks
description: Discover, evaluate, install, and verify Mercur blocks in the basic starter using `blocks.json` aliases and CLI workflows.
---

# Mercur Blocks Workflow

Use this skill when:
- evaluating whether a block fits the starter project
- adding a block
- checking installed block impact
- updating a block and reviewing drift

## Alias map

In the basic starter:
- `api` -> `packages/api/src`
- `admin` -> `apps/admin/src`
- `vendor` -> `apps/vendor/src`

Think about block impact by alias destination, not just by name.

## Workflow

1. Search if the exact block name is not known.
2. View the block before installation.
3. Identify which aliases and workspaces it will touch.
4. Add the block.
5. When CLI asks to overwrite `middlewares.ts` — **always decline** and merge manually.
6. Inspect the installed files and the block docs output.
7. Apply all configuration from the block docs (middleware, medusa-config, env vars, migrations).
8. Run `bun run dev` from `packages/api` and check for startup errors before moving on.

## Post-install checklist

- Did files land under `packages/api/src`, `apps/admin/src`, or `apps/vendor/src`?
- Does `packages/api/medusa-config.ts` need module or provider registration?
- Did the block docs specify middleware to add to `src/api/middlewares.ts`?
  - Check the **actual export names and paths** in the installed middleware files — block docs may have wrong paths.
  - Verify the import path matches `./actual/folder/middlewares` not a generic path from docs.
- Did the block add custom modules that need `db:generate <module>` and `db:migrate`?
  - Even if docs don't mention migrations, check if the module has a `models/` directory — if it does, migrations are needed.
- Did the block add UI routes? They must be under `src/routes/` (not `src/pages/`) for the dashboard SDK to detect them.
- Did the block add UI pages that need `export const config: RouteConfig` for sidebar visibility?
- Did the block docs require env vars, plugin options, or config changes?
- Did the block specify npm dependencies? Install any that CLI didn't handle automatically.

## Known issues with block docs

Block docs may contain inaccurate information. Always verify:
- **Middleware import paths**: docs may reference generic paths like `./admin/middlewares` when the actual file is at `./admin/<feature>/middlewares`.
- **Middleware export names**: check the actual `export const` name in the installed file.
- **Missing dependencies**: some blocks import npm packages not listed in their `dependencies` array.
- **Missing migration instructions**: some blocks with custom modules don't mention `db:generate` / `db:migrate` in docs.
- **File conflicts**: multiple blocks may try to write the same file (e.g. workflow hooks). Decline overwrites and merge manually.

## Middleware merging

When adding a block's middleware to `src/api/middlewares.ts`:
1. Read the actual installed middleware file to get the correct export name and path.
2. Add the import to the existing `middlewares.ts`.
3. Spread it into the existing `routes` array.

Do NOT accept CLI's middleware overwrite — it replaces the entire file.

## Useful commands

```bash
npx @mercurjs/cli@latest search --query <keyword>
npx @mercurjs/cli@latest view <block>
npx @mercurjs/cli@latest add <block>
npx @mercurjs/cli@latest diff <block>
```

Run CLI commands from the project root where `blocks.json` lives.
Run `medusa` commands (db:generate, db:migrate) from `packages/api`.

## Avoid

- adding blocks without reviewing their docs first
- accepting middleware.ts overwrite from CLI
- ignoring config or env follow-up after install
- skipping `diff` when reviewing block updates
- trusting docs blindly — verify import paths and dependencies against installed files
