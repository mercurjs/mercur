# Mercur Basic Starter Agent Guide

This file is the primary workflow guide for agents working inside a project created from the `basic` Mercur template.

Use this file to answer four questions before making a non-trivial change:
- where should I work?
- which starter contract surfaces am I touching?
- which shared skill should I use?
- what should I verify before I finish?

This starter does not require a spec-first workflow. Teams can add planning artifacts later if they want, but this template focuses on operational knowledge for shipping changes safely.

## Adding Features — Check the Registry First

Before implementing any new marketplace feature from scratch, always search the official Mercur registry:

```bash
npx @mercurjs/cli@latest search --query <keyword>
```

Many common features (reviews, team management, wishlists, notifications, chat, CSV import/export, approval flows, Algolia search) are already available as registry blocks. Installing a block is always faster and safer than building from scratch. Use the `mercur-blocks` skill when a block looks like a match.

Only build custom code when the registry has no suitable block.

## Workflow

For any non-trivial task:
1. understand the request
2. read this file
3. if the request is a feature addition — search the registry before touching any code
4. read every matching area guide from the Task Router
5. load a matching skill from `.claude/skills/` when the task is a repeated workflow
6. implement in small steps
7. run the smallest relevant verification set
8. report what was verified and what was not

## Task Router

- Backend API, modules, workflows, links, subscribers, jobs: `packages/api/CLAUDE.md`
- Admin extensions, custom pages, forms, tabs: `apps/admin/CLAUDE.md`
- Vendor extensions, custom pages, vendor flows: `apps/vendor/CLAUDE.md`

## Starter Contract Surfaces

Treat these as public starter contracts. Do not change them silently:

- `blocks.json` aliases and registry configuration
- `packages/api/src/*` structure and custom backend entrypoints
- `packages/api/medusa-config.ts`
- `@acme/api/_generated` route types and codegen-dependent behavior
- `apps/admin/src/*` route and page structure
- `apps/vendor/src/*` route and page structure
- `apps/admin/vite.config.ts` — panel bootstrap via `mercurDashboardPlugin`
- `apps/vendor/vite.config.ts` — panel bootstrap via `mercurDashboardPlugin`

## Shared Skills

Canonical shared skills live in `.claude/skills/`.

Focused core skills in this starter:
- `mercur-cli`
- `mercur-blocks`
- `medusa-ui-conformance`
- `admin-page-ui`
- `admin-form-ui`
- `admin-tab-ui`
- `migration-guide`

Runtime mirrors exist in:
- `.claude/skills/`
- `.codex/skills/`

Use `.claude/skills/` as the source of truth. The runtime folders are compatibility mirrors.

## Typical Verification

Run only what matches the touched area, but do not skip checks that prove a touched contract still holds.

Typical checks:
- root build or workspace build
- backend tests from `packages/api`
- admin or vendor lint/build
- codegen when routes or generated types changed
- manual verification for new pages, routes, or block installs

## Starter Notes

- Mercur CLI registry commands run from the project root where `blocks.json` lives.
- Backend verification often runs from `packages/api`.
- Admin and vendor custom routes are file-based under `src/pages`.
- If a task is about blocks, always use `mercur-blocks`.
- If a task is about CLI choice, initialization, or registry commands, use `mercur-cli`.
- If a task adds custom admin or vendor UI, load `medusa-ui-conformance` before inventing new components.

## AI Resources

- **Docs**: https://docs.mercurjs.com
- **MCP Server**: https://docs.mercurjs.com/mcp — connect your AI agent for documentation search
- **llms.txt**: https://docs.mercurjs.com/llms.txt — machine-readable project summary
- **Skills**: `.claude/skills/` — domain-specific patterns auto-loaded by Claude Code
- **AI Development Guide**: https://docs.mercurjs.com/v2/ai-development/mcp

## Lessons Learned

When you encounter a repeatable bug, a non-obvious gotcha, or learn something that would save time in future sessions, write it to `.claude/lessons.md`.

This file acts as a shared knowledge base across agents and sessions. Before starting non-trivial work, check `.claude/lessons.md` for known issues that might apply.

Format each entry as:
```
### <short title>
<what happened, why, and what to do instead>
```