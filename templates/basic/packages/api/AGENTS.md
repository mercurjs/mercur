# API Workspace Guide

This guide covers work in `packages/api`.

Read this guide when a task touches:
- custom API routes
- modules, services, models, and migrations
- workflows, links, subscribers, or jobs
- backend configuration or generated route types

## Scope

`packages/api` owns:
- Medusa backend configuration in `medusa-config.ts`
- custom code under `src/`
- route type codegen consumed through `./_generated`
- backend tests and verification commands

If `src/` does not exist yet, create only the folders needed for the feature:
- `src/api`
- `src/modules`
- `src/workflows`
- `src/links`
- `src/subscribers`
- `src/jobs`
- `src/scripts`

## Choosing the right backend surface

- Use a **route** when you need an HTTP endpoint.
- Use a **module** when you need a persistent domain model or service boundary.
- Use a **workflow** when the feature is a multi-step business process.
- Use a **link** when the feature defines a relationship across modules.
- Use a **subscriber** when the feature reacts to domain events.
- Use a **job** when the feature runs on a schedule or in the background.

## `blocks.json` relationship

Blocks installed through Mercur CLI route backend files through the `api` alias:
- `api` -> `packages/api/src`

If a block touches backend code, inspect:
- installed file locations
- required updates to `medusa-config.ts`
- whether codegen or backend tests must run afterwards

## Commands that already exist

Run these from `packages/api` unless noted otherwise:
- `dev`
- `dev:codegen`
- `build`
- `test:integration:http`
- `test:integration:modules`
- `test:unit`

## Codegen

Run route codegen when a task changes:
- route paths
- request or response typing used by generated routes
- block-installed API routes that should surface in generated types

If a route task changes generated types, confirm `@acme/api/_generated` still makes sense for consumers.

## `medusa-config.ts`

Review `medusa-config.ts` when a task:
- adds a module
- adds module options
- needs env-driven configuration
- adds a provider, feature, or plugin-level dependency

## Verification

After non-trivial backend changes, verify the smallest relevant set:
- `build`
- `test:integration:http` for changed route behavior
- `test:integration:modules` for module-level behavior
- `test:unit` for local utility or service logic
- `dev:codegen` or equivalent codegen verification when generated types changed

If a block was installed, also verify the files landed in the expected `src/*` locations.
