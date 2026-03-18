# Mercur Basic Starter Agent Guide

This file is the primary workflow guide for agents working inside a project created from the `basic` Mercur template.

Use this file to answer four questions before making a non-trivial change:
- where should I work?
- which starter contract surfaces am I touching?
- which shared skill should I use?
- what should I verify before I finish?

This starter does not require a spec-first workflow. Teams can add planning artifacts later if they want, but this template focuses on operational knowledge for shipping changes safely.

## Workflow

For any non-trivial task:
1. understand the request
2. read this file
3. read every matching area guide from the Task Router
4. load a matching skill from `.ai/skills/` when the task is a repeated workflow
5. implement in small steps
6. run the smallest relevant verification set
7. report what was verified and what was not

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

Canonical shared skills live in `.ai/skills/`.

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

Use `.ai/skills/` as the source of truth. The runtime folders are compatibility mirrors.

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
