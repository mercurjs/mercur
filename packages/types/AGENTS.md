# Types Package Guide

This guide covers work in `packages/types`.

Read this guide when a task touches:
- shared HTTP request or response types
- exported public DTOs consumed across packages
- cross-package type propagation between backend and dashboard packages
- breaking or additive changes to `@mercurjs/types`

## Scope

`packages/types` owns:
- shared HTTP and DTO type exports from `@mercurjs/types`
- public type aliases consumed by backend, admin, vendor, client, and registry packages
- compatibility-sensitive shared shapes that propagate across package boundaries

## Public Contract Surfaces

Treat these as public:
- exported types from `@mercurjs/types`
- shared HTTP shapes mirrored from backend contracts
- type names and property shapes imported directly by downstream packages
- compatibility of shared DTOs consumed by `@mercurjs/admin`, `@mercurjs/vendor`, `@mercurjs/client`, and `@mercurjs/registry`

## Preferred Patterns

- Keep shared types aligned with the actual backend contract; do not invent parallel DTOs without a clear reason.
- Prefer additive, compatibility-friendly changes to exported public shapes.
- When a shared DTO changes, identify every direct consumer and update or verify them in the same task.
- Call out cross-package propagation explicitly in the spec when a type change is not package-local.

## Avoid

- Silent breaking changes to exported public types
- Duplicating the same DTO shape separately across multiple packages
- Changing `packages/types` without checking direct consumers
- Using `packages/types` as a dumping ground for purely local package-only types

## Verification

After shared type changes, verify the smallest relevant set:
- `bun run check-types`
- `bun run build` from `packages/types` when exports are affected
- targeted type or build verification in direct consumers when the shared shape changed
- matching docs, codegen, or integration verification if the type mirrors a backend contract change
