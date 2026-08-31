# Architecture — `@mercurjs/dashboard-shared`

Reusable React UI primitives, hooks, and helpers shared by the two Mercur dashboards (`@mercurjs/admin`, `@mercurjs/vendor`) and by external blocks installed through `@mercurjs/dashboard-sdk` / `@mercurjs/registry`. This package owns no routes and no business logic — it is the design-system layer that every dashboard page composes on top of.

## Layer diagram

```
+-----------------------------------------------------------------+
|  Consumer apps / packages                                       |
|    @mercurjs/admin   @mercurjs/vendor   @mercurjs/registry      |
|    apps/admin-test   apps/vendor        custom block packages   |
+-----------------------------------------------------------------+
                              |
                              |  import { ... } from "@mercurjs/dashboard-shared"
                              v
+-----------------------------------------------------------------+
|                   @mercurjs/dashboard-shared                    |
|                                                                 |
|  components/                                                    |
|    layout/pages         SingleColumnPage, TwoColumnPage         |
|    modals               RouteFocusModal, RouteDrawer,           |
|                         StackedFocusModal, StackedDrawer,       |
|                         RouteModalForm + providers              |
|    tabbed-form          TabbedForm, useTabbedForm, defineTabMeta|
|    table/data-table     _DataTable (deprecated, header search   |
|                         + filters + order-by + pagination)      |
|    data-table           DataTable (Medusa-UI based, current)    |
|    data-grid            DataGrid (excel-like editable grid)     |
|    forms                AddressForm, EmailForm, MetadataForm    |
|    filtering            FilterGroup, OrderBy, Query             |
|    common               Form, ActionMenu, Section/SectionRow,   |
|                         Skeleton, FileUpload, SwitchBox,        |
|                         Thumbnail, ChipGroup, ListSummary,      |
|                         SortableList/Tree, MetadataSection, ... |
|    inputs               Combobox, CountrySelect, ProvinceSelect,|
|                         HandleInput, ChipInput, PercentageInput |
|    utilities            KeyboundForm, ErrorBoundary,            |
|                         VisuallyHidden, i18n helpers            |
|                                                                 |
|  hooks/                                                         |
|    useDataTable, useQueryParams, useDate, useCommandHistory,    |
|    useCombinedRefs, useDocumentDirection                        |
|                                                                 |
|  lib/                                                           |
|    queryKeysFactory     Standard TanStack cache-key shape       |
|    addresses, schemas   Zod schemas + address helpers           |
|    money-amount-helpers Currency formatting                     |
|    query-client         Shared QueryClient instance             |
+-----------------------------------------------------------------+
                              |
                              |  built on top of
                              v
+-----------------------------------------------------------------+
|  @medusajs/ui · @medusajs/icons · radix-ui · @ariakit/react     |
|  react-router-dom · react-hook-form · zod · @tanstack/react-*   |
|  @dnd-kit · motion · i18next · cmdk                             |
+-----------------------------------------------------------------+
```

## Package layout

