---
name: mercur-blocks
description: Discover, evaluate, install, and verify Mercur blocks safely using `blocks.json` aliases and Mercur CLI workflows. Use when adding or updating blocks in a Mercur project.
---

# Mercur Blocks Workflow

Use this skill when:
- evaluating whether a block fits a project
- adding a block through Mercur CLI
- reviewing the impact of an installed block
- updating a block and checking for drift

## Read first

Start with:
- project root `blocks.json`
- the Mercur CLI command that matches the task: `search`, `view`, `add`, or `diff`

## `blocks.json` alias model

In the basic starter, aliases route block files into:
- `api` -> `packages/api/src`
- `admin` -> `apps/admin/src`
- `vendor` -> `apps/vendor/src`

Always reason about a block by alias destination, not just by the block name.

## Decision flow

1. Search for the block if the exact name is not known.
2. View the block before adding it.
3. Identify which aliases and workspaces it will touch.
4. Add the block.
5. Inspect installed files and configuration impact.
6. Run the smallest relevant verification set.

## Post-install checklist

- Which aliases were used: `api`, `admin`, `vendor`?
- Did the block add routes, modules, links, workflows, or subscribers?
- Does `packages/api/medusa-config.ts` need module registration or options?
- Did the block add API routes that require route type codegen?
- Did the block add UI routes that require admin or vendor build verification?
- Did the block include docs telling the user to configure env vars, providers, or middleware?

## Useful commands

```bash
npx @mercurjs/cli@canary search --query <keyword>
npx @mercurjs/cli@canary view <block>
npx @mercurjs/cli@canary add <block>
npx @mercurjs/cli@canary diff <block>
```

## Verification defaults

- Backend touched: run backend build and the relevant tests
- Admin touched: run admin build or lint
- Vendor touched: run vendor build or lint
- Routes or SDK types touched: run codegen and confirm generated types still make sense

## Avoid

- adding a block without checking its docs or install impact first
- assuming a block only writes into one workspace
- leaving `medusa-config.ts` or env setup stale after install
- updating blocks blindly without checking `diff`

## Output expectations

When summarizing a block task:
- name the block
- list which aliases/workspaces it touched
- state any config, codegen, or verification follow-up
