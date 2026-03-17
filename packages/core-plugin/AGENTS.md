# Core Plugin Guide

This guide covers backend work in `packages/core-plugin`.

Read this guide when a task touches:
- API routes under `src/api`
- Medusa plugin behavior
- workflows, links, or module-level backend behavior
- module models or migrations under `src/modules`
- route codegen impact
- coupling to docs, client, shared types, or integration tests

## Scope

`packages/core-plugin` owns:
- backend routes for admin, vendor, store, and hooks
- module models, services, loaders, and migrations
- validators, middleware, query config, and route helpers
- workflows and links used by the plugin
- the generated `@mercurjs/core-plugin/_generated` route contract

## Public Contract Surfaces

Treat these as public:
- route paths and route grouping under `src/api`
- request validation and response envelopes
- module data model shape and required migration expectations for installed deployments
- exported package entrypoints, especially `./_generated`
- behavior consumed by `@mercurjs/client`, `@mercurjs/admin`, and `@mercurjs/vendor`
- HTTP shapes mirrored in `@mercurjs/types`

If you change one of these, call it out in the spec and verify downstream impact.

## Preferred Patterns

- Keep route resources structured with `route.ts`, `validators.ts`, `middlewares.ts`, and `query-config.ts` where applicable.
- Reuse existing helper modules before introducing new abstractions.
- Keep admin, vendor, and store route behavior explicit; do not hide route semantics behind unrelated helpers.
- Use shared HTTP types when a route is part of the public package surface.
- Update `@mercurjs/types` and downstream consumers together when a public DTO or HTTP shape changes.
- When a module schema changes, add or update the relevant migration under `src/modules/*/migrations` and note rollout impact in the spec.
- Think through codegen impact whenever a handler signature or route path changes.
- For route-type verification, use the consumer-facing CLI command: `mercurjs codegen` or `npx @mercurjs/cli@canary codegen` if the binary is not installed.
- When changing public route behavior, review the affected docs and client usage.

## Avoid

- Silent request or response shape changes
- Schema changes without a matching migration or without noting migration impact
- Route changes without considering generated `Routes`
- Updating runtime behavior but leaving `@mercurjs/types`, docs, or integration tests stale
- Introducing one-off route patterns when a local resource pattern already exists
- Leaving validators, middleware, and route behavior out of sync

## Verification

After backend contract changes, verify the smallest relevant set:
- `bun run check-types`
- `bun run build` from `packages/core-plugin` if exports or generated types are affected
- targeted integration tests in `integration-tests` for changed route behavior
- docs updates or review when public route usage changed

If a task changes route signatures, paths, or public DTOs, also confirm the generated route contract still makes sense for consumers.
If a task changes a module schema, confirm the migration path is explicit in the spec or task summary before closing the task.