```
src/
  index.ts                       Public surface (see "Public surface" below)
  module.d.ts                    Ambient types for virtual modules consumed by Vite

  components/
    index.ts                     Re-exports all component subtrees
    common/                      Cross-page primitives used by every page
      action-menu                ActionMenu — row/section overflow menu
      form                       Form (RHF wrapper: Form.Field / Item / Label / Control / ErrorMessage)
      section                    SectionRow (label/value row inside a Container)
      empty-table-content        NoRecords / NoResults empty states
      skeleton                   Skeleton, TableSkeleton, SingleColumnPageSkeleton, TwoColumnPageSkeleton
      file-upload                Drag-and-drop file picker
      switch-box                 Card-styled toggle row used in forms
      thumbnail                  Image thumbnail with fallback
      metadata-section           Key/value editor mounted by TwoColumnPage when `showMetadata`
      json-view-section          JSON tree viewer mounted by TwoColumnPage when `showJSON`
      chip-group                 Group of removable chips for tag inputs
      listicle                   Bulleted/numbered styled list
      sortable-list              Single-level dnd-kit sortable list
      sortable-tree              Nested dnd-kit tree (categories, navigation)
      progress-bar               Progress indicator (onboarding, imports)
      conditional-tooltip        Tooltip wrapper that only renders when content is truthy
      confirm-prompt             Standardised `Prompt` body (used by delete flows)
      customer-info              Customer name/email block (orders, requests)
      date-range-display         Pretty-printed date range
      display-id                 Copyable id pill with truncation
      file-preview               Preview tile for uploaded files
      icon-avatar                Icon-only avatar primitive
      image-avatar               Image avatar with initials fallback
      infinite-list              Generic virtualized infinite list
      link-button                Link styled as a Button (uses `Button asChild`)
      list-summary               "N selected" / "X of Y" summaries
      logo-box                   Logo upload + preview card
      sidebar-link               Sidebar entry row (icon + label + count)
      tax-badge                  Tax-rate StatusBadge
      segmented-control          Compact segmented switch (e.g. tabs in forms)
      badge-list-summary         "Badge + ..N more" composable summary

    data-grid/                   Spreadsheet-like editable grid (used by product pricing,
                                 inventory matrices, variant tables)
      data-grid.tsx              Public _DataGrid (skeleton vs root switcher)
      components/                Cell primitives: text, currency, number, boolean,
                                 country-select, multiline, duplicate, readonly,
                                 keyboard-shortcut-modal, textarea-modal, error-indicator
      hooks/                     Navigation, clipboard, keydown, snapshot, error, cell,
                                 form-handlers, column-visibility, mouse-up, duplicate,
                                 query-tool, cell-metadata
      models/                    matrix, query-tool, bulk-update-command, update-command
      context/                   data-grid-context.tsx + useDataGridContext
      helpers/                   createDataGridColumnHelper, createDataGridPriceColumns
      types.ts, utils.ts

    data-table/                  Newer wrapper around Medusa UI's `DataTable`
      data-table.tsx             Single-prop DataTable with filters, commands, actions,
                                 row selection, column-visibility, view selector
      components/                data-table-status-cell
      helpers/                   Column / filter / command helpers
      index.ts

    table/                       Legacy data-table built on TanStack Table directly
      data-table/                _DataTable (deprecated alias) + filter / order-by /
                                 query / search / root subparts, hooks.tsx
      table-cells/common         Cell primitives: text, status, money-amount, date,
                                 created-at, email, code, name, placeholder

    filtering/                   Filter UI primitives reused by table/data-table
      filter-group               Filter chips + dropdown
      order-by                   Sort control
      query                      Search input + parser

    forms/                       Composite, opinionated forms
      address-form               Multi-section address form (uses CountrySelect, RHF)
      email-form                 Single email field with zod EmailSchema
      metadata-form              Editable key/value metadata grid

    inputs/                      Form-control primitives
      chip-input                 Chip-style multi-value input
      combobox                   Ariakit-powered combobox / async-search select
      country-select             Country picker wired to flag emoji
      handle-input               Slug input with auto-derived handle preview
      percentage-input           Numeric input that formats as %
      province-select            Region/state picker reactive to country

    layout/pages/                Page-level layout primitives
      single-column-page         SingleColumnPage<TData> — stack + metadata/json + Outlet
      two-column-page            TwoColumnPage<TData> — Main / Sidebar grid + metadata/json + Outlet
      types.ts                   PageProps<TData>

    localization/                Locale-aware widgets
      localized-table-pagination Translated pagination strip for legacy tables

    modals/                      Routed modal primitives backed by react-router state
      route-drawer               RouteDrawer — side drawer for edit pages
      route-focus-modal          RouteFocusModal — full-screen modal for create pages
      route-modal-form           RouteDrawer.Form / RouteFocusModal.Form host
                                 (blocks navigation while RHF is dirty + unsaved-changes Prompt)
      route-modal-provider       Provider + useRouteModal()
      stacked-drawer             StackedDrawer — drawer launched inside a route modal
      stacked-focus-modal        StackedFocusModal — modal stacked on top of a route modal
      stacked-modal-provider     Provider + useStackedModal()
      hooks/                     useStateAwareTo (router state-aware navigation)

    tabbed-form/                 Multi-step form wizard for create flows
      tabbed-form.tsx            TabbedForm.Root / .Tab + useTabbedForm()
      use-tab-management.ts      Tab state + validation gating
      types.ts                   TabDefinition + defineTabMeta

    utilities/                   Low-level helpers
      keybound-form              <KeyboundForm> — wraps <form> with Cmd/Ctrl+Enter submit
      error-boundary             React error boundary (wired into ProtectedRoute / layouts)
      generic-forward-ref        Typed forwardRef helper for generic components
      visually-hidden            sr-only wrapper
      i18n                       Translation helper utilities

  hooks/
    use-data-table.tsx           Builder around TanStack Table state (pagination,
                                 row selection, expandable rows, prefixed search params)
    use-query-params.tsx         Read prefixed query params from react-router
    use-date.tsx                 date-fns wrapper (locale-aware)
    use-document-direction.tsx   `dir` for RTL/LTR (Select, DropdownMenu, Combobox)
    use-command-history.tsx      Undo/redo command stack (DataGrid)
    use-combined-refs.tsx        Compose multiple refs into one

  lib/
    query-key-factory.ts         queryKeysFactory(domain) → { all, lists, list, details, detail }
    query-client.ts              Shared TanStack QueryClient (consumed by app providers)
    schemas.ts                   AddressSchema, EmailSchema, TransferOwnershipSchema (zod)
    addresses.ts                 Address helpers
    money-amount-helpers.ts      getLocaleAmount, getDecimalDigits, getNativeSymbol, ...
    data/                        Static data (currencies, countries)

  utils/
    images-conventer.ts          Image conversion helpers used by file-upload
```

