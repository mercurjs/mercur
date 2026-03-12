# Vendor Package Guide

This guide covers work in `packages/vendor`.

Read this guide when a task touches:
- vendor pages and routing
- vendor hooks and client usage
- auth or public vendor flows
- vendor forms and dashboard UX
- vendor i18n resources or translation keys

## Scope

`packages/vendor` owns:
- vendor page composition and routing
- vendor-side hooks and API consumption
- vendor auth and public entry flows
- vendor i18n resources and translation wiring
- exported vendor page surfaces

## Public Contract Surfaces

Treat these as public:
- exported `@mercurjs/vendor` entrypoints and `./pages`
- route and page behavior expected by consuming vendor apps
- auth-related flows such as login, password reset, or registration
- typed client assumptions built on top of generated `Routes`
- translation keys required by shared vendor pages and reusable UI

## Preferred Patterns

- **All API hooks in `src/hooks/api/` MUST use the typed `sdk` client.** Using `fetchQuery` for internal Mercur API calls is forbidden. `fetchQuery` is only allowed for external/third-party API calls. See `src/hooks/api/products.tsx` for reference.
- When adding or modifying custom UI, load `medusa-ui-conformance` first. Prefer existing local wrappers, then `@medusajs/ui`, then Radix primitives only for real interaction gaps.
- Prefer typed client usage through shared vendor utilities over scattered one-off request code.
- Keep route and page composition aligned with existing file-based routing expectations.
- Use schema-driven forms for user-input-heavy flows.
- Use existing `react-i18next` and package i18n utilities for user-facing copy in shared vendor UI.
- When adding or changing shared UI copy, update the touched files under `src/i18n/translations/` in the same patch.
- Preserve loading, error, empty, and success states when refactoring flows.
- Keep auth and public-route behavior explicit and easy to reason about.

## Avoid

- Silent changes to public or auth-related user flows
- Duplicating request wrappers in page components when a shared hook or utility already exists
- Introducing untyped request/response assumptions where generated route contracts exist
- Hardcoding new user-facing strings in reusable UI when the package already expects translations
- Changing or removing translation keys without updating the translation resources
- UI refactors that remove existing state gating, keyboard behavior, or error handling

## Verification

After non-trivial vendor changes, verify the smallest relevant set:
- `bun run check-types`
- `bun run build` from `packages/vendor` when exports or compiled output are affected
- `bun run lint` from `packages/vendor` for touched UI code
- review touched translation keys/resources when user-facing copy changed
- targeted flow validation when auth or public pages changed

If a change depends on backend route behavior, verify the matching integration coverage too.
