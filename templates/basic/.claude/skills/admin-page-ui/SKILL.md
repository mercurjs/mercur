---
name: admin-page-ui
description: Create or modify admin pages in the Mercur basic starter using correct routing, page composition, i18n, and dashboard UI conventions.
---

# Admin Page UI

Use this skill when:
- adding a new admin page under `apps/admin/src/pages`
- extending a list or detail page
- adding page-level actions, sections, or empty states

## First checks

- Confirm the route file belongs under `apps/admin/src/pages`.
- Decide whether the task is page-level, form-level, or tab-level.
- Before inventing custom UI, apply `medusa-ui-conformance`.
- If it is form-only, use `admin-form-ui`.
- If it is tabbed wizard work, use `admin-tab-ui`.

## Hard rules

1. Do not hardcode user-facing strings; use i18n.
2. Do not hide route behavior behind unclear folder structure; keep file-based routing obvious.
3. Do not ship a page without explicit loading, empty, error, and success-state thinking.
4. Do not invent a brand-new page anatomy when an existing Mercur admin page pattern already fits.
5. Do not scatter action buttons and page actions without a clear header structure.

## Page patterns

- List pages should have a clear title, actions, and data state handling.
- Detail pages should have a stable header plus clearly grouped sections.
- Section-heavy screens should stay scannable and avoid one giant unstructured column.

## Routing expectations

- `page.tsx` controls the route.
- Export route metadata when the page should appear in navigation.
- Keep nested routes and dynamic segments easy to infer from the folder path.

## Verification

- confirm the route resolves
- confirm the page copy is translated or translation-ready
- confirm loading and error behavior still make sense
- run admin build or lint after non-trivial page work