### Path aliases

Both the TypeScript and `tsup` builds expose four aliases under `src/`:

| Alias          | Resolves to        |
| -------------- | ------------------ |
| `@/*`          | `src/*`            |
| `@components/*`| `src/components/*` |
| `@hooks/*`     | `src/hooks/*`      |
| `@lib/*`       | `src/lib/*`        |

`react`, `react-dom`, and the SDK virtual modules (`virtual:mercur/config`, `virtual:mercur/routes`) are marked external — the package never bundles them.

## Public surface

`src/index.ts` re-exports everything in `components/index.ts` plus everything in `hooks/index.ts`, plus `queryKeysFactory` and its associated types. Anything not re-exported through one of these barrels is considered internal and may move without notice.

The barrels currently re-export every common primitive, every table cell, every filter primitive, the two layout primitives, all four modal primitives + their hooks (`useRouteModal`, `useStackedModal`), the tabbed-form trio (`TabbedForm`, `useTabbedForm`, `useTabManagement`, `TabDefinition`), and the seven hooks (`useDataTable`, `useQueryParams`, `useDate`, `useDocumentDirection`, `useCommandHistory`, `useCombinedRefs`, plus their helpers).

Consumers should always import from the package root:

```ts
import {
  SingleColumnPage,
  TwoColumnPage,
  _DataTable,
  useDataTable,
  queryKeysFactory,
  ActionMenu,
  Form,
  RouteFocusModal,
  RouteDrawer,
  TabbedForm,
} from "@mercurjs/dashboard-shared"
```

Reaching into `@mercurjs/dashboard-shared/dist/...` is not supported; only the package root is published.

## How the dashboards consume it

`@mercurjs/admin` and `@mercurjs/vendor` ship their own concrete pages on top of these primitives. They re-export the curated subset that downstream block authors need from their own `src/index.ts` (see `packages/admin/ARCHITECTURE.md`, "Public exports"):

- `TabbedForm`, `useTabbedForm`, `defineTabMeta`, `TabDefinition`
- `Form`, `SwitchBox`, `FileUpload`, `ChipInput`
- `DataTable`, `Filter`, `useDataTable`
- `SingleColumnPage`, `ActionMenu`, `Notifications`

Custom registry blocks (`@mercurjs/registry`) and any user-authored block packages import the primitives directly from `@mercurjs/dashboard-shared` — that is the supported public boundary for third-party extensions.

## Component usage rules

Every dashboard page composes the same small alphabet:

