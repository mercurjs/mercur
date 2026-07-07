---
status: not_started
canonical: true
area: framework/dx
created: 2026-07-06
last_updated: 2026-07-06
---

# SPEC-021 New Extension API for Admin & Vendor Panels

This is a `live` canonical spec describing the target extension API for the
Mercur admin (`@mercurjs/admin`) and vendor (`@mercurjs/vendor`) dashboards. It
defines the developer-facing contract for customizing the panels without
forking. Concrete, shippable slices of this contract should be tracked as their
own `passing` specs that reference this one.

## Why

Today a developer who wants to reshape the panels has a narrow, uneven surface:

- **Routes/pages** — drop `src/routes/**/page.tsx` under the host app; the
  Dashboard SDK (`@mercurjs/dashboard-sdk`) crawls them at build time and merges
  them into the route map. A drop-in path that matches a built-in page replaces
  it; other paths append. Navigation entries are derived from an
  `export const config` on each page (label/icon/rank/nested/translationNs),
  exposed via `virtual:mercur/menu-items`.
- **Component overrides** — exactly four layout slots
  (`MainSidebar`, `SettingsSidebar`, `TopbarActions`, `StoreSetup`) passed as
  file paths to `mercurDashboardPlugin({ components: {...} })` in
  `vite.config.ts`, wired through `virtual:mercur/components`.
- **Compound-component re-composition** — pages are exported as compound
  components (`Object.assign(Root, { Header, HeaderTitle, DataTable, ... })`)
  from the `@mercurjs/{admin,vendor}/pages` subpath, so a drop-in route at a
  built-in path can re-render a page with some slots replaced.

That is the entire surface. There is **no** widget/injection-zone system, **no**
declarative way to reorder or hide nav items, **no** list-table extension API
(columns, bulk actions, cell overrides, extra fetched fields), **no** login
customization, **no** onboarding extension, **no** searchbar extension, and
**no** form/field extension (custom fields). Every non-trivial customization
today requires either a full page replacement (copy the whole compound page and
re-wire it) or a layout-slot override that replaces an entire component and
inherits none of the built-in behavior.

The goal of this spec is a **file-based, Medusa-shaped extension model** — one
concern per file, config-in-file, discovered by the same build-time crawl the
SDK already runs for routes. Mercur has Medusa roots, so the API deliberately
mirrors Medusa admin's helpers (`defineWidgetConfig`, `defineRouteConfig`,
`defineCustomFieldsConfig`, `createFormHelper`, `defineLayoutConfig`) rather than
inventing a Vendure-style single `defineDashboardExtension({...})` config tree.
The names are re-exported from `@mercurjs/dashboard-sdk` (without Medusa's
`unstable_` prefix); the semantics are extended where Mercur needs more (e.g. the
`order: before | after | replace` placement field).

The admin and vendor panels are **separate Vite apps**, each with its own host
`src/`. A file dropped into a panel already targets that panel, so there is **no
`surface` field** on any helper — the folder you author in _is_ the surface.
Both panels share the same primitives (see `UI-ARCHITECTURE.md`), so the same
helpers exist in both; a vendor-only concern (e.g. onboarding-wizard fields)
simply lives only in the vendor app.

## Design Principles

1. **Additive by default.** An extension augments the built-in UI; a full page
   replacement remains possible (drop-in route) but is the escape hatch, not the
   norm.
2. **Config lives in the file, discovered by the crawl.** There is no single
   entry point and no `mercur.config.ts`. Each concern is its own file under a
   well-known folder (`widgets/`, `custom-fields/`, …) exporting a
   `defineXConfig(...)` (default export) or `export const config = defineXConfig(...)`
   alongside its component — exactly like Medusa's `src/admin/*` model. The SDK
   crawls these at build time and aggregates them into `virtual:mercur/*`
   modules, the same mechanism already used for routes and menu items. The one
   exception is **navigation**, which is a single host-owned file
   `src/_navigation.ts` (discovered like `src/i18n/index.*`, not a folder crawl —
   see §1).
