# Admin App Guide

This guide covers work in `apps/admin`.

Read this guide when a task touches:
- custom admin pages
- page-level UI and section layout
- admin forms
- custom admin tabs or wizard steps
- admin route configuration or extension wiring

## Scope

`apps/admin` owns:
- custom file-based routes under `src/routes`
- admin-specific route exports and navigation metadata
- Vite bootstrap configuration in `vite.config.ts`

Dashboard mounting (which app, which path) is configured in `packages/api/medusa-config.ts` via the `admin-ui` module — not in this app.

If `src/routes` does not exist yet, create it when adding the first custom page.

## Routing

Admin pages are file-based:
- create `page.tsx` files under `src/routes`
- use file path shape to control route path
- export route config when the page should appear in navigation

Use `templates/basic/apps/admin/src/README.md` as the starter routing reference.

## Which skill to use

- Any custom UI or reusable interaction pattern -> `medusa-ui-conformance`
- Page or section work -> `admin-page-ui`
- Form work -> `admin-form-ui`
- Tabbed wizard work -> `admin-tab-ui`

Load the matching skill before editing page, form, or tab-heavy UI.

## Preferred patterns

- Keep routing explicit and aligned with file-based page structure.
- Prefer existing local wrappers and `@medusajs/ui` before introducing new primitives or custom components.
- Use i18n for user-facing strings instead of hardcoded copy.
- Prefer typed API usage through shared Mercur client patterns.
- Preserve loading, error, empty, and success states when extending screens.
- Keep page composition intentional: header, actions, sections, and data states should be easy to scan.

## Dashboard wiring

Dashboard mounting (path, appDir) lives in `packages/api/medusa-config.ts` under the `admin-ui` module entry.

Review `vite.config.ts` when a change:
- updates the `medusaConfigPath` reference
- adds or changes Vite plugins for the admin app

## Verification

After non-trivial admin changes, verify the smallest relevant set:
- app build
- app lint
- manual route check for newly added pages
- manual form or tab behavior check if the task changed a submission flow

If the page depends on backend changes, also verify the matching backend behavior.