### Page shell

- **List page** → `SingleColumnPage` wrapping a single `Container className="divide-y p-0"`. Each `Container` has a header row (`flex items-center justify-between px-6 py-4`) with `<Heading>` + actions, then `_DataTable` / `DataTable`.
- **Detail page** → `TwoColumnPage` with exactly two children: `TwoColumnPage.Main` and `TwoColumnPage.Sidebar`. Toggle `showMetadata` / `showJSON` and pass `data={entity}` to render the `MetadataSection` / `JsonViewSection` automatically. Skip them when `data` is missing — the layout warns in dev.
- **Create page** → `RouteFocusModal` host + `TabbedForm`. Each tab carries `defineTabMeta({ id, labelKey, validationFields, isVisible? })` on its `Root` so `TabbedForm` can validate the partial schema and skip hidden tabs.
- **Edit page** → `RouteDrawer` host + `RouteDrawer.Form` (`RouteModalForm` under the hood) + `KeyboundForm`. The form blocks navigation while dirty and pops the unsaved-changes `Prompt`.
- **Stacked modal inside a route modal** → `StackedFocusModal` / `StackedDrawer`. Wire `useStackedModal()` to open and close from outside.

The `Outlet` rendered by both layouts is intentional: nested routes (`/products/:id/edit`) mount their `RouteDrawer` / `RouteFocusModal` inside that outlet so the underlying page stays mounted.

### Forms

- Never call `Controller` directly. Every field is `<Form.Field>` → `<Form.Item>` → `<Form.Label>` + `<Form.Control>` + `<Form.ErrorMessage>`. Use `<Form.Hint>` for help text.
- Build schemas with `zod` and resolve them via `@hookform/resolvers/zod`. Reusable shapes live in `lib/schemas.ts` (`AddressSchema`, `EmailSchema`, `TransferOwnershipSchema`).
- Wrap form elements in `KeyboundForm` (`utilities/keybound-form`) so Cmd/Ctrl+Enter submits.
- For RTL-aware widgets pass `dir={useDocumentDirection()}` to `Select`, `DropdownMenu`, `Combobox`.
- Composite forms — `AddressForm`, `EmailForm`, `MetadataForm` — accept a `control` from the parent RHF instance; never spawn an inner form.
- Toggles use `SwitchBox` (already padded + card-styled). Country pickers use `CountrySelect` / `ProvinceSelect`. Slug fields use `HandleInput`.

### Tables

Two table primitives ship side by side; new code should target the newer one:

- **`DataTable` (current, `components/data-table`)** — a single-prop wrapper around `@medusajs/ui`'s `DataTable`. Accepts `columns`, `filters`, `commands`, `action` / `actions` / `actionMenu`, `rowSelection`, `enableColumnVisibility`, `enableViewSelector`, `heading` / `subHeading`, `emptyState`, `pageSize`. Use this for any new list page.
- **`_DataTable` (legacy, `components/table/data-table`)** — TanStack Table directly with separate `useDataTable` hook. Still used widely; marked `@deprecated`. New pages should not adopt it, but the contract is stable enough that migration is a per-page exercise.

Common cells live in `components/table/table-cells/common` (`TextCell`, `StatusCell`, `MoneyAmountCell`, `DateCell`, `CreatedAtCell`, `EmailCell`, `CodeCell`, `NameCell`, `PlaceholderCell`).

Empty states are `NoRecords` (no data at all, optional CTA) and `NoResults` (filter/search returned nothing). The legacy `_DataTable` renders them automatically based on `count` + `queryObject`.

### Data grids

`components/data-grid` is a spreadsheet-like editable grid for bulk-editing matrices (variant prices, inventory levels, regional preferences). It is not a table replacement — only use it when the UX is "type into many cells, undo with Cmd+Z, paste a column from Excel".

Use `createDataGridColumnHelper<Row>()` and `createDataGridPriceColumns(...)` for price-by-currency columns. Bind cells to RHF via the per-cell hooks under `data-grid/hooks` and `useCommandHistory` for undo/redo.

### Actions

