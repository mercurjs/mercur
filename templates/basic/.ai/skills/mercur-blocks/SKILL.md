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

## Verification before handoff

After completing post-install config, always start the project and confirm it comes up clean before reporting the work as done:

1. Start the backend: `npx medusa develop` (from `packages/api`)
2. Watch the output for startup errors — module resolution failures, migration errors, missing env vars.
3. If the block added admin or vendor UI, start the relevant panel and confirm the build succeeds.
4. Fix any issues found before handing off. Do not report the work as complete if the project does not start.

Only mark the task complete when the project starts without errors.

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
- reporting work as complete before verifying the project starts
