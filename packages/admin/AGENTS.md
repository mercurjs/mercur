# Admin Package Guide

This guide covers work in `packages/admin`.

Read this guide when a task touches:
- admin pages and routing
- admin forms, page composition, or tables
- admin hooks or API consumption
- shared admin UX patterns

For compound component and `TabbedForm` migrations, also consult [`CLAUDE.md`](CLAUDE.md) and the repo-local skill referenced from the root `AGENTS.md`.

## Scope

`packages/admin` owns:
- admin page composition
- admin forms and schema-driven validation
- admin-side API consumption and dashboard wiring
- exported admin page surfaces

## Public Contract Surfaces

Treat these as public:
- exported `@mercurjs/admin` entrypoints and `./pages`
- established page and form composition patterns used by downstream consumers
- route-level behavior expected by test apps consuming this package
- API request shapes assumed by admin hooks and pages

## Preferred Patterns

- **All API hooks in `src/hooks/api/` MUST use the typed `sdk` client.** Using `fetchQuery` for internal Mercur API calls is forbidden. `fetchQuery` is only allowed for external/third-party API calls.
- When adding or modifying custom UI, load `medusa-ui-conformance` first. Prefer existing local wrappers, then `@medusajs/ui`, then Radix primitives only for real gaps.
- Keep page anatomy explicit and predictable.
- Prefer existing schema-driven validation patterns over ad hoc runtime checks.
- Reuse shared client utilities and typed backend contracts where possible.
- Keep loading, error, and submit behavior aligned with current package conventions.
- Preserve keyboard paths and non-button submit paths when modifying forms.
- Prefer additive changes to exported page surfaces.

## Avoid

- Introducing new page patterns when an established admin pattern already exists
- Silent regressions in submit, loading, or validation behavior
- Widening types to `any` or bypassing existing typed route/client usage
- Raw API usage scattered across page components when a package-level pattern already exists
- Breaking exported page contracts without noting compatibility impact

## Verification

After non-trivial admin changes, verify the smallest relevant set:
- `bun run check-types`
- `bun run build` from `packages/admin` when exports or compiled output are affected
- `bun run lint` from `packages/admin` for touched UI code
- targeted integration or app-level smoke verification when a user flow changed

If a change depends on backend contract changes, verify the corresponding integration coverage as well.
