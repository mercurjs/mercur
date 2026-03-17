# Vendor App Guide

This guide covers work in `apps/vendor`.

Read this guide when a task touches:
- custom vendor pages
- vendor routing and navigation
- vendor-facing request or data flows
- vendor i18n or UI behavior

## Scope

`apps/vendor` owns:
- custom vendor routes under `src/pages`
- vendor page composition and request flow
- Vite bootstrap configuration in `vite.config.ts`

Dashboard mounting (which app, which path) is configured in `packages/api/medusa-config.ts` via the `vendor-ui` module — not in this app.

If `src/pages` does not exist yet, create it when adding the first custom page.

## Routing

Vendor pages are file-based:
- create `page.tsx` files under `src/pages`
- use the file path to control the route
- export route metadata when needed for navigation or nested behavior

## Preferred patterns

- Keep route structure explicit and easy to trace.
- Load `medusa-ui-conformance` before introducing custom reusable UI or new interaction primitives.
- Prefer existing local wrappers and `@medusajs/ui` before adding lower-level primitives.
- Use i18n for user-facing strings.
- Prefer typed client access over ad hoc request code.
- Preserve loading, empty, error, and success states when extending flows.
- Think through backend and block dependencies together when adding vendor pages.

## Dashboard wiring

Dashboard mounting (path, appDir) lives in `packages/api/medusa-config.ts` under the `vendor-ui` module entry.

Review `vite.config.ts` when a change:
- updates the `medusaConfigPath` reference
- adds or changes Vite plugins for the vendor app

## Blocks and backend coupling

Many vendor changes arrive through blocks. When a task installs or extends a block:
- inspect the `vendor` alias output
- verify whether the block also touched `api`
- re-check the vendor page flow against the backend behavior

## Verification

After non-trivial vendor changes, verify the smallest relevant set:
- app build
- app lint
- manual route check for newly added pages
- manual flow verification for pages that depend on backend responses or auth state

If the task depends on backend changes, verify the matching backend checks too.
