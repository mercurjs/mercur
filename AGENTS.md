# Mercur Agent Guide

This file is the primary workflow guide for agents and contributors working in this repository.

Use this file to answer four questions before making a non-trivial change:
- where should I look first?
- when do I need a spec?
- which contract surfaces am I touching?
- what must I verify before closing the task?

`CLAUDE.md` remains in the repo as a high-level architecture and context companion. Operational workflow, routing, and verification rules live here.

## Core Principles

- **Spec-first**: qualifying changes start with a spec, not code
- **Behavior preservation**: refactors must not change observable behavior
- **Minimal impact**: smallest change that achieves the goal
- **Verify before closing**: state what was verified, not verified, and residual risk
- **Self-improvement**: update `.ai/lessons.md` after corrections or non-obvious discoveries

## Self-Improvement

When you discover a non-obvious lesson, regression, or correction:
1. Check if `.ai/lessons.md` already covers it
2. If not, add a lesson with: rule, rationale, scope
3. If the lesson affects a skill's hard rules, update that skill too

## Purpose

This guide defines:
- the primary development workflow for agents
- when specifications are required
- package-level task routing
- public contract surfaces that must not drift silently
- the minimum verification expected before a task is complete

## Workflow

For any non-trivial task, follow this sequence:
1. understand the request and identify touched areas
2. read this file
3. read every matching package guide from the Task Router
4. check `.ai/specs/` for an existing spec
5. create or update a spec if the change meets the spec threshold
6. implement in small phases
7. run the relevant verification
8. document what was verified before closing the task

If a task changes behavior across package boundaries, do not jump straight to code. First identify:
- touched packages
- touched contract surfaces
- required verification
- whether a spec is required

## When A Spec Is Required

Mercur uses a medium spec threshold.

A spec is required when a change:
- adds a feature spanning more than one package
- changes API behavior, request validation, or response shape
- changes generated route/client behavior
- changes shared DTOs or public types consumed across packages
- changes registry block installation behavior or copied file layout
- changes a persistent data model or requires database migrations
- changes a major admin or vendor user flow
- changes docs and code contracts together
- introduces migration, compatibility, or rollout concerns

A spec is usually not required for:
- typo fixes
- isolated refactors with no behavior change
- small bug fixes contained to one package with no public contract impact
- styling-only or copy-only UI edits

Specifications live under `.ai/specs/` and should use `.ai/specs/TEMPLATE.md`.
In Mercur, specs are business-first: explain the problem, outcome, scope, business rules, and acceptance criteria before listing files, routes, DTOs, or implementation phases.

## Quick Reference

| Task type | Read these guides | Skills to load |
|-----------|-------------------|----------------|
| Admin bugfix (no UI pattern change) | this file + `packages/admin/AGENTS.md` | — |
| Admin list or detail page | this file + `packages/admin/AGENTS.md` | `admin-page-ui` |
| Admin form (drawer / modal) | this file + `packages/admin/AGENTS.md` | `admin-form-ui` |
| Admin tabbed wizard | this file + `packages/admin/AGENTS.md` | `admin-tab-ui` + `admin-form-ui` |
| Admin custom UI component | this file + `packages/admin/AGENTS.md` | `medusa-ui-conformance` |
| Admin CC migration | this file + `packages/admin/AGENTS.md` | `compound-components-migration-review` + `cc-alignment` |
| Vendor UI page or form | this file + `packages/vendor/AGENTS.md` | same admin-* skills apply |
| Backend route / workflow | this file + `packages/core-plugin/AGENTS.md` | — |
| Registry block | this file + `packages/registry/AGENTS.md` | `mercur-blocks` |
| CLI usage | this file | `mercur-cli` |
| Cross-package feature | this file + all touched package guides | write spec first |
| Code review (any package) | this file + touched package guides | `code-review` |
| Writing a spec | this file | `spec-writing` |
| Integration test | this file + `integration-tests/AGENTS.md` | — |
| Shared types change | this file + `packages/types/AGENTS.md` | — |
| Migration (1.x → 2.0) | this file + `docs/migrations/README.md` | `migration-guide` |

## Task Router

Read every guide that matches the work you are doing:

- Migration documentation and guides: `docs/migrations/README.md`
- Backend API, Medusa plugin behavior, workflows, links, codegen impact: `packages/core-plugin/AGENTS.md`
- Admin UI pages, forms, and admin UX regressions: `packages/admin/AGENTS.md`
- Vendor UI pages, hooks, auth/public flows, and vendor UX regressions: `packages/vendor/AGENTS.md`
- Registry block development, copied-code constraints, install path behavior: `packages/registry/AGENTS.md`
- Shared public DTOs, HTTP shapes, and cross-package type propagation: `packages/types/AGENTS.md`
- Contract and integration verification: `integration-tests/AGENTS.md`

There is no dedicated `apps/docs/AGENTS.md` in the first rollout. Documentation and OpenAPI rules are governed here and in the touched package guides.

## Public Contract Surfaces

Treat the following as public contracts. Do not change them silently:

- API route paths and method semantics
- request validation and response envelope shapes
- generated `Routes` types from `@mercurjs/core-plugin/_generated`
- public package exports and package entrypoints
- `@mercurjs/types` HTTP shapes and other consumed public types
- persistent data models and required database migrations when deployed behavior depends on them
- CLI command names, options, and behavior
- registry block file layout, metadata, and install resolution behavior
- public docs examples and setup instructions
- dashboard configuration surfaces such as `mercur.config.ts`

If any of these change, the spec must include migration or compatibility notes.

### Stability Classification

