# Component inventory (what to render)

The map from a Figma element to the primitive you render. This replaces Code Connect: when you see a region in the design, find its row here and use that component. Everything comes from two sources only:

- **`@mercurjs/dashboard-shared`** — the internal design-system layer (the primary "shared components" source).
- **`@medusajs/ui`** — Medusa's design system (raw primitives: `Button`, `Input`, `Select`, `Heading`, `Text`, `Badge`, `StatusBadge`, `Container`, `Tooltip`, `clx`, `toast`, `usePrompt`, …).

Icons come from **`@medusajs/icons`** only. Data comes from **`@mercurjs/client`** (the typed SDK, `sdk.admin.*` / `sdk.vendor.*`) — not a UI concern. Headless primitives that shared components are built on (`radix-ui`, `@ariakit/react`, `cmdk`, `@tanstack/react-table`, `@tanstack/react-virtual`, `@dnd-kit/*`, `react-hook-form`, `zod`) are allowed but you rarely reach for them directly. Also available from Medusa: `@medusajs/dashboard`, `@medusajs/admin-shared`, `@medusajs/ui-preset` (Tailwind preset, dev).

**Never** introduce another component or icon library (no MUI, Chakra, Ant, Mantine, lucide, heroicons, react-icons, FontAwesome, styled-components, emotion). If a needed component isn't here, compose it from Medusa UI primitives or add it to `@mercurjs/dashboard-shared`.

## Page archetypes → layout

| Figma screen | Archetype | Layout primitive | Mirror this existing page |
| --- | --- | --- | --- |
| A table/list of records | **list** | `SingleColumnPage` + one `Container` (header + `DataTable`) | `packages/admin/src/pages/categories/category-list` |
| A record with a main area + sidebar of meta | **detail** | `TwoColumnPage` (`.Main` + `.Sidebar`, each stacked `gap-y-3`) | `.../categories/category-detail` |
| A full-screen "create" flow, often multi-step | **create** | `RouteFocusModal` + `TabbedForm` | `.../products/product-create` |
| A quick side-panel edit of one entity | **edit** | `RouteDrawer` + `RouteDrawer.Form` | `.../categories/category-edit` |

`SingleColumnPage` / `TwoColumnPage` support `showJSON` / `showMetadata` (pass `data={entity}`).

## Layout & structure

| Figma element | Render |
| --- | --- |
| Page frame (list/simple) | `SingleColumnPage` |
| Page frame (detail w/ sidebar) | `TwoColumnPage` → `TwoColumnPage.Main`, `TwoColumnPage.Sidebar` |
| Card / panel / section | `Container className="divide-y p-0"` (see `patterns.md`) |
| Section header row | `<div className="flex items-center justify-between px-6 py-4">` with `<Heading>` + actions |
| Label/value row | `SectionRow` (grid, `text-ui-fg-subtle`) |
| Key–value metadata block | `MetadataSection` (or `SingleColumnPage showMetadata`) |
| Raw JSON block | `JsonViewSection` |

## Modals & drawers

| Figma element | Render | Compound sub-parts |
| --- | --- | --- |
| Full-screen create/wizard | `RouteFocusModal` | `.Header .Title .Body .Description .Footer .Close .Form` |
| Side-panel edit | `RouteDrawer` | `.Header .Title .Body .Description .Footer .Close .Form` |
| Modal opened from inside a modal | `StackedFocusModal` | `.Trigger .Content .Header .Title .Body .Footer .Close` |
| Drawer opened from inside a drawer | `StackedDrawer` | same as above |
| Confirm/destructive dialog | `usePrompt()` (`@medusajs/ui`) via a delete-action hook, or `ConfirmPrompt` | — |

Never render raw `FocusModal` / `Drawer` from `@medusajs/ui` for a page's create/edit surface — use the `Route*` wrappers so nav-blocking and dirty prompts work.

## Forms

| Figma element | Render |
| --- | --- |
| Any form field | `Form.Field` → `Form.Item` → `Form.Label` / `Form.Control` / `Form.ErrorMessage` (+ `Form.Hint` for help text) |
| Text / number input | `Input` (`@medusajs/ui`) inside `Form.Control` |
| Multi-line input | `Textarea` (`@medusajs/ui`) |
| Dropdown | `Select` (`@medusajs/ui`); searchable → `Combobox` (shared) |
| Toggle / switch (carded) | `SwitchBox` (shared) |
| Tag / multi-value input | `ChipInput` (shared) |
| File / image upload | `FileUpload` (shared) |
| Country / province pickers | `CountrySelect` / `ProvinceSelect` (shared) |
| Percentage / currency | `PercentageInput` (shared) / `react-currency-input-field` |
| URL handle field | `HandleInput` (shared) |
| Address / email / metadata composite | `AddressForm` / `EmailForm` / `MetadataForm` (shared) |
| Multi-step form | `TabbedForm` + `useTabbedForm` + `defineTabMeta` (each tab a `Root` with `_tabMeta`) |

Never use raw `<input>`, `<textarea>`, `<select>`, or react-hook-form `<Controller>` directly — always the primitives above inside `Form.Field`.

## Tables & data display