3. **Zone-keyed.** Contributions attach to stable, documented zone ids
   (`<domain>.<view>.<slot>`) rather than to component internals, so upstream
   refactors don't silently break extensions.
4. **Typed.** Zone ids, page ids, form models, and field ids are typed; invalid
   targets fail at build/type-check time.
5. **Ordered & composable.** Every zone accepts multiple contributions with an
   explicit `before | after | replace` placement, deterministically ordered.

## Extension Surfaces (Scope)

The following six surfaces make up this contract. Each is a candidate for its
own `passing` sub-spec. Helper names mirror Medusa (no `unstable_` prefix) and
are exported from `@mercurjs/dashboard-sdk`.

### 1. Navigation

Custom nav items already come from `export const config = defineRouteConfig(...)`
on drop-in `routes/**/page.tsx` (label/icon/rank/nested/translationNs) — this is
the Medusa-native primary path and does not change.

To reorder, hide, or relabel **built-in** items without replacing the whole
`MainSidebar`, author a single host-owned file `src/_navigation.ts`:

```ts
// src/_navigation.ts
export default defineNavigationConfig({
  items: [
    { id: "orders", rank: 0 }, // pin a top-level item
    { id: "price-lists", hidden: true }, // hide a top-level built-in
    { id: "payouts", label: "settlements" }, // relabel (i18n key or literal)
    { id: "categories", nested: null, rank: 1 }, // promote a nested built-in to top level
    { id: "campaigns", nested: "orders" }, // re-parent a nested built-in under Orders
  ],
});
```

- Navigation is a **single, host-app-owned file** (underscore-prefixed,
  discovered like `src/i18n/index.*` — one file, not a folder crawl). Installed
  blocks **cannot** contribute nav overrides: unlike widgets/custom-fields, which
  merge across host + blocks, the sidebar order/visibility is a deliberate
  host-only single source of truth.
- `id` targets **any** built-in nav item — top-level core routes _or_ nested
  sub-items (e.g. `offers` / `collections` / `categories` under Products,
  `campaigns` under Promotions, `customer-groups` under Customers). The id
  namespace is flat: nested items are addressed by their own id, not a path. The
  full set is generated and typed (`NavItemId`) — see the Codegen subsection
  under §6.
- `nested` **re-parents** a built-in item: `nested: "products"` moves it under
  Products' children, `nested: null` promotes a nested item to top level. It is
  constrained to the built-in **parent** ids (the top-level `useCoreRoutes()` set
  per panel), mirroring Medusa's `NestedRoutePosition`; an invalid parent fails
  type-check.
- `rank` orders an item **within its parent's children** (or among top-level
  items when the item is top-level or promoted via `nested: null`). `hidden`
  removes it from the sidebar (route may still be reachable directly unless also
  removed); `label`/`icon` relabel it.
- **Composition with custom-route nesting.** Custom routes still declare their own
  placement via `defineRouteConfig({ nested })` (unchanged — a freeform child of a
  custom or core path). `_navigation.ts` only reshapes **built-in** items. The two
  layer: custom routes place themselves; `_navigation.ts` overrides built-ins.
  Both feed the existing `virtual:mercur/menu-items` rank system.