- **Frozen** (breaking change requires spec + migration notes): API route paths, response envelope shapes, generated Routes types, CLI command names, registry block file layout
- **Stable** (can tighten, not loosen; document changes): request validation, public package exports, dashboard configuration surfaces
- **Internal** (free to change): implementation details, private utilities, test helpers

## Source Of Truth Layers

Use each layer intentionally:

- feature intent, business context, and phased delivery: `.ai/specs/*.md`
- runtime backend behavior: source code in `packages/core-plugin` and `packages/registry`
- shared public DTO and HTTP type surface: `packages/types`
- generated route contract: `@mercurjs/core-plugin/_generated`
- public docs and API presentation: `apps/docs`
- behavior proof: `integration-tests`

Do not maintain duplicate manual contracts unless there is a clear reason.

## Package Boundaries

- `packages/core-plugin`: Medusa plugin backend, routes, links, workflows, modules
- `packages/admin`: admin dashboard UI package
- `packages/vendor`: vendor dashboard UI package
- `packages/registry`: official block registry and copied source for downstream installs
- `packages/client`: typed runtime API client
- `packages/cli`: scaffolding, add/init, registry tooling, route type generation
- `packages/dashboard-sdk`: dashboard app integration and virtual modules
- `packages/types`: shared public type surfaces
- `apps/docs`: docs and API reference presentation
- `integration-tests`: HTTP contract and behavior verification

When a change crosses one of these boundaries, call it out explicitly in the spec or task summary.

## Critical Rules

- Never import from `@components/`, `@hooks/`, `@lib/` in registry blocks — use `@mercurjs/dashboard-shared`
- Never create barrel `index.ts` in `workflows/` or `steps/` — it overwrites other blocks during install
- Always guard keyboard submit paths in handler, not just button UI
- Route type codegen reads `AuthenticatedMedusaRequest<Body>` + `MedusaResponse<Resp>` generics — these are the contract
- SDK does not support multipart/form-data — file uploads require raw fetch
- 491+ pre-existing TS errors in admin — do not treat as regressions from current work

## Verification Expectations

Run the smallest set of relevant checks, but do not skip checks that prove a touched contract still holds.

Typical checks include:
- repo type checks: `bun run check-types`
- targeted package build or lint in the touched package
- integration tests when API behavior changes
- docs updates when public usage or contract behavior changes
- migration review when module schema or install-time database expectations change
- codegen validation when route signatures or paths change

Before closing a task, state:
- what was verified
- what was not verified
- any residual risk

## Repo-Local Skills

Canonical, agent-neutral repo-local skills live in `.ai/skills/`.
Runtime-specific mirrors exist in `.claude/skills/` (Claude Code) and `.codex/skills/` (Codex).

### Shared skills (`.ai/skills/`)

| Skill | Path | Use when |
|-------|------|----------|
| `mercur-cli` | `.ai/skills/mercur-cli/SKILL.md` | Choosing and using Mercur CLI commands for create/init/add/search/view/diff workflows |
| `mercur-blocks` | `.ai/skills/mercur-blocks/SKILL.md` | Discovering, evaluating, adding, and diffing Mercur blocks safely |
| `medusa-ui-conformance` | `.ai/skills/medusa-ui-conformance/SKILL.md` | Adding or modifying reusable admin/vendor UI, especially custom interactive components or Medusa/Radix composition |
| `compound-components-migration-review` | `.ai/skills/compound-components-migration-review/SKILL.md` | Reviewing admin Compound Component migrations |
| `cc-alignment` | `.ai/skills/cc-alignment/SKILL.md` | Aligning CC pages to vendor standard naming/structure, fixing DTS build blockers |
| `admin-ui-review` | `.ai/skills/admin-ui-review/SKILL.md` | Reviewing admin UI code for pattern consistency, anti-patterns, i18n |
| `admin-page-ui` | `.ai/skills/admin-page-ui/SKILL.md` | Creating or modifying admin pages (list, detail, sections, action menus) |
| `admin-form-ui` | `.ai/skills/admin-form-ui/SKILL.md` | Creating or modifying forms (Form.Field, drawers, modals, submit guards) |
| `admin-tab-ui` | `.ai/skills/admin-tab-ui/SKILL.md` | Creating custom tabs for TabbedForm wizards (defineTabMeta, layout, sections) |
| `code-review` | `.ai/skills/code-review/SKILL.md` | Reviewing code changes for contract compliance, type safety, and regression risk |
| `spec-writing` | `.ai/skills/spec-writing/SKILL.md` | Writing or reviewing specifications following the skeleton-first approach |
| `migration-guide` | `.ai/skills/migration-guide/SKILL.md` | Planning or executing migration from Mercur 1.x to 2.0 |

### Runtime-specific skills

| Skill | Path | Runtime | Use when |
|-------|------|---------|----------|
| `compound-components-migration` | `.claude/skills/compound-components-migration/SKILL.md` | Claude Code | Planning and implementing admin CC/TabbedForm migrations with regression prevention |

### Source of truth

- `.ai/skills/` is the **single source of truth** for all shared skill content.
- `.claude/skills/` holds Claude Code specific skills that are not shared across runtimes.
- `.codex/skills/` contains pointer files for Codex discovery — no duplicated content.
- When creating or updating a shared skill, always edit `.ai/skills/` first.

## Simplicity Rule

Prefer:
- one spec per qualifying feature
- one obvious package guide per major area
- one clear verification path per change

Avoid:
- parallel governance systems with overlapping rules
- duplicate copies of the same conventions in multiple files
- speculative process additions before they are needed
