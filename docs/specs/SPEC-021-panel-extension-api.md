---
status: live
canonical: true
area: framework/dx
created: 2026-07-06
last_updated: 2026-07-07
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
`before | after | replace` placement suffix and a numeric `rank` for ordering
multiple contributions).

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
  full set is typed as `NavItemId`, generated into the panel's shipped
  `extension-targets.d.ts` from its `useCoreRoutes()` ids — see the Typed-targets
  subsection
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
  checked against the generated `NavItemId` / `NavParentId` unions (Design
  Principle #4), the same way `defineWidgetConfig`'s `zone` is checked against
  `WidgetZoneId`. The crawl would accept a bare object, but the helper makes typos
  and invalid targets fail type-check.

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
  there is no separate `rank` field.
- Zones exist on list, detail, create, and edit views. The typed set of zone ids
  (`WidgetZoneId = keyof WidgetZoneRegistry`) is **generated** by a script in the
  panel package: the panel ships `extension-targets.d.ts` seeding the built-in
  zones (derived from its `<WidgetZone>` host usages). A developer's own custom
  zone is added by hand `declare module` augmentation (no end-project codegen for
  the MVP) — see the Typed-targets subsection under §6.
- `replace` swaps the built-in content of that zone; multiple `before`/`after`
  widgets stack in registration order (ties broken deterministically).
- **Subsumes** the old standalone Login surface: login logo/before/after content
  are widgets in `login.logo` / `login.before` / `login.after` zones (public,
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

Page-level action bars that are not tied to a model use the page's own widget
zones (§2), not a model's `displays`.

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
        { id: "created_by", component: null }, // REMOVE a built-in field (render nothing)
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
- **Persistence is out of scope for the MVP.** The MVP delivers the UI surface —
  custom fields render, validate, and display through the built-in forms/sections —
  but no core-side write path. A developer who needs to persist a value wires their
  own backend (route/workflow) for it. A built-in persistence channel is deferred.
- `displays` is the model's read/section surface:
  - `fields`: replace, remove, or add a field keyed by `id`. When `id` matches a
    **built-in** field the entry overrides it in place — `component` replaces its
    render, `component: null` removes it (no separate `hidden` flag); when `id` is
    not a built-in field the entry adds a new read-only row. Built-in fields are
    the ones each detail section wraps in a `<DisplayField model zone id>` host
    (which consults the override); those hosts are the source of truth for the
    generated `displayFieldIds` union (§6, Typed targets), so built-in ids
    autocomplete while unknown ids (adds) still type-check.
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
  It must respect the wizard's existing state machine and completion gating (fields
  render/validate only; persistence is out of scope, as above). Adding a brand-new
  step with fully custom content is a widget
  in the onboarding zone (§2), not a field-map entry. Vendor app only.
- **Statuses are just fields.** There is no separate status-remapping surface. A
  status (order, seller, payout, etc.) is an ordinary field: relabel/recolor is a
  `displays[].fields` **replace** of the status field's badge render, and changing
  the selectable set is a `forms` field `component` override. The status field's
  underlying values and transition machine stay backend-owned — the panel API
  only replaces how the field is rendered and edited (see Non-Goals).
- Persistence: **out of scope for the MVP** (see above). Custom fields are a
  render/validate/display surface only; a built-in write path is deferred to a
  later spec.

### Typed targets — panel-generated `extension-targets.d.ts` + runtime registry

Design Principle #4 (Typed) is delivered by **generating** the valid target-id
unions from the real built-in pages, rather than hand-writing them. The key idea:
the zone **host component** a built-in page renders — `<WidgetZone id="…" />` (and
the equivalent display/form hosts) — is the **single declaration point** for a
zone. From that one usage, two things derive:

- *Runtime:* the host resolves contributions against the `DashboardAPI` singleton
  via `useExtension().getWidgets(id)` (below).
- *Build time (in the panel package only):* a derive step scans those host usages
  and generates a `.d.ts` (`@mercurjs/{admin,vendor}/extension-targets.d.ts`)
  seeding the built-in ids into open **registry interfaces**, shipped in the
  package types (below).

So a zone that no page renders as a host cannot be targeted and never enters the
types — the pages are the source of truth, and there is no separate hand-written
zone registry to keep in sync. The codegen runs **only when the panel package is
built**; the end developer never runs a crawl. This is the same crawl→template→
write shape as Mercur's CLI route codegen
(`packages/cli/src/codegen/index.ts::writeRouteTypes` → `.mercur/routes.d.ts`),
except the output is a shipped `.d.ts` of open interfaces (declaration-merge
target) rather than a JSON file re-read in the consuming app. A typo in a
zone/tab/field/nav id, or targeting a model/page that doesn't expose that zone,
fails `tsc` instead of silently no-op'ing at runtime.

- **Baseline registry per panel — a generated `.d.ts`, not JSON.** Each panel owns
  a small generator **script** (e.g. `packages/vendor/scripts/generate-extension-targets.ts`,
  and the admin equivalent) wired as a prebuild step in that package's `build`
  (before `tsup`). It scans `packages/{admin,vendor}/src/pages/**` for the
  `<WidgetZone id>` hosts, the `<FormExtensionZone>` / `<DisplayExtensionZone>`
  model/zone hosts, the `<DisplayField model zone id>` field hosts (→
  `displayFieldIds`), plus the `useCoreRoutes()` nav ids
  (reusing the dashboard-sdk babel helpers — `parse`/`traverse`, `crawlRoutes`) and
  writes `src/extension-targets.d.ts`, shipped in the package types as
  `@mercurjs/{admin,vendor}/extension-targets.d.ts`. It seeds the built-in ids into
  **registry interfaces**; the helper types read the union off the interface keys
  (`type WidgetZoneId = keyof WidgetZoneRegistry`), so the panel ships the built-in
  half as an open interface an end project can extend:

  ```ts
  // @mercurjs/vendor/extension-targets.d.ts — GENERATED at panel build from host usages
  declare module "@mercurjs/dashboard-sdk" {
    interface WidgetZoneRegistry {
      "product.list.before": true
      "product.list.after": true
      "product.detail.side.before": true
      "login.logo.replace": true
    }
    interface NavItemRegistry { orders: true; products: true; categories: true; campaigns: true /* … */ }
    interface NavParentRegistry { orders: true; products: true; customers: true; promotions: true; "price-lists": true }
    interface CustomFieldsRegistry {
      product: {
        formZones: "create" | "edit" | "organize" | "attributes"
        formTabs: { create: "general" | "organize"; edit: never }
        displayZones: "general" | "organize" | "attributes"
        displayFieldIds: "title" | "status" | "description" | "handle" | "discountable"
      }
    }
  }
  ```

  `defineWidgetConfig` types `zone` as `WidgetZoneId`; `defineNavigationConfig`
  types `items[].id`/`items[].nested` as `NavItemId`/`NavParentId | null`;
  `defineCustomFieldsConfig<TModel>` constrains `zone`/`tab`/display `zone` against
  `CustomFieldsRegistry[TModel]`.

- **No end-project codegen for the MVP.** The SDK plugin does **not** crawl the
  developer's app or emit any `.mercur/*.d.ts` for extension targets. The only
  generated artifact is the panel-shipped `extension-targets.d.ts` above (produced
  at each panel's own build). A developer who renders their **own** custom zone
  hand-writes a `declare module "@mercurjs/dashboard-sdk"` augmentation to register
  its id (the escape hatch below). Auto-deriving the developer's own zone ids from
  a crawl of their `src/{widgets,custom-fields}` is a **post-MVP** enhancement.

  ```ts
  // the developer's own d.ts — hand-written escape hatch (MVP)
  declare module "@mercurjs/dashboard-sdk" {
    interface WidgetZoneRegistry {
      "erp.dashboard.before": true // a zone the developer's own page renders
    }
  }
  ```

  Because `WidgetZoneId = keyof WidgetZoneRegistry`, the panel's shipped
  `extension-targets.d.ts` and any hand-written augmentation **merge** into one
  union — the panel owns the built-in keys, the developer adds their own.

- **Runtime singleton.** At app root each panel constructs a single
  `ExtensionRegistry` (mirror Medusa's `DashboardApp`,
  `dashboard/src/dashboard-app/dashboard-app.tsx`) from the aggregated
  `virtual:mercur/{widgets,custom-fields,navigation,commands}` modules. It holds
  `Map<WidgetZoneId, Widget[]>`, per-model form/display maps, and nav overrides,
  and exposes getters via a `useExtension()` hook (`getWidgets(zone)`,
  `getDisplays(model, zone)`, `getFormFields(model, zone, tab)`, `getMenu()`).
  The built-in `<WidgetZone id>` / display / form hosts read from it via
  `getWidgets(id)` and resolve `before → built-in|replace → after`. The MVP uses
  this lightweight per-id host; Medusa's richer `LayoutComposer`
  (`components/layout-composer/`, a `widgetsZonePrefix` + `sections={{main,side}}`
  composer resolved by `getWidgetsForSections`) is a possible later enhancement,
  not part of the MVP.

- **One generated layer + a hand-written escape hatch.** The only generated
  artifact is the panel's shipped `extension-targets.d.ts` (built-in keys). To
  register a zone their **own** page renders, a developer hand-writes a
  `declare module "@mercurjs/dashboard-sdk"` augmentation — the same
  declaration-merging mechanism as Medusa's `InjectionZoneRegistry` merge; such ids
  are validated-but-warned at runtime (mirror `isValidInjectionZone`). Built-in
  keys are never hand-written — they come from the panel's generated `.d.ts`.
  Auto-generating the developer's own ids from a crawl of their app is post-MVP.

- **Field-value types.** The generated unions type **targets** (which
  zone/tab/field/nav ids exist). The **value** type of a custom form field still
  comes from its Zod `validation` via `createFormHelper` — the two compose:
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
  are still fully type-checked against the generated `NavItemId` / `NavParentId`
  unions (§6, Typed targets).
- **Rendering.** Built-in pages render zone hosts (`<WidgetZone id="..." />`,
  field/display hosts, section-action hosts) at the documented zone ids.
  Compound-page slots and zone hosts coexist: compound slots are for full
  re-composition, zones are for additive injection.
- **Runtime registry (singleton).** Each panel constructs one `ExtensionRegistry`
  at app root from the aggregated `virtual:mercur/*` modules — mirroring Medusa's
  `DashboardApp` (`dashboard/src/dashboard-app/dashboard-app.tsx`). It holds
  `Map<WidgetZoneId, Widget[]>`, per-model form/display maps, and nav overrides,
  and exposes getters via a `useExtension()` hook (`getWidgets`, `getDisplays`,
  `getFormFields`, `getMenu`) that the zone hosts consume.
- **Typing.** Zone ids, built-in nav ids, and custom-field models/zones/tabs/fields
  are **generated** as open registry interfaces by a script inside each panel
  package (`packages/{admin,vendor}/scripts/…`), which ships
  `extension-targets.d.ts` in the package types. There is **no end-project
  codegen** for the MVP — a developer types their own custom zones by hand
  `declare module` augmentation — see the Typed-targets subsection under §6. This
  mirrors the shape of the existing generated API route-map (`writeRouteTypes` →
  `.mercur/routes.d.ts`), which stays as-is.
- **Surface split is implicit.** Admin and vendor are separate Vite apps with
  separate host `src/`, so there is no `surface` field and no build-time filter —
  a file only ships to the panel it lives in.
- **Blocks.** Blocks (`mercurjs add`) can ship these files the same way they ship
  pages today, so a block can add a widget/column/field without the consumer
  wiring anything.

## Implementation

This section is the build guide for the MVP. It reuses two proven skeletons: the
Mercur Dashboard SDK's build-time crawl + virtual-module machinery
(`packages/dashboard-sdk/src`) and Medusa's admin extension patterns
(`/Users/viktorholik/Desktop/medusa/packages/admin`). The MVP lands as the five
[Deliverable Slices](#deliverable-slices-suggested-sub-specs); each slice is a
sub-spec. Runtime contributions are aggregated by a per-panel singleton
(`ExtensionRegistry`, mirroring Medusa's `DashboardApp`); typed target ids are
**generated** as open registry interfaces by a script in each panel package that
ships `extension-targets.d.ts` (from its host usages). No end-project codegen for
the MVP; developers augment by hand for their own zones (§6, Typed targets).

### The repeatable SDK surface recipe

Every folder-crawled virtual-module surface (widgets, custom-fields, commands)
follows the same five edits in `packages/dashboard-sdk/src`, mirroring how
`menu-items` / `routes` / `i18n` are already wired:

1. **`constants.ts`** — add `X_VIRTUAL_MODULE = "virtual:mercur/x"`,
   `RESOLVED_X_MODULE = "\0" + X_VIRTUAL_MODULE`, and push the id into
   `VIRTUAL_MODULES`.
2. **`src/x.ts`** — a `generateX(config: BuiltMercurConfig): string` that crawls
   `path.join(srcDir, "x")` with the `crawlRoutes`-style recursive walk and
   extracts `export const config` / default export via the Babel helpers in
   `menu-items.ts` (`getConfigObjectProperties`, `parse`/`traverse` from
   `./babel`). Emit a module that imports each contributor and default-exports the
   aggregated array. Append plugin/block contributions with the
   `pluginExtensions.map(... __plugin${i}.xModule?.… )` spread pattern already in
   `generateMenuItems`.
3. **`virtual-modules.ts`** — add `if (id === RESOLVED_X_MODULE) return
   generateX(mercurConfig)` to `loadVirtualModule`.
4. **`plugin.ts`** — add `virtual:mercur/x` to `optimizeDeps.exclude`, and extend
   the `configureServer` / `handleHotUpdate` watchers so edits under `src/x/`
   invalidate `RESOLVED_X_MODULE` (generalize the current `isRouteFile` check to
   the surface's folder).
5. **`generate-plugin-entry.ts`** — add an `xModule` to the plugin entry object so
   installed blocks contribute (all surfaces **except navigation**, which is
   host-only).
6. **Typed-target generation lives in the panel package, not the SDK plugin.** The
   `plugin.ts` does **not** emit any extension-target `.d.ts` for the MVP. Instead
   each panel package owns a prebuild **script**
   (`packages/{admin,vendor}/scripts/generate-extension-targets.ts`, wired before
   `tsup` in the package `build`) that scans `src/pages/**` for `<WidgetZone id>` /
   display / form host usages + `useCoreRoutes()` ids and writes
   `src/extension-targets.d.ts` (open `WidgetZoneRegistry` / `NavItemRegistry` /
   `NavParentRegistry` / `CustomFieldsRegistry` interfaces), shipped in the package
   types. Developers add their own zones by hand `declare module` augmentation;
   declaration merging unions the two. This is the crawl→template→write shape of
   `packages/cli/src/codegen/index.ts::writeRouteTypes`, applied to extension
   targets.

Consumer wiring per panel: declare `virtual:mercur/x` in
`packages/{admin,vendor}/src/module.d.ts`, import it into the panel's
`ExtensionRegistry` singleton (mirror Medusa `dashboard-app.tsx`), and read it
from the zone hosts via `useExtension()` (see each slice).

Helpers live in a new `packages/dashboard-sdk/src/config/` (re-exported from
`index.ts`): `defineWidgetConfig`, `defineNavigationConfig`,
`defineCustomFieldsConfig`, `createFormHelper`, `defineCommandConfig`. Each is a
thin `createConfigHelper` wrapper — copy Medusa's
`admin-sdk/src/config/utils.ts`, which spreads the config and adds
`$$typeof: Symbol.for("react.memo")` for HMR on values that carry a component.
`createFormHelper<T>()` returns Medusa's zod surface verbatim (`define`, `string`,
`number`, `boolean`, `date`, `array`, `object`, `null`, `nullable`, `coerce`).

### Slice 1 — Widgets

- **Config/type:** `WidgetConfig = { zone: WidgetZoneId | WidgetZoneId[]; id?: string }`,
  `WidgetZoneId` from the panel's generated `extension-targets.d.ts` (§6).
  Placement is the zone-id suffix.
- **Crawl/generate:** `src/widgets.ts` scans `src/widgets/**`, requires a default
  export (component) + `export const config`, derives a stable `widgetId`
  (explicit `config.id` or a short path hash — mirror Medusa
  `admin-vite-plugin/src/widgets/generate-widgets.ts`), and emits
  `export default { widgets: [{ Component, zone, widgetId }] }`.
- **Runtime:** the panel `ExtensionRegistry` singleton builds
  `Map<WidgetZoneId, Widget[]>` from `virtual:mercur/widgets` (mirror Medusa
  `dashboard-app.tsx::populateWidgets`), and a `<WidgetZone id data />` host reads
  it via `useExtension().getWidgets(id)` to render `.before` widgets → the built-in
  child (or the single `.replace` widget) → `.after` widgets. Reference
  render path: Medusa `components/layout-composer/layout-composer.tsx`.
- **Placement:** mount hosts on one page family first (vendor product list +
  detail), plus the public `login.*` zones (the login route rendered under
  `PublicLayout`, before auth).

### Slice 2 — Navigation

- **Discovery:** single host file `src/_navigation.ts` found by a
  `findNavigationFile` helper modeled on `i18n.ts::findI18nIndex`; new
  `NAVIGATION_VIRTUAL_MODULE`; **no** `generate-plugin-entry` slot (host-only).
- **Stable ids at source:** the core routes and their nested children are
  hard-coded in `useCoreRoutes()`
  (`packages/{admin,vendor}/src/components/layout/main-layout/main-layout.tsx`) as
  `{ label, to, items }` with no id. Add a stable `id` to each core route and each
  nested child; the panel's build-time scan reads those ids to seed the
  `NavItemRegistry` / `NavParentRegistry` interfaces in its baseline `.d.ts` (§6).
- **Apply:** an `applyNavOverrides(coreRoutes, navConfig)` step in the sidebar
  merge consumes `virtual:mercur/navigation` and reorders (`rank`), hides
  (`hidden`), relabels (`label`/`icon`), and re-parents (`nested`) built-in items
  before render. The custom-route layer (`getMenuItemsByType` /
  `getNestedMenuItems` in `.../utils/routes.ts`) is untouched.

### Slice 3 — Custom fields for `product`

- **Config/helper:** `defineCustomFieldsConfig<TModel>({ model, link, forms,
  displays, list })`; `forms[].fields` keyed by id → `{ validation, defaultValue,
  label, description, placeholder, component? }`. Copy the shape from Medusa
  `admin-sdk/src/config/types.ts` (`CustomFieldConfig` / `CustomFormField`).
- **Crawl/generate:** `src/custom-fields.ts` scans `src/custom-fields/**`; emit a
  per-model module split into `forms` and `displays` (mirror Medusa
  `generate-virtual-form-module` / `generate-virtual-display-module`). Wire the
  virtual module + `customFieldsModule` block spread.
- **Form injection:** a `<FormExtensionZone model zone tab form />` that renders
  extra fields through the mandated `Form.Field → Form.Item` chain under a
  `custom_fields.<field>` RHF namespace (mirror Medusa
  `dashboard-app/forms/form-extension-zone/form-extension-zone.tsx`). Mount it in
  the vendor product create `TabbedForm` tabs and the product edit `RouteDrawer`.
  Values live in form state only; there is no core-side submission for the MVP.
- **Display injection:** each built-in field in a detail section is wrapped in a
  `<DisplayField model zone id>` host that consults `getDisplays(model, zone)` and
  replaces (`component`) or removes (`component: null`) that field in place; a
  `<DisplayExtensionZone model zone builtInFieldIds>` renders the *added* fields
  (unknown ids) and the `{ rank?, component }` section `ActionMenu` actions. Wire
  the product-detail general section in **both** admin and vendor
  (`product-general-section.tsx`). The `<DisplayField>` hosts also feed the
  generated `displayFieldIds` union (§6).
- **List extension:** apply `list.columns` / `bulkActions` / `filters` /
  `viewDefaults` on the product-list `DataTable`. Respect the vendor curated-field
  constraint — the fetch derived from `link` must merge with `+`/`-`, never bare
  fields (`useProductTableQuery`; gotcha `vendor-products-default-fields-500`).
- **Persistence:** out of scope for the MVP — no core API changes. Custom fields
  render/validate/display only; a built-in write path is deferred to a later spec.

### Slice 4 — Onboarding fields (vendor)

No new helper: `zone: "onboarding"` on the `seller`/`store` model with `tab` = the
wizard **step id**, reusing Slice 3's form injection (render/validate only, no
core-side persistence), mounted into the vendor onboarding wizard
(`packages/vendor/src/components/onboarding-wizard/…`) and respecting its existing
state machine + completion gating. The seller/store onboarding zone and step ids
enter `CustomFieldsRegistry` through the panel's build-time scan of the wizard's
step hosts (seeding its baseline `.d.ts`, §6), so no hand-maintained map is needed.

### Slice 5 — Commands (searchbar)

`defineCommandConfig({ commands: [{ id, group, label, keywords, onSelect }] })`;
crawl `src/commands/**`; wire `COMMANDS_VIRTUAL_MODULE` + block spread; register
the aggregated commands into the panel `SearchProvider` / command palette.

### Verification per slice

- Add an example extension file in a host app (`apps/vendor/src`,
  `apps/admin-test/src`) or a `packages/registry` block exercising the surface;
  confirm the built-in page renders the contribution at the right zone/order with
  the rest of the page unchanged (run `./scripts/dev-worktree.sh`; API :9000,
  admin :7000, vendor :7001).
- A deliberately-wrong `zone`/`model`/nav `id` must fail `bun run lint` (tsc).
- `bun run build` passes.

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
   including the `login.*` zones.
2. Navigation reorder/hide/relabel API — single host-owned `src/_navigation.ts`
   file + `defineNavigationConfig` (single-file discovery like `i18n`, no block
   merge).
3. Custom fields for `product` — `defineCustomFieldsConfig` + `createFormHelper`:
   forms, section `displays` (fields add/replace/remove + `{ rank?, component }`
   actions), and the
   model-scoped `list` block (columns, cells, bulk actions, filters, view
   defaults; linked data fetched via `link`). Render/validate/display only — no
   core-side persistence in the MVP.
   Includes the per-model `CustomFieldsRegistry` interface shipped in the panel's
   generated `extension-targets.d.ts` (hand `declare module` augmentation for a
   developer's own models/zones) so invalid targets fail type-check.
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
  built-in pages (including the login screen).
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

Delivered slices (each its own `passing` sub-spec):

- **Slice 1 — Widgets:** [SPEC-022](./SPEC-022-panel-widgets.md) (`passing`).
  `defineWidgetConfig` + `before|after|replace`, `virtual:mercur/widgets` crawl,
  `ExtensionRegistry`/`ExtensionProvider`/`useExtension`/`<WidgetZone>` runtime in
  `@mercurjs/dashboard-shared`, mounted on the vendor product list/detail.
  Panel-generated `extension-targets.d.ts` types the zone ids.
- **Slice 2 — Navigation:** [SPEC-023](./SPEC-023-panel-navigation.md)
  (`passing`). Single host-owned `src/_navigation.ts` +
  `defineNavigationConfig`, `virtual:mercur/navigation`, `applyNavOverrides`
  wired into both panels' `MainSidebar`.
- **Slice 3 — Custom fields for `product`:**
  [SPEC-024](./SPEC-024-panel-custom-fields.md) (`passing`).
  `defineCustomFieldsConfig` + `createFormHelper`, `virtual:mercur/custom-fields`,
  `<FormExtensionZone>` / `<DisplayExtensionZone>` runtime, mounted on the vendor
  product edit drawer + detail section, and a generated `CustomFieldsRegistry`.
  Render/validate/display only — no core-side persistence.
- Widget zones now also cover the public `login.*` slots (login page) alongside
  `product.list` / `product.detail`.

Foundation shared by all future slices: `packages/dashboard-sdk/src/config/`
(helpers + open registry interfaces), the repeatable virtual-module recipe
(`constants.ts` → `virtual-modules.ts` → `plugin.ts` →
`generate-plugin-entry.ts`), and the per-panel `extension-targets.d.ts`
generator (`packages/{admin,vendor}/scripts/generate-extension-targets.ts`).

Build/type evidence: `bun run build` green (11/11, 2026-07-07); a bad
`zone`/nav id fails `tsc` (TS2322 against `keyof WidgetZoneRegistry`).

Remaining MVP slices — **deliberately deferred by owner decision** (2026-07-07),
not oversights:

- **Slice 4 (onboarding fields):** deferred — mounting it requires editing the
  vendor onboarding-wizard page, which was explicitly held out of scope this
  session (work limited to the product + login pages). The runtime host
  (`<FormExtensionZone zone="onboarding">`) already exists; only the wizard mount
  remains.
- **Slice 5 (commands):** descoped by owner direction; the commands
  virtual-module + searchbar wiring was intentionally removed.

Slice-3 follow-ups (also deferred): mount the create-form injection and list
bulk-actions, and replace the `product.metadata` persistence sink with a
`link`ed-module workflow hook.

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
  `unstable_` prefix and adds the `before | after | replace` placement suffix
  plus a numeric `rank` for ordering contributions.
- **Runtime aggregation mirrors Medusa's `DashboardApp`.** Medusa builds a
  per-panel singleton
  (`packages/admin/dashboard/src/dashboard-app/dashboard-app.tsx`) that populates
  `Map<zone, Widget[]>` / per-model form + display maps and exposes them via a
  `useExtension()` hook; Mercur's per-panel `ExtensionRegistry` is the same shape.
- **Typed targets diverge from Medusa: Mercur derives them from the host usages.**
  Medusa drives its runtime with a component API (`LayoutComposer`,
  `components/layout-composer/`) but keeps the canonical zone list as a
  hand-written, exported const (`INJECTION_ZONES` +
  `InjectionZoneRegistry`, `admin-shared/src/extensions/**`) that pages must match
  manually. Mercur removes the hand-written list: the `<WidgetZone id>` /
  display / form **host** a built-in page renders is the single declaration point,
  and a **script in each panel package** (`packages/{admin,vendor}/scripts/…`,
  prebuild before `tsup`) **derives** the `WidgetZoneId` / `NavItemId` /
  `CustomFieldsRegistry` interfaces from those host usages and writes
  `src/extension-targets.d.ts`, shipped in the package types — the same
  crawl→template→write shape as the CLI route codegen
  (`packages/cli/src/codegen/index.ts::writeRouteTypes` → `.mercur/routes.d.ts`).
  For the MVP there is **no end-project codegen**: a developer registers a zone
  their own page renders via `declare module "@mercurjs/dashboard-sdk"`
  augmentation (declaration merging unions it with the panel's shipped interfaces);
  auto-deriving those from a crawl of the developer's app is post-MVP. The MVP host
  is the lightweight `<WidgetZone id>`; a `LayoutComposer`-style prefix/sections
  composer is a later option.
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