- Authored with the typed `defineNavigationConfig` helper: `id` and `nested` are
  checked against the generated `NavItemId` registry (Design Principle #4), the
  same way `defineWidgetConfig`'s `zone` is checked against `WidgetZoneId`. The
  crawl would accept a bare object, but the helper makes typos and invalid targets
  fail type-check.

### 2. Widgets (injection zones)

Medusa's file-based widget model. A widget is a React component attached to a
named zone on a page, where the placement is encoded as the zone's suffix.

```ts
// src/widgets/product-list-banner.tsx
export const config = defineWidgetConfig({
  zone: "product.list.before", // <domain>.<view>[.<slot>].<before|after|replace>
});
export default ProductListBanner;
```

- Follows Medusa's `zone: "product.list.before"` string convention: the
  placement (`before | after | replace`) is the last segment of the zone id, so
  there is no separate `order` field.
- Zones exist on list, detail, create, and edit views. The typed registry of
  zone ids (`WidgetZoneId`) is **generated** from the built-in pages by the same
  codegen that types custom-field targets — see the Codegen subsection under §6.
- `replace` swaps the built-in content of that zone; multiple `before`/`after`
  widgets stack in registration order (ties broken deterministically).
- **Subsumes** the old standalone Login and Toolbar surfaces: global topbar
  controls are widgets in the `topbar` zone; login logo/before/after content are
  widgets in `login.logo` / `login.before` / `login.after` zones (public,
  rendered before authentication).

### 3. List Tables — via `defineCustomFieldsConfig` (model-scoped)

There is **no separate data-table config and no `pageId`**. A model's list table
is an extension of that model, so table customization lives inside the same
model-scoped `defineCustomFieldsConfig({ model, ... })` file (§8) as a `list`
block. The SDK maps the model to its built-in list page(s) internally.

```ts
// src/custom-fields/product.ts — same file as §8
export default defineCustomFieldsConfig({
  model: "product",
  link: ["brand"], // linked module data (brand.*) is fetched with the entity — no separate field list
  list: {
    columns: [
      { id: "title", component: ({ row, value }) => <strong>{value}</strong> }, // override
      { id: "brand_name", header: "Brand", component: ({ row }) => row.brand?.name }, // add (from link)
    ],
    bulkActions: [
      { rank: 0, component: ArchiveBulkAction }, // { rank?, component } — component owns its own label/icon/onClick
    ],
    filters: [/* add / remove list filters */],
    viewDefaults: {
      columnVisibility: { created_at: false }, // hide a column here — no `hidden` flag on columns
      columnOrder: ["title", "sku", "erp_id"],
    },
  },
  forms: [/* §8 */],
  displays: [/* §8 */],
})
```

- **No `extendFields`.** The `link` already declares the module data to fetch
  alongside the entity, so `link` fields are available to both columns and
  section displays without a second field list. The SDK derives the fetch query
  from `link` plus the referenced fields and merges it into the built-in list
  query using the `+`/`-` convention internally (never bare fields — those
  replace route defaults; see the `medusa-fields-param` gotcha). Extension code
  never hand-writes the field list.
- `columns` override or add a cell keyed by column id (added columns read
  from the entity or its `link`ed data); `bulkActions` add multi-select row
  actions integrated with `DataTable`/`useDataTable` selection; `filters`
  add/remove list filters; `viewDefaults` set default column visibility and
  order. Hiding a column is done through `viewDefaults.columnVisibility` (set the
  column `false`), not a `hidden` flag on the column entry.
- **Constraint:** the vendor product list has a hard restriction — its query must
  use the curated fields from `useProductTableQuery` and cannot take arbitrary
  field overrides (see `vendor-products-default-fields-500`). The SDK-derived
  fetch for `link`s on the `product` model in the vendor panel must be validated
  against that curated set.

### 4. Section Actions — via `displays` on `defineCustomFieldsConfig`

There is **no separate action-bar config**. Because section `ActionMenu` groups
belong to a model's detail sections, action contributions ride inside the model's
`displays[].actions` (same model-scoped file as §3/§8). Each entry is
`{ rank?, component }` — the **same api as list `bulkActions`** (§3), no
`hidden`/`id` — and the `component` owns its own label, icon, group placement, and
`onClick`; `rank` positions it within the section's `ActionMenu`. See the
expanded `displays` shape in §8.

Page-level action bars that are not tied to a model (e.g. a global topbar button)
remain widgets via the `topbar` zone in §2.

### 5. Commands (searchbar) — post-MVP

> **Post-MVP.** Not part of the initial deliverable; documented here for shape
> only and deferred to a later iteration.

Contribute custom entries/commands into the panel search (`SearchProvider` /
command palette).

```ts
// src/commands/erp.ts
export default defineCommandConfig({
  commands: [
    {
      id: "erp-lookup",
      group: "erp",
      label: "...",
      keywords: [
        /* ... */
      ],
      onSelect,
    },
  ],
});
```

### 6. Forms & Section Fields (custom fields)

The largest surface. A Medusa `defineCustomFieldsConfig`-style API for adding
fields to built-in create/edit forms and displaying values in detail sections.
Input type and validation are driven from a Zod schema via `createFormHelper`.
The same model file also owns the §3 `list` block and §4 `displays[].actions`.

```ts
// src/custom-fields/product.ts
const form = createFormHelper<ExtendedProduct>()

export default defineCustomFieldsConfig({
  model: "product", // supported models (start with "product")
  link: "brand" | ["a", "b"], // module link(s) fetched alongside the entity
  list: {
    /* §3 table extension (model-scoped) */
  },
  forms: [
    {
      zone: "create" | "edit" | "organize" | "attributes" | "onboarding",
      tab: "general" | "organize" | <stepId>, // TabbedForm tab, or wizard step id for zone: "onboarding"
      fields: {
        erp_id: form.define({
          validation: form.string().nullish(), // Zod → input type + validation
          defaultValue: "" | ((data) => /* ... */),
          label,
          description,
          placeholder,
          component, // custom render component (optional)
        }),
      },
    },
  ],
  displays: [
    {
      zone: "general", // existing detail-page section/container id
      fields: [
        { id: "erp_id", component }, // ADD a read-only field to the section
        { id: "status", component: BrandedStatusBadge }, // REPLACE an existing field's render
        { id: "created_by", hidden: true }, // REMOVE a built-in field from the section
      ],
      actions: [
        // §4: section ActionMenu contributions — same { rank?, component } api as list bulkActions
        { rank: 0, component: SyncErpAction }, // component owns its own label/icon/group/onClick
      ],
    },
  ],
})
```

- `createFormHelper<T>()` exposes `define`, `string / number / boolean / date /
array / object / null / nullable / coerce` (Medusa's surface, no `unstable_`).
- Form fields render through the mandated `Form.Field` → `Form.Item` primitive
  chain (no raw `Controller`) and participate in the existing
  `TabbedForm`/`RouteDrawer` submit + validation flow.
- **Submission via `additional_data`.** Custom field values are not spread onto
  the entity payload; they are collected under the request's `additional_data`
  bag (Medusa's convention), so the built-in create/edit route accepts them
  without knowing about them. The linked module's workflow hook reads
  `additional_data.<field>` and persists it. This keeps custom fields decoupled
  from the core validators — no "Unrecognized fields" rejection on the built-in
  route.
- `displays` is the model's read/section surface:
  - `fields`: add a new read-only field, replace a built-in field's render
    (`component`), or remove it (`hidden`), keyed by field `id`.
  - `actions`: add entries to that section's `ActionMenu` (this is §4, folded
    in). Each entry is `{ rank?, component }` — the **same api as list
    `bulkActions`**, no `hidden`/`id` — with the `component` owning its own label,
    icon, group, and `onClick`, and `rank` positioning it in the menu.
- `zone: "attributes"` targets the vendor product attributes tab (see SPEC-014
  attributes work) — custom fields and the attributes module must not collide.
- **Onboarding is just a form zone.** The vendor onboarding wizard is the
  seller/store model's multi-step form, so extending it is not a separate helper:
  use `zone: "onboarding"` on the relevant model (`seller`/`store`) with `tab`
  set to the wizard **step id** to inject validated fields into an existing step.
  This runs through the same `additional_data` submission + workflow-hook
  persistence path and must respect the wizard's existing state machine and
  completion gating. Adding a brand-new step with fully custom content is a widget
  in the onboarding zone (§2), not a field-map entry. Vendor app only.
- **Statuses are just fields.** There is no separate status-remapping surface. A
  status (order, seller, payout, etc.) is an ordinary field: relabel/recolor is a
  `displays[].fields` **replace** of the status field's badge render, and changing
  the selectable set is a `forms` field `component` override. The status field's
  underlying values and transition machine stay backend-owned — the panel API
  only replaces how the field is rendered and edited (see Non-Goals).
- Persistence: the submitted `additional_data` is consumed by a workflow hook on
  the linked module(s) named in `link`, which writes the values. The exact hook
  (e.g. `productsCreated` / update hooks) is a per-model design decision to be
  resolved in the sub-spec; start with `product` only.

### Codegen — typed targets for `defineCustomFieldsConfig`, `defineWidgetConfig`, and `defineNavigationConfig`

The valid `model` values and, **per model**, the valid form `zone`s, form `tab`s,
`displays` `zone`s, and `displays[].fields` ids are not
hand-maintained union types — they are **generated** from the built-in pages at
build time, the same way Mercur already generates the API route map
(`mercurjs codegen` → `packages/core-plugin/.mercur/_generated`), emitting the
declaration file `.mercur/custom-fields.d.ts`. The same crawl
also emits the valid **widget `zone` ids** consumed by `defineWidgetConfig` (§2)
and the **built-in nav item ids** consumed by `defineNavigationConfig` (§1).
This is what makes Design Principle #4 (Typed) real: a typo in a
zone/tab/field/nav id, or targeting a model/page that doesn't expose that
zone, fails type-check instead of silently no-op'ing at runtime.

- **What it emits.** A generated declaration module
  (`.mercur/custom-fields.d.ts`) exporting a per-model registry:

  ```ts
  // GENERATED — do not edit
  export interface CustomFieldsRegistry {
    product: {
      formZones: "create" | "edit" | "organize" | "attributes"
      formTabs: { create: "general" | "organize"; edit: never; /* … */ }
      displayZones: "general" | "organize" | "attributes"
      displayFields: { general: "title" | "status" | "created_by" | /* … */ }
    }
    seller: {
      formZones: "onboarding" | "edit"
      formTabs: { onboarding: "store-details" | "payment" | /* wizard step ids */ }
      /* … */
    }
    // … one entry per model that exposes custom-field/zone hosts
  }
  ```

  `defineCustomFieldsConfig<TModel>` is generic over the model and constrains
  every `zone`/`tab`/`id` against `CustomFieldsRegistry[TModel]`, so
  `createFormHelper` and the config literal autocomplete the real ids and reject
  invalid ones.

  The same module also emits a flat **widget zone registry** — the union of every
  `<domain>.<view>[.<slot>].<placement>` id exposed by built-in pages:

  ```ts
  // GENERATED — do not edit
  export type WidgetZoneId =
    | "product.list.before"
    | "product.list.after"
    | "product.list.replace"
    | "product.detail.before"
    | "topbar.before"
    | "login.logo.replace"
    // … one entry per zone × placement exposed by built-in pages
  ```

  `defineWidgetConfig` constrains its `zone` field to `WidgetZoneId`, so a typo or
  a zone that no built-in page renders fails type-check. The placement suffix
  (`before | after | replace`, §2) is part of the id, so only placements a zone
  actually supports appear in the union.

  The same module also emits the **built-in nav item registry** consumed by
  `defineNavigationConfig` (§1) — a flat union of every built-in nav id (top-level
  _and_ nested), plus the parent subset used to constrain re-parenting:

  ```ts
  // GENERATED — do not edit
  export type NavItemId =
    | "orders"
    | "products"
    | "offers" // nested under products
    | "collections" // nested under products
    | "categories" // nested under products
    | "promotions"
    | "campaigns" // nested under promotions
    | "customers"
    | "customer-groups" // nested under customers
    | "price-lists"
    | "payouts"
    // … one entry per built-in nav item exposed by useCoreRoutes()

  // parent ids only — the valid targets for a re-parenting `nested`
  export type NavParentId =
    | "orders"
    | "products"
    | "inventory"
    | "customers"
    | "promotions"
    | "price-lists"
  ```

  `defineNavigationConfig`'s `items[].id` is constrained to `NavItemId` and its
  `items[].nested` to `NavParentId | null`, so targeting or re-parenting under an
  id that no built-in page exposes fails type-check. Admin and vendor generate
  independent unions (their core route sets differ).

- **Where the ids come from.** Each built-in page/section that renders a
  zone host (`<FormZone>`, `<DisplayZone>`, `<WidgetZone>`, section `ActionMenu`)
  declares its ids at the source, and the nav ids are crawled from the per-panel
  `useCoreRoutes()` declaration — the codegen crawls those declarations, it
  does **not** infer from arbitrary JSX. Adding a new built-in section, widget
  zone, or nav item is therefore a deliberate, reviewable change that shows up in
  the generated registry diff.

- **When it runs.** As part of the existing codegen step (extend
  `mercurjs codegen` / the dashboard-sdk build), so the registry regenerates
  whenever built-in pages change. Admin and vendor generate independently (they
  expose different models/zones), consistent with them being separate Vite apps.

- **Field-value types.** The generated types cover **targets** (which
  zone/tab/field/action ids exist). The **value** type of a custom form field
  still comes from its Zod `validation` via `createFormHelper` — the two compose:
  codegen types the address, Zod types the payload.

## Post-MVP Surfaces

The following surfaces are part of the target contract but are **out of scope
for the MVP**. They are documented here so the zone/addressing grammar is
designed with room for them, but no sub-spec should implement them until the
seven core surfaces above have landed.

### Custom layouts (post-MVP)

`defineLayoutConfig({ id, sections })` (mirroring Medusa's `core:two-column`
etc.) lets a **custom drop-in page** register its own named, injectable sections,
so third-party widgets/displays can target them the same way they target
built-in zones.

For the MVP this helper is **not** needed: built-in pages simply document a fixed
set of section ids (`main`, `side`, `header`, …) that §2 widgets and §7 `displays`
attach to — that documented registry is delivered by the widget slice, not by a
public layout-definition helper. `defineLayoutConfig` only earns its keep once
developers author custom pages that need to expose custom injectable sections;
until then it stays post-MVP.

### Alerts (post-MVP)

A polled, severity-scored alert surface rendered in the app-shell header. An
alert declares a `check` that runs on an interval, a `shouldShow` predicate, a
`severity`, a human `title`/`description`, and optional `actions`. File-based
like every other surface, under `src/alerts/`:

```ts
// src/alerts/payout-onboarding.ts (vendor app)
export default defineAlertConfig({
  id: "payout-onboarding-incomplete",
  check: async () => (await sdk.vendor.payoutAccount.query()).status,
  recheckInterval: 60_000,
  shouldShow: (status) => status !== "active",
  severity: () => "warning",
  title: () => "Finish payout onboarding to receive settlements",
  description: "Your Stripe Connect account is not fully onboarded.",
  actions: [
    {
      label: "Resume onboarding",
      onClick: async ({ dismiss }) => {
        /* ... */ dismiss();
      },
    },
  ],
});
```

- Natural fits in Mercur: incomplete payout onboarding, pending seller approvals,
  stale search index, unprocessed requests/returns.
- **Post-MVP.** Not one of the core deliverable slices; schedule only after the
  MVP surfaces are shipping.

## Architecture Notes

- **Discovery.** Reuse the Dashboard SDK build-time crawl + virtual-module
  mechanism already used for routes/menu-items/components. Each concern folder
  maps to a virtual module aggregated at build time —
  `virtual:mercur/{widgets, custom-fields, commands}` —
  alongside the existing `routes`, `menu-items`, `components`, `config`, `i18n`
  modules wired in `packages/dashboard-sdk/src/plugin.ts` + `constants.ts`. List,
  section-action, and onboarding extension are **not** their own modules; they
  ride inside `custom-fields` per model. Contributions from installed blocks'
  `admin_ui`/`vendor_ui` entry points are aggregated the same way. No new runtime
  config file; no `mercur.config.ts`.
- **Navigation is the single-file exception.** `virtual:mercur/navigation` is
  generated from the one host-owned `src/_navigation.ts` file, discovered exactly
  like the existing `virtual:mercur/i18n` single-index-file generation
  (`packages/dashboard-sdk/src/i18n.ts`, `findI18nIndex`/`generateI18n`) rather
  than a folder crawl. It does **not** aggregate block `admin_ui`/`vendor_ui`
  contributions — no plugin-entry `navigationModule` slot — so the sidebar stays a
  host-only single source of truth. Its targets (`items[].id` / `items[].nested`)
  are still fully type-checked: the generated `NavItemId` / `NavParentId` registry
  comes from the same codegen as `WidgetZoneId` / `CustomFieldsRegistry` (§6).
- **Rendering.** Built-in pages render zone hosts (`<WidgetZone id="..." />`,
  field/display hosts, section-action hosts) at the documented zone ids.
  Compound-page slots and zone hosts coexist: compound slots are for full
  re-composition, zones are for additive injection.
- **Typing.** Page ids, zone ids, built-in nav ids, and custom-field
  models/zones/tabs/fields are **generated** so invalid targets fail type-check —
  see the Codegen subsection under §6. This extends the existing generated route-map typing story
  (`packages/core-plugin/.mercur/_generated`); the custom-fields registry is a new
  generated declaration file (`.mercur/custom-fields.d.ts`) alongside it.
- **Surface split is implicit.** Admin and vendor are separate Vite apps with
  separate host `src/`, so there is no `surface` field and no build-time filter —
  a file only ships to the panel it lives in.
- **Blocks.** Blocks (`mercurjs add`) can ship these files the same way they ship
  pages today, so a block can add a widget/column/field without the consumer
  wiring anything.

## Non-Goals

- Runtime (post-build) registration of extensions — this is a build-time system,
  consistent with the current SDK.
- A general plugin marketplace or sandboxing model.
- Replacing the compound-component re-composition escape hatch — it stays as the
  full-replacement path.
- Backend/module extension — covered by SPEC-005 and Medusa's own module model;
  this spec is UI-surface only (aside from the custom-fields persistence path).
- Redefining domain status machines — the panel API re-renders status fields but
  does not own status values, transitions, or their validation.

## Deliverable Slices (suggested sub-specs)

Each can land independently and flip to `passing` on its own:

1. Widget injection zones + `defineWidgetConfig` (`before|after|replace`) with a
   published zone registry for one page family (e.g. product list/detail),
   including the `topbar` and `login.*` zones.
2. Navigation reorder/hide/relabel API — single host-owned `src/_navigation.ts`
   file + `defineNavigationConfig` (single-file discovery like `i18n`, no block
   merge).
3. Custom fields for `product` — `defineCustomFieldsConfig` + `createFormHelper`:
   forms, section `displays` (fields add/replace/remove + `{ rank?, component }`
   actions), and the
   model-scoped `list` block (columns, cells, bulk actions, filters, view
   defaults; linked data fetched via `link`), plus `additional_data` persistence.
   Includes the **codegen** that emits the per-model `CustomFieldsRegistry`
   (valid zones/tabs/display fields/actions) so invalid targets fail type-check.
4. Onboarding field injection (vendor) — `zone: "onboarding"` on the seller/store
   model via the same `defineCustomFieldsConfig`.
5. Commands / searchbar contributions.

Post-MVP (see Post-MVP Surfaces, schedule after the above):

6. `defineLayoutConfig` — custom pages registering their own injectable sections.
7. Alerts — polled, severity-scored shell-header alerts with actions
   (`defineAlertConfig`).

## User-Visible Behavior

A developer can, from their host app (or an installed block) and without forking
a panel package:

- Reorder, hide, and relabel sidebar items.
- Inject React components before/after/replacing content at documented zones on
  built-in pages (including the topbar and login screen).
- Add/override/remove columns, filters, and bulk actions on a model's built-in
  list table, with linked-module data available via `link`.
- Add/replace/remove fields and actions in a model's detail sections.
- Add validated custom fields to a model's built-in create/edit forms, including
  the vendor onboarding wizard steps (`zone: "onboarding"`).
- Add entries to the panel search.

In every case the surrounding built-in UI stays intact; the developer only
supplies their contribution, in a single file under a well-known folder.

## Verification

_To be filled in per sub-spec._ Each slice must:

1. Add an integration/example extension in a host app (or `packages/registry`
   block) exercising the new API.
2. Show the built-in page rendering the contribution at the correct zone/order,
   with the rest of the page unchanged.
3. Pass `bun run build` and type-check (invalid zone/page/model ids must fail
   type-check).

## Evidence

_None yet — spec not started._

## Notes

- Current surface confirmed in `packages/dashboard-sdk/src/types.ts`
  (`MercurConfig.components` = the 4 override slots), `constants.ts` (five
  `virtual:mercur/*` modules), `menu-items.ts` (`export const config` crawl), and
  `packages/dashboard-sdk/src/plugin.ts` (virtual-module wiring). No
  widget/injection-zone or list-table extension system exists today (grep for
  `defineWidgetConfig`/`InjectionZone`/`zone` returns nothing in `packages/`).
- The API deliberately mirrors Medusa admin's extension helpers so it feels
  native to developers with Medusa roots. Reference:
  Medusa `packages/admin/admin-sdk/src/config/{types,utils}.ts`
  (`defineWidgetConfig`, `defineRouteConfig`, `unstable_defineCustomFieldsConfig`,
  `unstable_createFormHelper`, `defineLayoutConfig`). Mercur drops the
  `unstable_` prefix and adds the `order: before | after | replace` placement.
- Medusa's own widget system (`virtual:medusa/widgets`) is **deliberately
  stubbed to `export default {}`** in `plugin.ts`, so the Medusa widget path is a
  no-op in Mercur today — the widget surface in this spec is a new Mercur system
  built on the existing Mercur crawl, not a re-enable of Medusa's.
- Public panel-customization surface as documented today: inline
  `mercurDashboardPlugin({...})` in `vite.config.ts` (no `mercur.config.ts`, no
  `defineConfig`), 4 component-override slots, compound pages from the
  `@mercurjs/{admin,vendor}/pages` subpath. Canonical re-composition example:
  `packages/registry/src/product-import-export/vendor/routes/products/page.tsx`.
- The four override slots map as: `MainSidebar` / `SettingsSidebar` (sidebars),
  `TopbarActions` (topbar), `StoreSetup` (the store-setup / onboarding-fields
  slot rendered by `StoreSetupWidget` in the vendor shell). There is no separate
  `Onboarding` slot — `/onboarding` is a normal public route.
- Overrides today swap a **whole** component by one of the 4 fixed keys; the
  compound `Object.assign(Root, {...})` idiom is used only for internal
  composition and is not wired into any override registry. This spec's zone hosts
  are what make per-slot additive injection possible.
- Navigation uses **single-file discovery** (`src/_navigation.ts`), mirroring the
  existing `src/i18n/index.*` convention (`packages/dashboard-sdk/src/i18n.ts`,
  `findI18nIndex`/`generateI18n`) rather than the `page.*` folder crawl. This is a
  deliberate host-only single-source-of-truth surface — blocks cannot reorder the
  sidebar, so there is no plugin-entry `navigationModule` slot to merge. The
  `defineNavigationConfig` helper is retained for typed `id`s and `defineXConfig`
  parity even though the crawl's config parser (`getConfigObjectProperties`)
  already reads either a bare object or a wrapper call.
- The exact zone-id grammar and the final list of models beyond `product` are
  open and should be pinned in the first sub-specs.
