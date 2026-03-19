---
name: medusa-ui-conformance
description: Keep custom admin and vendor UI in the Mercur basic starter aligned with local wrappers and @medusajs/ui. Use when adding reusable UI, interactive primitives, overlays, menus, selectors, or custom dashboard components.
---

# Medusa UI Conformance

Use this skill when:
- adding custom admin or vendor UI
- creating reusable components
- deciding whether to build, reuse, or compose an interaction pattern

This starter does not assume direct Radix usage on day one.

Use this order:
1. `@mercurjs/dashboard-shared` components (TabbedForm, _DataTable, SingleColumnPage, TwoColumnPage, RouteFocusModal, Form, etc.)
2. `@medusajs/ui` components (Button, Input, Select, Container, Heading, Text, StatusBadge, toast, etc.)
3. composition of the above
4. only then add a lower-level primitive if the project genuinely needs it

## Available from @mercurjs/dashboard-shared

Layout: `SingleColumnPage`, `TwoColumnPage` (.Main, .Sidebar), `SectionRow`
Data: `_DataTable`, `useDataTable`, `DataGrid`
Modal: `RouteFocusModal` (.Form, .Header, .Body, .Footer, .Close), `RouteDrawer`, `StackedFocusModal`, `StackedDrawer`
Form: `Form` (.Field, .Item, .Label, .Control, .ErrorMessage), `TabbedForm` (.Tab, .useForm)
Actions: `ActionMenu` (with `groups` of actions)
Hooks: `useRouteModal`, `useStackedModal`, `useTabManagement`, `useTabbedForm`, `useDataTable`, `useQueryParams`

## Available from @medusajs/ui

Primitives: `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `RadioGroup`
Layout: `Container`, `Heading`, `Text`, `Table`, `Tabs`, `ProgressTabs`
Status: `StatusBadge` — for statuses with colored dot (e.g. published, draft, active)
Tags: `Badge` — for counts and tags only, never for statuses
Feedback: `toast`
Icons: import from `@medusajs/icons`

## Component usage rules

### StatusBadge vs Badge vs plain text

- `StatusBadge` — statuses only (published, draft, active, pending, etc.). Takes `color`: "green", "orange", "red", "blue", "grey".
- `Badge` — counts and tags only (e.g. "3 items", "+2 more"). Never for statuses.
- Plain text — categories, types, names, descriptions, and any other descriptive values. Do not wrap in Badge or StatusBadge.

### SectionRow

- Key-value display in detail pages. `title` is the label, `value` is string or ReactNode.
- Keep values simple: plain text, `StatusBadge`, or minimal formatted content.

### ActionMenu

- Contextual actions (Edit, Delete, etc.) on detail pages and row-level.
- `groups` array — each group is visually separated. Put destructive actions in their own group.

### TabbedForm

- Multi-step form wizard inside `RouteFocusModal`. Renders `ProgressTabs` in the header navbar automatically.
- Do NOT build tab navigation manually with `ProgressTabs` — use `TabbedForm` which handles form context, keyboard shortcuts, and footer.

### _DataTable

- Data tables with pagination, search, filters, sorting.
- Do NOT build custom tables with `Table` from `@medusajs/ui` when `_DataTable` covers the use case.

## Hard rules

1. Do not build custom dropdowns, dialogs, drawers, tooltips, popovers, tabs, accordions, or selects if `@medusajs/ui` already covers the interaction.
2. Do not build custom tabbed forms — use `TabbedForm` from `@mercurjs/dashboard-shared`.
3. Do not build custom data tables — use `_DataTable` from `@mercurjs/dashboard-shared`.
4. Do not add a new shared component when an existing wrapper already solves the pattern.
5. Do not introduce custom interactive UI without keyboard behavior, focus handling, and i18n.
6. Do not create a one-off visual language that fights the rest of the dashboard.
7. Do not use `ProgressTabs` directly for multi-step forms — use `TabbedForm`.
8. Do not use `Badge` for status display — use `StatusBadge`.
9. Do not wrap categories, types, or descriptive text in `Badge` or `StatusBadge` — use plain text.

## Decision checks

Before creating custom UI, ask:
- does `@mercurjs/dashboard-shared` export a component for this?
- can `@medusajs/ui` solve this directly?
- can I compose the solution from existing wrappers and `@medusajs/ui`?
- if not, is the gap real and reusable enough to justify a new component?

## Review checklist

- reused `@mercurjs/dashboard-shared` where applicable
- preferred `@medusajs/ui` over custom primitives
- `StatusBadge` for statuses, plain text for descriptive values
- copy is translation-ready
- interaction is accessible and testable

## Verification

- run the relevant app lint/build
- manually check keyboard and focus behavior for non-trivial interactions
- verify StatusBadge vs Badge vs plain text usage