| Figma element | Render |
| --- | --- |
| Data table | `DataTable` + `useDataTable` (page size 20, `keepPreviousData`) |
| Column cells | shared cells: `TextCell`, `DateCell`, `CreatedAtCell`, `EmailCell`, `MoneyAmountCell`, `NameCell`, `StatusCell`, `PlaceholderCell`, `CodeCell` |
| Editable grid | `DataGrid` (`.TextCell .NumberCell .CurrencyCell .BooleanCell .MultilineCell .ExpandableTextCell .ReadonlyCell`) |
| Row / section action menu | `ActionMenu` (groups of `{ label, icon, to | onClick }`) |
| Empty (searched, no matches) | `NoResults` |
| Empty (no records yet) | `NoRecords` (optional `action={{ to, label }}`) |
| Filters / sorting | `FilterGroup`, `OrderBy`, `Query` (shared) |
| Infinite / virtual list | `InfiniteList` |
| Reorderable list / tree | `SortableList` / `SortableTree` |

## Common bits

| Figma element | Render |
| --- | --- |
| Status pill | `StatusBadge` (`@medusajs/ui`) — colors/labels from `pages/<domain>/common/utils.ts` |
| Tag / chip | `Badge`, `ChipGroup`, `TaxBadge` |
| Loading placeholder | `Skeleton` (detail pages: `TwoColumnPageSkeleton`) |
| Avatar / logo | `IconAvatar`, `ImageAvatar`, `LogoBox`, `AvatarBox`, `Thumbnail` |
| Segmented toggle | `SegmentedControl` |
| Progress | `ProgressBar` |
| Copyable id | `DisplayId` |
| Tooltip (conditional) | `ConditionalTooltip` |

## Data layer (not UI, but you'll wire it)

- Hooks live in `packages/<pkg>/src/hooks/api/<domain>.tsx`, built on `queryKeysFactory(domain)` (shared) + TanStack Query.
- Detail pages seed data via a `loader.ts` (react-router) passed as `initialData`.
- Mutations invalidate `lists()` / `details()` / `detail(id)` keys.

## Component variants & props (pick the right one from the design)

Choosing the component is half the job — you also have to pick its variant/size to match the design's visual state. These are the **actual** prop unions from the installed `@medusajs/ui` types (`packages/admin/node_modules/@medusajs/ui/dist/cjs/components/*`). Map the Figma element's role/emphasis to a variant here; do not restyle with `className`.

| Component | Prop | Values (default in **bold**) | Map from design |
| --- | --- | --- | --- |
| `Button` | `variant` | **primary** · secondary · transparent · danger | filled CTA → `primary`; outline/cancel → `secondary`; inline/icon-only text → `transparent`; destructive → `danger` |
| `Button` | `size` | small · **base** · large · xlarge | toolbars/footers use `small` |
| `Button` | `isLoading`, `asChild` | boolean | pending state / wrapping a `<Link>` |
| `IconButton` | `variant` / `size` | primary · **transparent** / 2xsmall · xsmall · **small** · base · large · xlarge | action-menu trigger = `transparent` + `small` |
| `Badge` | `color` | **grey** · green · red · blue · orange · purple | semantic tag color |
| `Badge` | `size` | 2xsmall · xsmall · **small** · base · large | — |
| `StatusBadge` | `color` | **grey** · green · red · blue · orange · purple | pull color/label from `pages/<domain>/common/utils.ts` helpers, don't hardcode |
| `Text` | `size` | xsmall · **small** · base · large · xlarge | row text = `small`; chips/breadcrumbs = `xsmall` |
| `Text` | `weight` / `leading` / `family` | **regular** · plus / **normal** · compact / **sans** · mono | emphasis = `weight="plus"`; table rows = `leading="compact"` |
| `Heading` | `level` | **h1** · h2 · h3 | section title default; sidebar section = `h2` |
| `Input` | `size` | small · **base** | dense forms use `small` |
| `Select` | `size` | **base** · small | — |
| `Switch` | `size` | **small** · base | toggles (prefer `SwitchBox` for carded toggles) |
| `Hint` | `variant` | **info** · error | help text vs. error |

Notes:
- `Textarea`, `Checkbox`, `RadioGroup` have **no** style variants — one canonical look; don't invent sizes for them.
- Everything else styles itself; you control layout via the spacing scale in `spacing.md`, not by overriding a component's internal colors.
- Shared composites (`SwitchBox`, `FileUpload`, `ChipInput`, `DataTable`, `ActionMenu`, `NoRecords`, …) already bake in the correct styling — pass data/props, don't restyle.
- If a design needs a variant that doesn't exist in the table above, that's a signal to ask the user, not to `className`-override a Medusa UI component (forbidden — see `patterns.md`).

## Package extras (re-exported on top of shared)

- **admin** `packages/admin/src/index.ts`: `TabbedForm`, `useTabbedForm`, `defineTabMeta`, `TabDefinition`, `Form`, `SwitchBox`, `FileUpload`, `ChipInput`, `DataTable`, `useDataTable`, `SingleColumnPage`, `ActionMenu`, `Notifications`, `PRODUCT_DETAIL_FIELDS`, `PRODUCT_DETAIL_QUERY`.
- **vendor** `packages/vendor/src/index.ts`: `TabbedForm`, `useTabbedForm`, `TabDefinition`, `Notifications`.
