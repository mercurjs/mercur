# Project Agent Guide

This file is the primary workflow guide for agents and contributors working in this repository.

Use this file to answer four questions before making a non-trivial change:
- where should I look first?
- when do I need a spec?
- which contract surfaces am I touching?
- what must I verify before closing the task?

If the repo also has a high-level architecture companion such as `ARCHITECTURE.md`, `README.md`, `CLAUDE.md`, or similar, use it for context only. Operational workflow, routing, and verification rules should live here.

## Purpose

This guide defines:
- the primary development workflow for agents
- when specifications are required
- area-level task routing
- public contract surfaces that must not drift silently
- the minimum verification expected before a task is complete

## Workflow

For any non-trivial task, follow this sequence:
1. understand the request and identify touched areas
2. read this file
3. read every matching area guide from the Task Router
4. check `.ai/specs/` for an existing spec
5. create or update a spec if the change meets the spec threshold
6. implement in small phases
7. run the relevant verification
8. document what was verified before closing the task

If a task changes behavior across area boundaries, do not jump straight to code. First identify:
- touched areas
- touched contract surfaces
- required verification
- whether a spec is required

## When A Spec Is Required

This template uses a medium spec threshold.

A spec is required when a change:
- adds a feature spanning more than one major area
- changes a public API, request validation, or response shape
- changes generated client, SDK, or contract behavior
- changes shared DTOs or public types consumed across areas
- changes installation, scaffolding, or integration behavior
- changes a persistent data model or requires database migrations
- changes a major user or operator flow
- changes docs and code contracts together
- introduces migration, compatibility, rollout, or operational concerns

A spec is usually not required for:
- typo fixes
- isolated refactors with no behavior change
- small bug fixes contained to one area with no public contract impact
- styling-only or copy-only UI edits

Specifications live under `.ai/specs/` and should use `.ai/specs/TEMPLATE.md`.
In this template, specs are business-first: explain the problem, outcome, scope, business rules, and acceptance criteria before listing files, routes, DTOs, or implementation phases.

## Task Router

Replace the example entries below to fit the real project structure.

- Backend or core domain behavior: `path/to/backend/AGENTS.md`
- Frontend or app UX behavior: `path/to/frontend/AGENTS.md`
- Shared contracts, DTOs, or public types: `path/to/contracts/AGENTS.md`
- Integrations, plugins, or install behavior: `path/to/integrations/AGENTS.md`
- Contract, integration, or end-to-end verification: `path/to/tests/AGENTS.md`

If the project has no equivalent for one of these areas, delete the entry instead of leaving dead routes.

## Public Contract Surfaces

Treat the following as public contracts. Do not change them silently:

- API paths, method semantics, and auth expectations
- request validation and response envelope shapes
- generated SDK or client contracts
- public package exports and entrypoints
- shared DTOs and public types
- persistent data models and required database migrations when deployed behavior depends on them
- CLI commands, options, and automation behavior
- install, scaffold, plugin, or extension entrypoints
- configuration surfaces used by deployers or integrators
- public docs examples and setup instructions

If any of these change, the spec must include migration or compatibility notes.

## Source Of Truth Layers

Use each layer intentionally:

- feature intent, business context, and phased delivery: `.ai/specs/*.md`
- runtime behavior: source code in the repo
- shared public DTO and type surface: the contracts or types area in the repo
- generated contract layer: generated SDK, client, or route types if the project has them
- public docs and setup guidance: docs or README surfaces
- behavior proof: tests

Do not maintain duplicate manual contracts unless there is a clear reason.

## Area Boundaries

List the major areas of the repo here in the real project. Example:

- `backend`: core domain logic, APIs, workflows
- `frontend`: app UI and user flows
- `contracts`: shared DTOs, API types, generated clients
- `integrations`: plugins, extensions, install-time behavior
- `tests`: integration, contract, or end-to-end verification

When a change crosses one of these boundaries, call it out explicitly in the spec or task summary.

## Verification Expectations

Run the smallest set of relevant checks, but do not skip checks that prove a touched contract still holds.

Typical checks include:
- repo type checks
- targeted area build or lint
- integration or end-to-end tests when behavior changes
- docs review when public usage changes
- migration review when schema or install-time expectations change
- generated contract validation when routes, DTOs, or public signatures change

Before closing a task, state:
- what was verified
- what was not verified
- any residual risk

## Repo-Local Skills

Canonical, agent-neutral repo-local skills live in `.ai/skills/`.

If a specific tool requires its own discovery format, keep a runtime-specific mirror such as:
- `.codex/skills/`
- `.claude/skills/`

But keep `.ai/skills/` as the canonical source for shared skill content.

Do not create a new skill unless the workflow is repeated often enough to justify one.

## Simplicity Rule

Prefer:
- one spec per qualifying feature
- one obvious area guide per major part of the project
- one clear verification path per change

Avoid:
- parallel governance systems with overlapping rules
- duplicate copies of the same conventions in multiple files
- speculative process additions before they are needed
