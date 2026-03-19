---
name: dashboard-page-ui
description: Create or modify pages in admin or vendor dashboards in the Mercur basic starter using correct routing, page composition, i18n, and dashboard UI conventions.
---

# Dashboard Page UI

Use this skill when:
- adding a new page under `apps/admin/src/routes` or `apps/vendor/src/routes`
- extending a list or detail page in either dashboard
- adding page-level actions, sections, or empty states

Applies equally to **admin** and **vendor** dashboards — they share the same component library and routing conventions.

## First checks

- Route files belong under `src/routes` (NOT `src/pages` — the `mercurDashboardPlugin` scans `src/routes` only).
- Decide whether the task is page-level, form-level, or tab-level.
- Before inventing custom UI, apply `medusa-ui-conformance`.
- If it is form-only, use `dashboard-form-ui`.
- If it is tabbed wizard work, use `dashboard-tab-ui`.

## Hard rules

1. Do not hardcode user-facing strings; use i18n.
2. Do not hide route behavior behind unclear folder structure; keep file-based routing obvious.
3. Do not ship a page without explicit loading, empty, error, and success-state thinking.
4. Do not invent a brand-new page anatomy when an existing dashboard page pattern already fits.
5. Do not scatter action buttons and page actions without a clear header structure.
6. Do not place route files in `src/pages` — the `mercurDashboardPlugin` scans `src/routes` only.

## Sidebar navigation

For a page to appear in the sidebar, its `page.tsx` must export a named `config`:

```tsx
import type { RouteConfig } from "@mercurjs/dashboard-sdk";
import { Star } from "@medusajs/icons";

export const config: RouteConfig = {
  label: "My Page",
  icon: Star,
};
```

Without this export the page is reachable by URL but invisible in navigation.

## List page pattern

Use `_DataTable`, `SingleColumnPage`, and `useDataTable` from `@mercurjs/dashboard-shared`.

A list page should include:
- `SingleColumnPage` wrapper
- `Container` with heading and action buttons (Create via `Link` to the create route)
- `_DataTable` with `pagination`, `search`, `filters`, `orderBy`, `count`, `pageSize`, `noRecords`
- `navigateTo` on `_DataTable` to link rows to detail pages

## Detail page pattern

Detail pages use `TwoColumnPage` with `.Main` and `.Sidebar` from `@mercurjs/dashboard-shared`.

### Structure

```tsx
<TwoColumnPage data={entity} showJSON showMetadata>
  <TwoColumnPage.Main>
    <Container className="divide-y p-0">
      {/* Header: title, StatusBadge for status, ActionMenu for actions */}
      <SectionRow title="Field Label" value={entity.field} />
    </Container>
    {/* Group related fields into separate Container blocks with Heading level="h2" */}
  </TwoColumnPage.Main>

  <TwoColumnPage.Sidebar>
    <Container className="divide-y p-0">
      {/* Secondary info: organization, inventory, metadata */}
      <SectionRow title="Field Label" value={entity.field} />
    </Container>
  </TwoColumnPage.Sidebar>
</TwoColumnPage>
```

### Detail page conventions

- Use `SectionRow` for key-value pairs — `title` is the label, `value` is string or ReactNode.
- Use `StatusBadge` only for statuses (published, draft, active, etc.) — never `Badge`.
- Use plain text for categories, types, and other descriptive values — never wrap in `Badge`.
- Use `ActionMenu` with `groups` for contextual actions (Edit, Delete). Put destructive actions in a separate group.
- Main column: primary content, descriptions, key details.
- Sidebar: secondary info, organization, metadata.

## Create / edit page pattern

Create pages live at `src/routes/<entity>/create/page.tsx` and open as a `RouteFocusModal` drawer overlay:

```tsx
const CreatePage = () => (
  <RouteFocusModal>
    <CreateForm />
  </RouteFocusModal>
);
export default CreatePage;
```

The form component inside uses `useRouteModal()` for `handleSuccess`. See `dashboard-form-ui` or `dashboard-tab-ui` for form details.

## Routing expectations

- `page.tsx` controls the route.
- Export `config: RouteConfig` when the page should appear in navigation.
- Detail pages: `src/routes/<entity>/[id]/page.tsx`
- Create pages: `src/routes/<entity>/create/page.tsx`
- Keep nested routes and dynamic segments easy to infer from the folder path.

## Verification

- confirm the route resolves and appears in sidebar (if config is exported)
- confirm the page copy is translated or translation-ready
- confirm loading and error behavior still make sense
- confirm StatusBadge is used for statuses, plain text for descriptive values
- run app build or lint after non-trivial page work