`ActionMenu` is the only sanctioned overflow / row-action menu. Group actions semantically (edit / navigate first, destructive last in its own group). Each `Action` is `{ icon, label, to | onClick, disabled?, disabledTooltip? }`. The default trigger is `<IconButton size="small"><EllipsisHorizontal /></IconButton>`; pass `children` to override.

### Section rows

For label/value rows inside a `Container`, prefer `SectionRow` (`components/common/section`) — it lays out the `grid grid-cols-2 gap-4 px-6 py-4` + `text-ui-fg-subtle` pattern correctly, including an optional actions column.

### Skeletons

While data loads, render `SingleColumnPageSkeleton sections={n}` or `TwoColumnPageSkeleton mainSections={n} sidebarSections={n}` to match the eventual layout. For inline table loading use `TableSkeleton` (the legacy `_DataTable` mounts it automatically when `isLoading`).

## Hooks

| Hook                     | Purpose                                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useDataTable`           | Builds TanStack Table state for the legacy `_DataTable`. Handles pagination + row selection + expandable rows + prefixed search params.                       |
| `useQueryParams`         | Read a strongly-typed map of search params off the current URL. Accepts a `prefix` so two tables on the same page do not collide.                             |
| `useDate`                | Locale-aware date formatter built on `date-fns`. Use whenever you display dates so RTL/locale settings are honoured.                                          |
| `useDocumentDirection`   | Returns `"ltr" \| "rtl"`. Pass to `Select`, `DropdownMenu`, `Combobox` to keep menus on the correct side.                                                     |
| `useCommandHistory`      | Undo/redo command stack used by `DataGrid`. Generic enough for any other Cmd+Z / Cmd+Shift+Z surface.                                                         |
| `useCombinedRefs`        | Merge multiple refs into one for compound components.                                                                                                         |
| `useRouteModal`          | Read the parent route modal's state (`handleSuccess(path?)` to close + navigate). Available inside `RouteFocusModal` / `RouteDrawer` subtrees.                |
| `useStackedModal`        | Read the parent stacked modal's state. Available inside `StackedFocusModal` / `StackedDrawer` subtrees.                                                       |
| `useTabbedForm`          | Read the current `UseFormReturn` from inside a `TabbedForm` tab — typed via the parent's field-values generic.                                                |
| `useTabManagement`       | Underlying tab state (active id, advance/back, validation gating). Useful when authoring a custom `TabbedForm` footer.                                        |

## Library helpers

| Module                      | Use                                                                                                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `queryKeysFactory(globalKey)` | Standard TanStack cache shape: `{ all, lists(), list(query), details(), detail(id, query?) }`. Use it for every `useX` / `useXList` hook so invalidation lines up across the dashboards.                    |
| `query-client`              | Pre-configured TanStack `QueryClient` instance — admin and vendor mount it once at the app root.                                                                                                              |
| `schemas`                   | `AddressSchema`, `EmailSchema`, `TransferOwnershipSchema` (with i18n-translated messages). Reuse instead of duplicating field rules.                                                                          |
| `addresses`                 | Address-shaped helpers (formatting, comparison) used by `AddressForm` and customer/order detail pages.                                                                                                        |
| `money-amount-helpers`      | `getLocaleAmount`, `getDecimalDigits`, `getNativeSymbol`. Always use these instead of `Intl.NumberFormat` directly so locale + decimal places match the rest of the dashboards.                              |
| `data/`                     | Static currency + country data backing `CountrySelect` / `ProvinceSelect` and the money helpers.                                                                                                              |

## Where each primitive belongs (cheat sheet)

| Goal                                                | Primitive                                            |
| --------------------------------------------------- | ---------------------------------------------------- |
| Vertical list / settings page                       | `SingleColumnPage` + `Container className="divide-y p-0"` |
| Detail page with sidebar                            | `TwoColumnPage` (`Main`, `Sidebar`) with `showMetadata` / `showJSON` for `data` |
| Multi-step create wizard                            | `RouteFocusModal` + `TabbedForm` + `defineTabMeta`   |
| Single-form edit                                    | `RouteDrawer` + `RouteDrawer.Form` + `KeyboundForm`  |
| Confirm a destructive action                        | `usePrompt()` from `@medusajs/ui` inside a `use-delete-<entity>-action` hook (no inline modal) |
| Row / section overflow menu                         | `ActionMenu`                                         |
| Field of any RHF form                               | `Form.Field` → `Form.Item` → `Form.Label` + `Form.Control` + `Form.ErrorMessage` |
| Address inputs                                      | `AddressForm` + `AddressSchema`                      |
| Email-only form                                     | `EmailForm` + `EmailSchema`                          |
| Metadata key/value editor                           | `MetadataForm`                                       |
| Toggle row                                          | `SwitchBox`                                          |
| File picker                                         | `FileUpload`                                         |
| Logo upload card                                    | `LogoBox`                                            |
| Country / region picker                             | `CountrySelect` / `ProvinceSelect`                   |
| Tag-style multi value                               | `ChipInput` + `ChipGroup`                            |
| Slug / handle input                                 | `HandleInput`                                        |
| Async-search select                                 | `Combobox`                                           |
| List view                                           | `DataTable` (new) / `_DataTable` (legacy)            |
| Table cell                                          | `TextCell`, `StatusCell`, `MoneyAmountCell`, `DateCell`, `CreatedAtCell`, `EmailCell`, `CodeCell`, `NameCell`, `PlaceholderCell` |
| Bulk-editable matrix                                | `DataGrid` (`data-grid`)                             |
| Drag-and-drop reorder                               | `SortableList` (flat) / `SortableTree` (nested)      |
| Loading placeholder                                 | `Skeleton`, `TableSkeleton`, `SingleColumnPageSkeleton`, `TwoColumnPageSkeleton` |
| Empty state                                         | `NoRecords` / `NoResults`                            |
| Section label / value row                           | `SectionRow`                                         |
| Copyable id                                         | `DisplayId`                                          |
| Customer chip in orders/requests                    | `CustomerInfo`                                       |
| Stacked modal inside a route modal                  | `StackedFocusModal` / `StackedDrawer` + `useStackedModal()` |
| Cmd/Ctrl+Enter to submit                            | `KeyboundForm`                                       |
| TanStack cache keys                                 | `queryKeysFactory("<domain>")`                       |

## Design system rules

Inherited verbatim from `packages/admin/ARCHITECTURE.md` (since the admin and vendor dashboards both build on these primitives):

- `@medusajs/ui` is the only UI library; never restyle its primitives with custom CSS or introduce a parallel library.
- Icons come from `@medusajs/icons` only.
- Colors / typography / spacing use Medusa UI tokens — `text-ui-fg-*`, `bg-ui-bg-*`, `border-ui-border-*`, `shadow-elevation-*`, the documented spacing scale.
- `clx` (re-exported from `@medusajs/ui`) is the canonical conditional-class helper.
- Every interactive element exposes a kebab-case `data-testid`.
- Every user-facing string flows through `useTranslation()`. Translation files live in the *consuming* package — `dashboard-shared` ships keys (`actions.*`, `fields.*`, `general.*`, `transferOwnership.*`, `addresses.*`) but expects them to be present in the host app's i18n bundle.

## Extension model

This package is the seam between Mercur's first-party dashboards and any extension a user writes. The contract is:

1. **Stable named imports from the package root.** Anything in `src/index.ts` is part of the public API. Sub-paths are not.
2. **No routing or domain logic.** Everything here is presentation + form state + cache plumbing. Block authors are free to compose these primitives without inheriting Mercur's route map or sidebar.
3. **`@medusajs/ui` as the lowest common denominator.** A block authored against `@mercurjs/dashboard-shared` automatically inherits the same Medusa UI theme as admin and vendor — there is no theming surface to configure.
4. **Pair with `@mercurjs/dashboard-sdk`.** The SDK provides file-based routing, the virtual route module, and the `blocks.json` resolver; `dashboard-shared` provides the UI building blocks the resulting pages render.

When in doubt about how to use a primitive, mirror the canonical reference in `@mercurjs/admin` (list → category-list, detail → category-detail, create wizard → product-create, drawer edit → category-edit) — those pages are the source of truth for how everything in this package is meant to be composed.
