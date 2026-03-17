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
5. Inspect the installed files.
6. Run the smallest relevant verification set.

## Post-install checklist

- Did files land under `packages/api/src`, `apps/admin/src`, or `apps/vendor/src`?
- Does `packages/api/medusa-config.ts` need module or provider registration?
- Did the block add API routes that require codegen?
- Did the block add UI routes that require admin or vendor build verification?
- Did the block docs require env vars, middleware, or config changes?

## Useful commands

```bash
npx @mercurjs/cli@canary search --query <keyword>
npx @mercurjs/cli@canary view <block>
npx @mercurjs/cli@canary add <block>
npx @mercurjs/cli@canary diff <block>
```

## Avoid

- adding blocks without reviewing their docs first
- ignoring config or env follow-up after install
- skipping `diff` when reviewing block updates
