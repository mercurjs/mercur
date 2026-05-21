---
status: in_progress
canonical: false
priority: 3
area: vendor/offers
created: 2026-05-20
last_updated: 2026-05-21
revision: "2026-05-21 Figma redesign — see top of file"
---

> **2026-05-20 product/variant scope removal.** SPEC-002 moves the
> per-vendor commercial surface (prices + inventory linkage) off the
> master `ProductVariant` and onto the `Offer`. The variant model
> in `packages/core/src/modules/product/models/product-variant.ts`
> no longer declares `manage_inventory`, `allow_backorder`, or a
> `prices` field — the `Migration20260421093258`
> and `Migration20260422105949` migrations drop those columns. The
> `product_variant_inventory_item` link is left registered by Medusa
> but Mercur's `createProductVariantsWorkflow` override no longer
> writes rows to it. Marketplace-shared variants therefore have
> **no per-variant prices, no per-variant stock, no per-variant
> inventory items, and no per-variant inventory toggles.**
>
> The current vendor panel still surfaces all four of those concerns
> through variant-scoped UI inherited from Medusa's admin. This spec
> ships the **Offer** UI as the canonical replacement and
> **removes** the variant-scoped UI in the same change so the
> vendor panel reflects the new domain model.
>
> See the **Variant-scoped UI to remove** section below for the
> exhaustive deletion list. The companion SPEC-002 §Inventory
> Lifecycle / §Pricing Architecture are canonical; this spec only
> describes the UI consequences.

# SPEC-003 Offer Management — Vendor Panel UI

This spec owns the **vendor-facing UI** for the offer module. It is the
visual + interaction contract for the seller dashboard
(`@mercurjs/vendor`) that consumes the endpoints declared in
**SPEC-002 §Endpoint Contracts** under `/vendor/offers/*`. It does
not redefine the API; if the two ever drift, SPEC-002 is canonical
and this spec must follow.

The companion specs are:

- **SPEC-002** — domain model, endpoint contracts, workflows, cart
  integration. Canonical.
- **SPEC-004** — admin panel UI (`@mercurjs/admin`). Read-only list +
  detail surface backed by `/admin/offers` + `/admin/sellers/:id/offers/bulk-delete`.

## Redesign — 2026-05-21 (Figma)

This block is the **current contract** for the list, create wizard, and
detail page. Anywhere below this section conflicts with what's in this
block, this block wins; the older paragraphs are kept for change
history but must be brought in line on the next pass.

### Source designs

| Surface | Figma node |
| --- | --- |
| List page — empty state | `40009201:285783` ("Offers - Empty State") |
| List page — populated + sort menu | `40009202:309403` ("Offers - Sorting") |
| Create flow — Catalogue tab | `40008331:90298` ("Create Offer") |
| Create flow — Stock Levels & Prices tab | `40009131:208213` ("Create Offer - Stock Levels & Prices") |
| Offer detail | `40009131:257674` ("Offer Details") |

All five live in the **Mercur 2.0 - B2B Extention** file
(`fileKey wA3p6jDQ9dE7PPnaNMIJKD`).

### Copy: "seller" → "Store" everywhere user-facing

The empty-state copy used to read **"Bind your seller catalog to a
master variant to make it purchasable."** That string — and any other
user-facing copy in this spec that referred to "seller" — is replaced
by language that uses **"Store"** (or omits the word entirely when the
Figma copy is shorter). Internal architectural prose ("seller-scoped
route", "active seller's locations", etc.) is unaffected.

Canonical empty-state copy (matches Figma `40009201:285783`):

- Heading: **"No offers yet"**
- Description: **"Create offers to start selling on the marketplace"**
- Primary CTA: **"Create"** (single word, not "Create offer")

i18n keys to change:

- `offers.empty.heading`: `"Create your first offer"` →
  `"No offers yet"`.
- `offers.empty.description`: `"Bind your seller catalog to a master
  variant to make it purchasable."` →
  `"Create offers to start selling on the marketplace"`.
- `offers.actions.create`: `"Create offer"` → `"Create"` for the
  list page header and empty-state CTA. Detail/drawer action labels
  that need the noun (`offers.actions.manage_prices`, etc.) stay as
  they are.

### Domain-model implication (must be ratified by SPEC-002)

The redesigned create wizard lets the vendor pick **multiple
variants** and configure stock + price for each one in a single pass.
The cleanest mapping onto SPEC-002's existing 1-offer-per-variant
shape is **fan-out on submit**: one `POST /vendor/offers` per selected
variant, with the wizard's per-row values bound to that variant's
payload. The list, detail, and edit surfaces continue to treat an
offer as a single (seller, variant) pair — the wizard is the only
place where the multi-select lives.

This must be confirmed against SPEC-002 §Endpoint Contracts before
implementation. If SPEC-002 instead chooses to widen the `Offer`
entity to span N variants, this spec follows.

### List page — redesign

Layout overall: `SingleColumnPage` + a single
`<Container className="divide-y p-0">` shell that hosts header,
filter / search / sort row, table, and pagination footer.

Header row (mirrors Figma):

- Left: `<Heading>` **"Offers"** (no subtitle text; spacing same as
  category list).
- Right: primary `Button size="small"` labelled **"Create"** that
  navigates to `create` (no icon).

Filter / search / sort row (below header, separated by `divide-y`):

- Left: `Add filter` button (Medusa UI filter popover, same component
  the inventory list already uses).
- Right cluster (gap-x-2):
  - **Search table** input (`<Input>` with magnifier prefix).
  - **Sort** trigger (icon button with three-horizontal-lines glyph,
    opens a popover with two sections):
    - Section A — field: **Title**, **Created**, **Updated**.
    - Section B — direction: **Ascending (1 → 30)**,
      **Descending (30 → 1)**.

Empty state (Figma `40009201:285783`): a centered card with the tag
icon, **"No offers yet"** heading, **"Create offers to start selling
on the marketplace"** description, and a **"Create"** button. The
card replaces the table when `count === 0 && no active query`.

Filtered-empty state: keep the existing heading **"No matching
offers"** and description **"Adjust filters or search terms."** —
unchanged from the previous version.

Pagination footer: `1 — 10 of 100 results` on the left,
`1 of 10 pages` + `Prev` / `Next` on the right. Page size **10**
(was 20 in the previous spec; Figma shows 10).

### Columns — redesign

The previous column set (Variant / SKU / Price / Stock / Shipping
profile / Updated / actions) is replaced by the Figma column set:

| Header | Source | Cell |
| --- | --- | --- |
| (selection) | `display: "select"` | Checkbox header + row; stops propagation on click. |
| Offer | `variant.product.thumbnail` + `variant.product.title` (or `variant.title` fallback) | 24×24 `Thumbnail` + truncated `<Text size="small" weight="plus" leading="compact">` |
| Category | First `product.categories[0]?.name` | Plain text; `PlaceholderCell` if none. |
| Collection | `product.collection?.title` | Plain text; `PlaceholderCell` if none. |
| Variants | Count of variants the active seller offers from the parent product | `<Text>{count} variants</Text>` (Figma renders `8 variants`). Until SPEC-002 exposes a count aggregate, derive client-side from a bounded fetch of the product's sibling offers. |
| Status | Derived from `product.status` and offer `deleted_at` | `StatusBadge color="green"` **"Published"** when product is `published` and offer is not soft-deleted; otherwise `color="grey"` with the literal status label. |
| (actions) | `display: "actions"` | Row `ActionMenu` (Edit, Manage prices, Manage inventory, Delete) — same actions as the previous version. |

The `Price`, `Stock`, and `Shipping profile` columns from the previous
spec are dropped from the list view. They still render on the detail
page.

`Offer` column drives row navigation (`navigateTo={(row) => row.id}`);
checkbox cell calls `e.stopPropagation()` so selection doesn't open
the detail page.

### Create flow — redesign (two tabs)

Host: `RouteFocusModal` (closes back to `/offers`). Inside:
`TabbedForm` with **two** tabs instead of three. The previous Variant
+ Details + Pricing & stock split is replaced by:

1. **Catalogue** (Figma `40008331:90298`) — multi-select listing of
   the **variants** the active seller is allowed to bind offers
   against. Backed by
   `sdk.vendor.productVariants.query({ q, limit, offset, fields })`
   (one row per variant, **not** per product) per the user's explicit
   instruction. Columns (mirroring the Figma layout, adapted from
   product rows to variant rows): **Product** (product title +
   thumbnail), **Category**, **Collection**, **Variants** (variant
   title), **Status** (product status badge). Header carries
   `Catalogue` title + **Add filter** + **Search table** input
   + sort menu (same shape as the list page sort menu). Footer of
   the tab body shows the Figma "Tip" block: **"Select all relevant
   products that match your inventory, then easily create offers for
   them by simply adding your stock levels and prices."**
   Pagination: `1 — 10 of 100 results`, page size 10.

   - Validation: at least one variant must be selected before
     **Continue** activates. **Continue** is disabled until then.
   - Selection state lives in form state under
     `selected_variant_ids: string[]` and persists across pagination
     (a `Map<variantId, VariantSnapshot>` keeps the row metadata that
     tab 2 renders so it doesn't need to refetch).

2. **Stock Levels & Prices** (Figma `40009131:208213`) — a sticky
   data grid with one row per selected variant. Rows are grouped by
   product (the product title renders as a non-editable separator
   row, matching the Figma `Swiftly Tech Cropped Sh...` / `SET -
   Sports dress` group headers).

   Columns per row (left-to-right, matching Figma):

   1. **Title** — read-only thumbnail/icon + variant title (e.g.
      `XS / Green`). Width auto.
   2. **SKU** — text input, free-form, max 64 chars. Per-row
      validation: required for any row whose Stock Location toggles
      include at least one enabled location **or** any Price column
      has a non-zero amount. Empty SKU is allowed when the entire
      row is left at defaults (lets the user skip rows they don't
      want to publish). The `(seller_id, sku)` uniqueness collision
      surfaces as a 409 toast on the failing row (the row stays in
      the grid so the user can fix it).
   3. **Stock Location N** — one column per stock location the active
      seller has. Renders a `Switch` with a `Not enabled` / `Enabled`
      label. The switch state maps onto an `inventory_items` entry
      for that variant (toggled on → include the location's
      inventory_item in the offer payload; off → omit). Until a
      location is enabled there is no stocked quantity input — the
      stocked quantity is set via the existing `/inventory` page,
      not in this wizard.
   4. **Price <currency>** — one column per active store currency.
      Numeric input with the currency's symbol prefix; defaults to
      `0.00`. Submitting a row with all-zero prices is allowed; the
      backend treats it as "publish without a price ladder until I
      come back to it" and the offer's detail page surfaces the
      empty-pricing state.

   Toolbar (Figma top-bar):

   - **View** button (Medusa UI table view menu) for toggling column
     visibility (already part of `DataGrid`).
   - **Shortcuts** button (right side) opens the keyboard shortcuts
     popover (`DataGrid`'s default).

   Footer: **Cancel** (left of the bottom-right cluster, behind
   `RouteFocusModal.Close`) + **Publish** (primary, right). On
   `Publish`, the wizard fans out one
   `POST /vendor/offers` request per row that has any non-default
   field (SKU, an enabled location toggle, or a non-zero price);
   rows left fully at defaults are skipped. Failures are surfaced
   per-row inline; the wizard does **not** close until every row
   either succeeds or is explicitly skipped. Successful rows are
   removed from the grid so retries focus only on the failures.

Tab metadata:

- Tab 1: `{ id: "catalogue", labelKey: "offers.create.tabs.catalogue", validationFields: ["selected_variant_ids"] }`.
- Tab 2: `{ id: "stockLevelsAndPrices", labelKey: "offers.create.tabs.stockLevelsAndPrices", validationFields: ["rows"] }`.

The Figma renders the first tab's progress dot in blue (in-progress)
and the second tab's in dashed-grey (not-started). That matches the
`ProgressTabs` semantics the `TabbedForm` primitive already uses; no
new variant is needed.

i18n key changes:

- Add `offers.create.tabs.catalogue` = **"Catalogue"**.
- Add `offers.create.tabs.stockLevelsAndPrices` =
  **"Stock Levels & Prices"**.
- Add `offers.create.tip` =
  **"Select all relevant products that match your inventory, then
  easily create offers for them by simply adding your stock levels
  and prices."**
- Add `offers.create.publish` = **"Publish"**.
- Add `offers.fields.stockLocation` = **"Stock Location {{name}}"**
  (column header template).
- Add `offers.fields.priceCurrency` = **"Price {{code}}"** (column
  header template).
- Drop the older tab keys (`offers.create.tabs.variant`,
  `offers.create.tabs.details`,
  `offers.create.tabs.pricingAndStock`) once tab 2 lands.

### Detail page — redesign

Layout: `TwoColumnPage<OfferDetail>` with `showJSON: false` and
`showMetadata: false` (the redesigned sidebar replaces both).

Page header (above the two columns): breadcrumb
`Offers › <product title>`; page title is the product title (e.g.
**"Swiftly Tech Cropped Short Sleeve 2.0 - Sports T-shirt"**) plus
the top-right action menu (`Edit` / `Delete`).

Main column (top to bottom):

1. **General** (`Container divide-y p-0`):
   - Header row: `<Heading>` "General" + action menu (Edit,
     Delete).
   - Body `SectionRow`s, matching Figma:
     - **Description** — product description (multi-line).
     - **Subtitle** — product subtitle.
     - **Handle** — product handle (e.g. `/tech-tshirt`).
     - **Discountable** — boolean, rendered as text (`True` /
       `False`).
2. **Media** (`Container divide-y p-0`):
   - Header row: `<Heading>` "Media" + ellipsis menu.
   - Body: horizontal scroller of variant / product thumbnails
     (same component the product detail page already uses).
3. **Variants** (`Container divide-y p-0`):
   - Header row: `<Heading>` "Variants" + ellipsis menu.
   - Toolbar row: **Add filter** + **Search** input + sort icon
     (same shape as the list page).
   - Table columns: **Title** (thumbnail + label), **SKU**,
     attribute-axis columns (one per axis — Figma shows **Size**
     and **Color**), **Inventory** (e.g. `50 available at 1
     location`, red text when the value is `0`). Inventory cell
     hosts a row action menu with **Go to inventory item**
     (navigates to `/inventory/${inventory_item_id}`).
   - Pagination footer: `1 — 6 results`, `1 of 1 pages`, Prev /
     Next.

Sidebar column (top to bottom):

1. **Organize** (`Container divide-y p-0`):
   - Header row: `<Heading level="h2">` "Organize" + ellipsis menu.
   - `SectionRow`s: **Tags**, **Type**, **Primary categories**
     (chip), **Secondary categories** (chips: `Sport T-Shirts`,
     `T-Shirts` in Figma), **Collection** (e.g. `Streetwear`).
2. **Attributes** (`Container divide-y p-0`):
   - Header row: `<Heading level="h2">` "Attributes" + tooltip /
     info icon.
   - Sub-block **Variations** ("Attributes used for variations") —
     one row per attribute axis with chips for each value (e.g.
     `Size`: `XS`, `S`, `M`, `L`; `Color`: `Green`, `Blue`).
   - Sub-block **Product Information** ("Attributes used for
     informational purposes") — one `SectionRow` per
     non-variant-axis attribute (e.g. `Brand: Adidas`,
     `Number: LLS41D03E-Q11`, `Sleeve length (cm): 20`,
     `Multipack: False`).

The previous **Pricing**, **Inventory items**, **Shipping profile**,
and **Status** sidebar sections are **dropped** from the default
detail view. Pricing and inventory remain reachable via the row
action menu (`Manage prices` → `pricing` drawer, `Manage inventory`
→ `inventory` drawer). The shipping profile is editable from the
edit drawer.

The `useOffer` loader field list grows to cover the new sections:
`product.thumbnail`, `product.subtitle`, `product.handle`,
`product.discountable`, `product.media`, `product.type.id`,
`product.type.value`, `product.tags`, `product.categories`,
`product.collection`, `product.variants`,
`product.variants.attribute_values`,
`product.variants.attribute_values.attribute`,
`product.variants.inventory_items` (variant-level "available at N
locations" string is derived client-side from existing
`inventory_item.location_levels`).

### Folder-layout adjustments (delta vs the older spec)

- `_components/use-offer-table-columns.tsx` replaces its column set
  per the redesign above (Offer / Category / Collection / Variants /
  Status / actions).
- `_components/offer-list-toolbar.tsx` (new) hosts the Add filter +
  Search + Sort cluster outside of `_DataTable`'s defaults so the
  layout matches the Figma.
- `create/create-offer-form/` adopts a two-tab shape:
  - `create-offer-catalogue.tsx` (was `create-offer-variant.tsx`).
  - `create-offer-stock-levels-and-prices.tsx` (was
    `create-offer-pricing-and-stock.tsx`). Hosts the
    grouped-by-product data grid (`DataGrid` primitive) with the
    SKU column, per-location switches, and per-currency prices.
  - `create-offer-details.tsx` is deleted; the SKU + shipping
    profile fields it owned migrate into the Stock Levels & Prices
    grid (SKU is per-row; shipping profile becomes a single
    wizard-level `Select` rendered above the grid).
- `[id]/_components/` is restructured:
  - `offer-general-section.tsx` is repurposed to render the four
    product-level rows (Description / Subtitle / Handle /
    Discountable).
  - `offer-media-section.tsx` (new) hosts the media scroller.
  - `offer-variants-section.tsx` (new) hosts the variants table
    with the per-row "Go to inventory item" action.
  - `offer-organize-section.tsx` (new) hosts the Organize sidebar
    block.
  - `offer-attributes-section.tsx` (new) hosts the Variations +
    Product Information sub-blocks.
  - `offer-pricing-section.tsx`, `offer-inventory-section.tsx`,
    `offer-shipping-section.tsx`, and `offer-status-sidebar.tsx`
    are dropped from the default detail render. The first two are
    still mounted by the `/offers/:id/pricing` and
    `/offers/:id/inventory` drawer routes.

## User-Visible Behavior

A logged-in vendor opens the vendor panel and sees a new sidebar entry
**Offers** nested under **Products**. Clicking it lands on
`/offers`, a list page with one row per offer the active store owns.
From there the vendor can search, filter, sort, paginate, bulk-select
rows, open a single offer's detail page, edit its identity / pricing /
inventory across three drawers, delete a single offer, or bulk-delete
a selection. Creating a new offer opens a **two-tab** full-screen
wizard (**Catalogue** → **Stock Levels & Prices**); on **Publish** the
wizard fans out one `POST /vendor/offers` per selected variant row.

The screen vocabulary mirrors the existing vendor pages
(`pages/inventory`, `pages/products`) so a store operator already
familiar with the dashboard recognizes every interaction.

### Sidebar entry

The `useCoreRoutes` array in
`packages/vendor/src/components/layout/main-layout/main-layout.tsx`
gains an `Offers` nested item under the `products.domain` route, as
the **first** entry in the `items` array (before Collections and
Categories):

```tsx
{
  icon: <Tag />,
  label: t("products.domain"),
  to: "/products",
  items: [
    { label: t("offers.domain"),      to: "/offers" },        // new
    { label: t("collections.domain"), to: "/collections" },
    { label: t("categories.domain"), to: "/categories" },
  ],
},
```

No new top-level icon is introduced. Rationale: an offer is the
store's listing on a master variant — conceptually a child of
Products, not a peer of Orders/Inventory/Customers.

### List page (`/offers`)

> **Superseded** by **Redesign — 2026-05-21 (Figma) → List page —
> redesign**. The bullets below describe the now-obsolete first cut
> and are kept only for change history. Where the two conflict, the
> redesign block at the top of this file wins.

- Layout: `SingleColumnPage` + a single `Container className="divide-y p-0"`.
- Header row: `<Heading>` "Offers" left, subtitle "Manage your
  catalog listings", and a primary `Button` "Create offer"
  (`variant="secondary"`, `size="small"`, `asChild` wrapping a `Link to="create"`).
- Search bar, ordering, and pagination are wired through the existing
  `_DataTable` primitive used by the inventory list (page size **20**,
  `keepPreviousData`).
- Row click navigates to the detail page (`navigateTo={(row) => row.id}`).
- Per-row `ActionMenu` actions (rightmost column):
  - **Edit** → `to="${id}/edit"` (`PencilSquare`)
  - **Manage prices** → `to="${id}/pricing"` (`CurrencyDollar`)
  - **Manage inventory** → `to="${id}/inventory"` (`Buildings`)
  - **Delete** → `onClick` opens confirmation prompt (`Trash`, last group)

- Bulk selection: `enableRowSelection: true` on `useDataTable`,
  controlled by local `RowSelectionState`. Selection persists across
  pagination. The first column is a checkbox cell + header that
  follows the standard `inventory-list-data-table` pattern.
- Bulk commands (rendered in the table's command bar when at least
  one row is selected, via the `_DataTable` `commands` prop):
  - **Delete selected** (`Trash`, shortcut `d`). Opens a `usePrompt`
    confirmation `{ title: t("general.areYouSure"), description: t("offers.bulkDelete.description", { count }), confirmText: t("actions.delete"), cancelText: t("actions.cancel"), variant: "danger" }`,
    then fans out a per-id soft-delete via `useBulkDeleteOffers`.
    Selection is cleared on success.
- Empty states (via `_DataTable`'s built-in empty rendering, mirroring
  `NoRecords` / `NoResults`):
  - No offers yet: heading **"No offers yet"**, description
    **"Create offers to start selling on the marketplace"**, primary
    CTA **"Create"** (was "Create your first offer" / "Bind your
    seller catalog to a master variant to make it purchasable." /
    "Create offer" in the first cut — replaced 2026-05-21 to use
    "Store"-aware language and match Figma `40009201:285783`).
  - Filtered to empty: heading "No matching offers", description
    "Adjust filters or search terms.".

### Columns

> **Superseded** by the redesign block's **Columns — redesign**
> table. The columns table below describes the now-obsolete first
> cut.

| Header           | Accessor / Source                                                                        | Cell                                                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| (selection)      | `display: "select"`                                                                      | Checkbox (header + row), stops propagation                                                                                                             |
| Variant          | `variant.thumbnail` (24×24 `Thumbnail`) + `variant.product.title` / `variant.title`      | Truncated `<Text size="small" weight="plus" leading="compact">` + product subtitle below                                                               |
| SKU              | `sku`                                                                                    | Truncated monospaced text; falls back to `PlaceholderCell`                                                                                             |
| Price            | Cheapest visible `price_set.prices[*]` rendered as `formatAmount(amount, currency_code)` | If a `PriceList` row covers the current context, render the discounted amount + a strikethrough on the original. If no rows resolve, `PlaceholderCell` |
| Stock            | Effective stocked quantity computed across `inventory_items[].inventory.location_levels` | `StatusBadge` `in_stock` (green) / `low_stock` (orange) / `out_of_stock` (red), followed by numeric available                                          |
| Shipping profile | `shipping_profile.name`                                                                  | Text + `<Text size="xsmall" className="text-ui-fg-subtle">` profile type underneath                                                                    |
| Updated          | `updated_at`                                                                             | Relative date cell from the existing helper                                                                                                            |
| (actions)        | `display: "actions"`                                                                     | Row `ActionMenu` per the list above                                                                                                                    |

Stock computation matches the Store API rule from SPEC-002:
`effective = MIN(floor((stocked - reserved) / required_quantity))`
across the offer's linked items in the active seller's locations.
The computation lives in `pages/offers/common/utils.ts` so the
detail page reuses it.

### Filters

`useOfferTableFilters` returns:

- **Variant** — multi-select async combobox backed by
  `sdk.vendor.products.query` (filters offers by `variant_id` in any
  of the selected products' variant ids; the route currently filters
  on `variant_id` directly so the helper expands to variant ids
  client-side).
- **Shipping profile** — multi-select from
  `sdk.vendor.shippingProfiles.query`.
- **Stock status** — fixed enum: `in_stock`, `low_stock`,
  `out_of_stock`. Applied client-side until the route exposes a
  dedicated filter (acceptable until SPEC-002 §Vendor offers list
  query params adds one).
- **Updated at** / **Created at** — date range (uses the same helper
  the product variant section uses).

Ordering supports `sku`, `created_at`, `updated_at`. Default sort is
`updated_at DESC`.

### Detail page (`/offers/:id`)

> **Superseded** by the redesign block's **Detail page — redesign**.
> The text below documents the now-obsolete first cut (sidebar
> status/shipping sections, JSON viewer + Metadata wired through
> `TwoColumnPage`'s defaults). Use the redesign block for the
> implementation contract.

Layout: `TwoColumnPage<HttpTypes.VendorOfferResponse["offer"]>` with
`showJSON`, `showMetadata`, and an `<Outlet />` for stacked
drawers/modals.

Main column (top to bottom, each in `<Container className="divide-y p-0">`):

1. **General** — header row `<Heading>` "General" + action menu
   (Edit, Delete). Body rows:
   - SKU
   - Master variant — links to the product detail page
     (`/products/${variant.product_id}` with the variant id appended
     as an anchor).
   - EAN / UPC — snapshot from variant at create time. Read-only;
     rerunning create against the same variant updates these.
   - Created at / Updated at.

2. **Pricing** — header row `<Heading>` "Pricing" + actions:
   "Manage prices" → `pricing` (opens drawer). Body is an embedded
   table (`createColumnHelper` over `price_set.prices`):
   - Amount + currency (formatted)
   - Region (`PriceRule { region_id }`, "—" if none)
   - Customer group (`PriceRule { customer_group_id }`, "—" if none)
   - Min qty / Max qty (`min_quantity` / `max_quantity` columns)
   - Price list (badge if the row belongs to a `PriceList`, "Base" otherwise)

   Empty state: "No prices configured", inline button "Add prices"
   that navigates to the same `pricing` drawer.

3. **Inventory items** — header row `<Heading>` "Inventory items" +
   actions: "Manage items" → `inventory` (opens drawer). Body:
   one row per `inventory_items[]` link entry:
   - Inventory item title + SKU (link to `/inventory/${id}`)
   - `required_quantity` chip
   - Stocked / Reserved per location (collapsible if > 2 locations)

   Empty state: "No inventory items attached" + inline "Attach items"
   button. Per SPEC-002 §F2 the create payload must carry ≥1 item, so
   this state is reachable only after a batch-delete edit.

Sidebar column:

- **Status** (`<Container divide-y p-0>`): effective stock badge,
  effective available quantity, soft-delete state if applicable.
- **Shipping profile**: profile name + link to settings, profile type.
- **Default `MetadataSection`** and **`JsonViewSection`** as wired
  by `TwoColumnPage`.

Loader: `loader.ts` calls `sdk.vendor.offers.$id.query({ $id, fields })`
with the field list:

```
*price_set,*price_set.prices,*price_set.prices.price_rules,
*shipping_profile,*variant,*variant.product,
*inventory_items,*inventory_items.inventory,
*inventory_items.inventory.location_levels
```

Errors `throw` so the route-level `ErrorBoundary` renders the fallback.

### Create flow (`/offers/create`)

> **Superseded** by the redesign block's **Create flow — redesign
> (two tabs)**. The text below documents the now-obsolete first cut
> (three tabs: Variant → Details → Pricing & stock). The redesign
> collapses this into **Catalogue** (multi-select variants) +
> **Stock Levels & Prices** (one row per selected variant).

Host: `RouteFocusModal` (closes back to `/offers`). Inside:
`TabbedForm` with **three** tabs, each carrying `_tabMeta` via
`defineTabMeta<CreateOfferFormValues>`. Schema mirrors
`HttpTypes.VendorCreateOfferReq` (one-to-one with the zod schema in
`packages/core/src/api/vendor/offers/validators.ts`).

Pricing and stock live on **one** tab — `Pricing & stock` — to match
the precedent set by the product create wizard, where each variant's
prices and `manage_inventory` / `inventory_kit` toggles share a
single DataGrid row in the Variants tab
(`packages/vendor/src/pages/products/create/components/product-create-variants-form/product-create-variants-form.tsx`).
An offer is the single-listing analogue of one of those variant
rows: there is no fan-out across variants, so splitting prices and
items into two tabs would impose more navigation than the product
flow does. The two repeaters sit one above the other on the same
tab so a vendor can see the price ladder and the inventory items
they apply to without flipping tabs.

Tab order and `validationFields`:

1. **Variant** — `{ id: "variant", labelKey: "offers.create.tabs.variant", validationFields: ["variant_id"] }`
   - Single `Combobox` over `sdk.vendor.products.query` →
     variant picker (label = product title, sublabel = variant title +
     EAN/UPC). On select, stores `variant_id` and surfaces a read-only
     panel showing the variant's snapshot fields (EAN, UPC, options).
   - Hint: "You can only create an offer on an existing variant. Use
     Products to add a new variant first." (Matches SPEC-002 §F1.)

2. **Details** — `{ id: "details", labelKey: "offers.create.tabs.details", validationFields: ["sku", "shipping_profile_id"] }`
   - `sku` (`Input`, required, free-form, max 64 chars; the
     `(seller_id, sku)` uniqueness collision surfaces as a 409 toast
     from the route layer).
   - `shipping_profile_id` (`Select` over
     `sdk.vendor.shippingProfiles.query`, required).
   - `metadata` (`MetadataForm` composite, optional).

3. **Pricing & stock** — `{ id: "pricingAndStock", labelKey: "offers.create.tabs.pricingAndStock", validationFields: ["prices", "inventory_items"] }`
   - Body is vertically split with a `Divider` between the two
     repeaters; each carries its own sub-heading
     (`<Heading level="h3">`).
   - **Prices** sub-section — repeater of `Price` rows. First row
     required. Each row:
     - amount (numeric input, currency-aware formatting)
     - currency_code (`Select` of active store currencies)
     - region_id (optional, `Select` of regions)
     - customer_group_id (optional, async `Combobox`)
     - min_quantity / max_quantity (numeric, optional)

     "Add price" button appends a row; per-row delete icon.
     Validation: ≥1 row, no two rows share the same
     `(currency_code, region_id, customer_group_id, min_quantity,
     max_quantity)` tuple.
   - **Inventory items** sub-section — repeater of
     `{ inventory_item_id, required_quantity }`. ≥1 row required.
     `inventory_item_id` is an async `Combobox` over
     `sdk.vendor.inventoryItems.query`; each option shows title +
     SKU + total stocked. Below the combobox, an inline
     `Button variant="transparent"` **Create new inventory item**
     opens the existing inventory create drawer as a `StackedDrawer`;
     on success the drawer closes and the new item is preselected in
     the active row. `required_quantity` is a numeric input,
     default `1`, min `1`. Client-side validation rejects duplicate
     `inventory_item_id`s in the array, matching the server-side
     400 from SPEC-002.

Footer (default `TabbedForm` footer):

- Tab 1–2: Cancel + Continue.
- Tab 3: Cancel + Save (`isLoading={createMutation.isPending}`).

Submit: `useCreateOffer().mutateAsync(transformNullableFormData(values))`.
On success: `handleSuccess("/offers/" + offer.id)` and
`toast.success(t("offers.create.successToast"))`.

### Edit flows

Three independent `RouteDrawer`s, each owning one mutation. This
mirrors SPEC-002's API surface (`POST /vendor/offers/:id` for the
row, the same endpoint with `prices` array for the ladder, and
`POST /vendor/offers/:id/inventory-items/batch` for the link
mutations). Splitting them client-side keeps each form small and
avoids reimplementing batch / replace semantics on the UI side.

**`/offers/:id/edit` — identity drawer**

- Loader fetches the offer with the same field list as the detail
  page so the drawer renders against fresh data.
- Form fields: `sku`, `shipping_profile_id`, `metadata`. **No
  `prices` field is set in the submitted payload** so the price
  ladder is left untouched (SPEC-002 §Endpoint Contracts table:
  "Omitting `prices` leaves the price ladder untouched").
- Submit calls `useUpdateOffer(offer.id)` → `sdk.vendor.offers.$id.mutate({ $id, sku, shipping_profile_id, metadata })`.
- Footer: Cancel + Save.

**`/offers/:id/pricing` — prices ladder drawer**

- Reuses the row repeater from the create flow's Pricing tab.
- The repeater is **seeded** with the offer's current
  `price_set.prices`, each row carrying its `id`.
- Submit constructs the `prices` array per SPEC-002's replace
  semantics: entries with `id` update in place, entries without `id`
  insert, and any current row removed in the UI is omitted from the
  submitted array (the server then removes it).
- Mutation: `useUpdateOffer(offer.id).mutateAsync({ prices })`.
- Footer: Cancel + Save.

**`/offers/:id/inventory` — batch drawer**

- Form state is `{ create: [], update: [], delete: [] }` shaped to
  `HttpTypes.VendorBatchOfferInventoryItemsReq`.
- UI layout: a single list of the offer's existing
  `inventory_items[]` rendered as editable rows
  (`required_quantity` input + remove icon). A "+ Add item" button
  at the bottom inserts a new row that resolves to the `create`
  bucket on submit. Edits to existing rows resolve to `update`;
  remove icons resolve to `delete` (recorded by `inventory_item_id`).
- Client-side dedupe: a single `inventory_item_id` may only appear
  in one bucket; submit is disabled if not.
- Mutation: `useBatchOfferInventoryItems(offer.id).mutateAsync(payload)`.
  On success, invalidates the detail key and the lists key.
- Footer: Cancel + Apply.

### Delete flows

- **Single delete** via `pages/offers/common/hooks/use-delete-offer-action.tsx`.
  Calls `usePrompt` with copy
  `{ title: t("general.areYouSure"), description: t("offers.delete.description", { sku }), confirmText: t("actions.delete"), cancelText: t("actions.cancel"), variant: "danger" }`,
  then `useDeleteOffer(id).mutateAsync()`. Surfaces in both the row
  `ActionMenu` and the detail page header `ActionMenu`. On success
  from the detail page, navigates to `/offers` and toasts.
- **Bulk delete** via `useBulkDeleteOffers` (per-id fan-out). See
  **Notes > Bulk delete semantics**.

## Data layer

### Hooks file

`packages/vendor/src/hooks/api/offers.tsx` (new). Mirrors the
shape of `hooks/api/inventory.tsx`:

```ts
import {
  queryClient,
  sdk,
  useMutation,
  useQuery,
  type ClientError,
  type InferClientInput,
  type InferClientOutput,
} from "@mercurjs/client";
import { queryKeysFactory } from "@mercurjs/dashboard-shared";

export const offerQueryKeys = queryKeysFactory("offer");

export const useOffers = (query, options) =>
  useQuery({
    queryKey: offerQueryKeys.list(query ?? {}),
    queryFn: () => sdk.vendor.offers.query(query ?? {}),
    ...options,
  });

export const useOffer = (id, query, options) =>
  useQuery({
    queryKey: offerQueryKeys.detail(id, query),
    queryFn: () => sdk.vendor.offers.$id.query({ $id: id, ...(query ?? {}) }),
    enabled: !!id,
    ...options,
  });

export const useCreateOffer = (options) =>
  useMutation({
    mutationFn: (payload) => sdk.vendor.offers.mutate(payload),
    onSuccess: (data, vars, ctx) => {
      queryClient.invalidateQueries({ queryKey: offerQueryKeys.lists() });
      options?.onSuccess?.(data, vars, ctx);
    },
    ...options,
  });

export const useUpdateOffer = (id, options) =>
  useMutation({
    mutationFn: (payload) =>
      sdk.vendor.offers.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, vars, ctx) => {
      queryClient.invalidateQueries({ queryKey: offerQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: offerQueryKeys.detail(id) });
      options?.onSuccess?.(data, vars, ctx);
    },
    ...options,
  });

export const useBatchOfferInventoryItems = (id, options) =>
  useMutation({
    mutationFn: (payload) =>
      // sdk.vendor.offers.$id.inventoryItems.batch.mutate(...) — exact
      // path mirrors the codegen route name once SPEC-002 §Endpoint
      // Contracts ships the SDK regen. Until then, fall back to
      // fetchQuery against POST /vendor/offers/:id/inventory-items/batch.
      sdk.vendor.offers.$id.inventoryItems.batch.mutate({
        $id: id,
        ...payload,
      }),
    onSuccess: (data, vars, ctx) => {
      queryClient.invalidateQueries({ queryKey: offerQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: offerQueryKeys.lists() });
      options?.onSuccess?.(data, vars, ctx);
    },
    ...options,
  });

export const useDeleteOffer = (id, options) =>
  useMutation({
    mutationFn: () => sdk.vendor.offers.$id.delete({ $id: id }),
    onSuccess: (data, vars, ctx) => {
      queryClient.invalidateQueries({ queryKey: offerQueryKeys.lists() });
      queryClient.removeQueries({ queryKey: offerQueryKeys.detail(id) });
      options?.onSuccess?.(data, vars, ctx);
    },
    ...options,
  });

export const useBulkDeleteOffers = (options) =>
  useMutation({
    mutationFn: async (ids) => {
      const results = await Promise.allSettled(
        ids.map((id) => sdk.vendor.offers.$id.delete({ $id: id })),
      );
      const succeeded = results
        .map((r, i) => (r.status === "fulfilled" ? ids[i] : null))
        .filter((x): x is string => x !== null);
      const failed = results
        .map((r, i) =>
          r.status === "rejected"
            ? { id: ids[i], error: r.reason as ClientError }
            : null,
        )
        .filter((x): x is { id: string; error: ClientError } => x !== null);
      return { succeeded, failed };
    },
    onSuccess: ({ succeeded }, _ids, ctx) => {
      queryClient.invalidateQueries({ queryKey: offerQueryKeys.lists() });
      succeeded.forEach((id) =>
        queryClient.removeQueries({ queryKey: offerQueryKeys.detail(id) }),
      );
      options?.onSuccess?.({ succeeded, failed: [] }, _ids, ctx);
    },
    ...options,
  });
```

`InferClientInput` / `InferClientOutput` against the codegen'd route
map keep these hooks typed without re-declaring the request /
response shapes (see SPEC-002 §Types Contract — they live under
`HttpTypes.VendorOffer*`).

### SDK namespace

All calls go through `sdk.vendor.*` per the established admin/vendor
split. No `fetch` calls anywhere in the page tree.

## Folder layout

```
packages/vendor/src/pages/offers/
  index.ts                                 barrel
  offer-list-page.tsx                      compound root, SingleColumnPage
  _components/
    index.ts
    offer-list-table.tsx                   Container shell
    offer-list-header.tsx                  title + "Create offer" CTA
    offer-list-data-table.tsx              _DataTable wiring + bulk commands
    offer-actions.tsx                      row ActionMenu
    use-offer-table-columns.tsx
    use-offer-table-filters.tsx
    use-offer-table-query.tsx
  common/
    constants.ts                           PAGE_SIZE = 20, OFFER_IDS_KEY
    utils.ts                               computeEffectiveStock(offer), getStockStatusProps(offer)
    hooks/
      use-delete-offer-action.tsx
  [id]/
    index.ts
    offer-detail-page.tsx                  compound root, TwoColumnPage
    breadcrumb.tsx
    loader.ts
    _components/
      index.ts
      offer-general-section.tsx
      offer-pricing-section.tsx
      offer-inventory-section.tsx
      offer-shipping-section.tsx
      offer-status-sidebar.tsx
    edit/
      offer-edit-page.tsx                  RouteDrawer, identity form
      edit-offer-form/
        edit-offer-form.tsx
        schema.ts
    pricing/
      offer-pricing-edit-page.tsx          RouteDrawer, prices ladder
      pricing-form/
        pricing-form.tsx                   shared with create's Pricing & stock tab
        schema.ts
    inventory/
      offer-inventory-batch-page.tsx       RouteDrawer, batch form
      inventory-batch-form/
        inventory-batch-form.tsx
        schema.ts
  create/
    offer-create-page.tsx                  RouteFocusModal
    create-offer-form/
      create-offer-form.tsx                TabbedForm host
      create-offer-variant.tsx             tab 1
      create-offer-details.tsx             tab 2
      create-offer-pricing-and-stock.tsx   tab 3 (hosts prices + inventory_items repeaters)
      schema.ts                            Zod, mirrors VendorCreateOffer
```

## Variant-scoped UI to remove

This section is the deletion contract that pairs with the additions
above. Every entry is a current vendor-panel concern that SPEC-002
moves onto the offer and that this spec therefore deletes from the
variant-scoped surface. Each deletion has a one-line **Replaced by:**
pointer to the offer surface that owns the same concern.

The new domain shape is:

```
product → variant → offers → prices & inventory_items
                              ↑
                              owned by this spec / SPEC-002
```

The old shape (variant → prices + inventory_items + manage_inventory)
is structurally absent in the schema after SPEC-002's migrations.
Any UI that reads or writes those fields is dead code at best and
misleading the vendor at worst (form fields that submit values the
backend silently drops).

### Routes to delete from `packages/vendor/src/get-route-map.tsx`

| Path | Module under `packages/vendor/src/pages/` | Replaced by |
| --- | --- | --- |
| `/products/:id/prices` | `products/[id]/prices/` | `/offers/:id/pricing` (this spec) |
| `/products/:id/stock` | `products/[id]/stock/` | `/offers/:id/inventory` (this spec) |
| `/products/:id/edit-stocks-and-prices` | `products/[id]/edit-stocks-and-prices/` | `/offers/:id/pricing` + `/offers/:id/inventory` (this spec). The combined "edit stocks and prices across all variants" wizard has no offer-side equivalent because per-offer pricing / inventory is owned per row in `/offers/:id/pricing` / `/offers/:id/inventory`. |
| `/products/:product_id/variants/:variant_id/prices` | reuses `products/[id]/prices/` | `/offers/:id/pricing` (this spec). Per-variant prices no longer exist; per-offer prices replace them. |

Removing the modules above implies removing the matching `lazy` imports
in `packages/vendor/src/get-route-map.tsx` at the lines flagged in the
companion grep (`products/[id]/prices`, `products/[id]/stock`,
`products/[id]/edit-stocks-and-prices`, and the second
`products/[id]/prices` import nested under the standalone
`/products/:product_id/variants/:variant_id` route subtree). Leave the
`/products/:product_id/variants/:variant_id` parent and its
`edit-variant` child in place — the variant detail / edit drawers
themselves survive, only their prices / inventory subcomponents go
(see **Detail and edit-form fields** below).

### Pages and components to delete

The following directories under `packages/vendor/src/pages/` are
removed in their entirety:

- `products/[id]/prices/` (`index.tsx`, `pricing-edit.tsx`).
- `products/[id]/stock/` (`index.tsx`, `product-stock-form/`,
  `schema.ts`, `use-product-stock-columns.tsx`, `utils.ts`).
- `products/[id]/edit-stocks-and-prices/` (the route module +
  `components/stocks-and-prices-edit.tsx` +
  `components/stocks-and-prices-edit-form.tsx` + `schema.ts`).
- `products/common/variant-pricing-form.tsx` (variant-scoped
  pricing repeater used only by the two edit modals above).
- `products/create/components/product-create-inventory-kit-form/`
  (the entire **Inventory** tab in the product create wizard — see
  the per-tab list below for the exact knobs it carried).
- `product-variants/product-variant-detail/components/variant-prices-section/`
  (the right-sidebar "Prices" section on variant detail).
- `product-variants/product-variant-detail/components/variant-inventory-section/`
  (the main-column "Inventory items" section on variant detail, plus
  its `inventory-actions.tsx` row menu and
  `use-inventory-table-columns.tsx`).
- `product-variants/product-variant-manage-inventory-items/` (the
  full-screen modal that edits the
  `product_variant_inventory_item` link — the link table is empty
  for marketplace variants under SPEC-002 and the surface has no
  replacement on the variant; per-offer attach/detach lives in the
  `/offers/:id/inventory` drawer instead).

### Row actions and bulk commands to delete

On `pages/products/[id]/_components/product-variant-section/product-variant-section.tsx`:

- Drop the row **"Edit prices"** action (`to: "prices"`,
  `icon: <PencilSquare />`). Replacement: navigate to the offer's
  pricing drawer from `/offers/<id>/pricing`. The variant row
  ActionMenu no longer carries any pricing action.
- Drop the row **"Manage stock"** action (`to: "stock"`,
  `icon: <Buildings />`). Replacement: same as above, via
  `/offers/<id>/inventory`.
- Drop the bulk command **`useCommands` → `inventory.stock.action`**
  (`shortcut: "i"`, navigates to `stock?${PRODUCT_VARIANT_IDS_KEY}=...`).
  There is no per-variant bulk-stock concept any more; if a vendor
  wants to bulk-edit stock across a set of offers, that is a
  candidate follow-up spec, not a variant-scoped command.

After the deletions the variants table row ActionMenu keeps only
**Edit variant** (drawer) and **Delete variant** (prompt). The
inventory-related secondary actions that the section currently
threads through `mainActions.push(...)` for the `inventoryItemsCount ===
1` and `inventoryItemsCount > 1` (`"Inventory items"` /
`"Inventory kit"`) cases are also removed — `variant.inventory_items`
is `[]` on every marketplace variant under SPEC-002, so the branches
are dead code.

### Detail and edit-form fields to delete

`pages/product-variants/product-variant-detail/product-variant-detail.tsx`:

- Drop the `VariantPricesSection` import and the sidebar slot that
  renders it.
- Drop the `VariantInventorySectionConnected` import and the
  main-column slot that renders it.
- The variant detail page becomes a single-section page hosting the
  general section only (title, options, attribute axes, EAN/UPC,
  timestamps). Until SPEC-005 / a follow-up adds an "Offers on this
  variant" panel for the vendor, the `TwoColumnPage.Sidebar` slot is
  empty (acceptable — the layout already renders the metadata + JSON
  viewer there).

`pages/product-variants/product-variant-edit/components/product-edit-variant-form/product-edit-variant-form.tsx`:

- Drop the `manage_inventory` and `allow_backorder` fields from the
  zod schema, the form defaults, and the `useForm` payload.
- Drop the two `Form.Field` blocks that render them (lines around
  the `name="manage_inventory"` and `name="allow_backorder"`
  controls).
- The edit drawer keeps the remaining identity fields (title, SKU,
  options, attribute axes, EAN / UPC, weight / dimensions, custom
  metadata).

`pages/products/[id]/variants/create/create-product-variant-form/`:

- Delete `inventory-kit-tab.tsx` and `pricing-tab.tsx` outright.
- In `create-product-variant-form.tsx`:
  - Drop the `manage_inventory`, `allow_backorder`, `inventory_kit`
    defaults from `CREATE_VARIANT_DEFAULTS`.
  - Drop the `useFieldArray({ name: "inventory" })` block and the
    `useEffect` that seeds the first row.
  - Drop the `isManageInventoryEnabled` / `isInventoryKitEnabled`
    `useWatch`es and the `transformTabs` `isVisible` override.
  - Reduce `defaultTabs` to just `<DetailsTab />`.
- In `constants.ts`, drop the `manage_inventory`, `allow_backorder`,
  `inventory_kit`, `prices`, and `inventory` keys from
  `CreateProductVariantSchema`.

### Product-create wizard knobs to delete

`pages/products/create/components/product-create-variants-form/product-create-variants-form.tsx`:

- Drop the `manage_inventory`, `allow_backorder`, and `inventory_kit`
  columns from the variants DataGrid (`columnHelper.column({ id:
  "manage_inventory", ... })`, `{ id: "allow_backorder", ... }`,
  `{ id: "inventory_kit", ... }`).
- Drop the `createDataGridPriceColumns(...)` spread that adds the
  per-currency / per-region price columns at the end of the column
  set. The variants tab keeps only Attributes, Title, and SKU.

`pages/products/create/components/product-create-form/product-create-form.tsx`:

- Drop the `ProductCreateInventoryKitForm` import and its entry in
  `defaultTabs`.
- Drop the `transformTabs` branch that toggles the `inventory` tab
  on/off based on `watchedVariants.some(v => v.manage_inventory && v.inventory_kit)`.
- The product-create wizard's tab set reduces to: Details →
  Organize → Attributes → Variants.

`pages/products/create/constants.ts` / `pages/products/create/types.ts`:

- Drop the `inventory_kit`, `manage_inventory`, `allow_backorder`,
  and per-variant `prices` keys from the wizard schema and the
  type alias. The shape narrows to the variant-identity fields the
  product / variant routes still consume.
- Drop `generateVariantsFromAttributes`'s handling of those keys if
  the helper seeds them.

`pages/products/create/utils.ts`:

- Drop the `normalizeProductFormValues` branches that compute price
  payloads for each variant and that flip `manage_inventory: true`
  when the inventory kit is seeded. The vendor `POST /vendor/products`
  payload no longer carries those fields.

### i18n keys to remove from `packages/vendor/src/i18n/translations/en.json`

These keys (and their sister-locale equivalents) are dropped as part
of the per-locale sweep. List is exhaustive for the deletions above
but may grow if a sibling page references an unlisted key:

- `products.editPrices`
- `inventory.stock.action` (vendor-side only; SPEC-002's offer
  surface re-introduces the concept under `offers.actions.manage_inventory`)
- `products.stock.*` (heading, description, columns)
- `products.variant.pricesPagination`
- `products.variant.inventory.*` (`manageItems`, `manageKit`,
  `notManagedDesc`, `actions.inventoryItems`, `actions.inventoryKit`)
- `products.create.tabs.inventory` (the product-create inventory
  kit tab label)
- `priceLists.create.tabs.prices` is **not** dropped because the
  Price Lists wizard at `pages/price-lists` still consumes it; the
  variant-create wizard's `PricingTab` previously aliased the same
  key but that surface is what's being deleted.

### What stays

These variant-scoped surfaces survive because their concern is
identity / catalog, not commerce:

- The standalone variant create flow at
  `/products/:product_id/variants/create` keeps the **Details**
  tab so a vendor can still create a master variant (F1 in
  SPEC-002). Master variant creation is the *only* way to seed a
  new SKU into the catalog that an offer can then bind to.
- The variant edit drawer at
  `/products/:product_id/variants/:variant_id/edit` keeps title,
  options, attribute axes, SKU (master-catalog identifier per
  SPEC-002), EAN/UPC, weight / dimensions, and custom metadata.
- The product variant section on product detail keeps its variant
  list with **Edit variant** + **Delete variant** row actions and
  the standard date / option / attribute columns.
- The `/inventory` page tree stays in full. Per SPEC-002 inventory
  items are seller-owned, first-class entities; the offer surface
  *binds* offers to existing inventory items via the
  `offer ↔ inventory_item` link but does not replace inventory-item
  CRUD. The "Create new inventory item" inline action from the
  offer create wizard's Inventory items sub-section opens that same
  inventory-create flow as a `StackedDrawer`.

### Why the deletions land in this spec rather than SPEC-002

SPEC-002 owns the schema migration, the cart-pricing rewrite, and
the workflows. It does not own the vendor panel. Splitting the UI
deletions into SPEC-003 keeps SPEC-002's diff scoped to backend
code and keeps the UI churn (route map, page deletions, i18n keys)
inside one reviewable spec. Both halves ship together: shipping
SPEC-002 without SPEC-003 leaves the vendor panel showing
prices / inventory fields that the backend silently drops, which
is worse than either half alone.

## Route map registration

`packages/vendor/src/get-route-map.tsx` adds the page tree under the
`main` bucket (handled by `<ProtectedRoute><MainLayout>`):

```tsx
{
  path: "/offers",
  lazy: () => import("./pages/offers").then((m) => ({ Component: m.OfferListPage })),
  children: [
    {
      path: "create",
      lazy: () => import("./pages/offers/create/offer-create-page"),
    },
    {
      path: ":id",
      lazy: () => import("./pages/offers/[id]"),
      handle: { breadcrumb: BreadcrumbFromLoader },
      loader: (...args) =>
        import("./pages/offers/[id]/loader").then((m) => m.loader(...args)),
      children: [
        {
          path: "edit",
          lazy: () => import("./pages/offers/[id]/edit/offer-edit-page"),
        },
        {
          path: "pricing",
          lazy: () =>
            import("./pages/offers/[id]/pricing/offer-pricing-edit-page"),
        },
        {
          path: "inventory",
          lazy: () =>
            import("./pages/offers/[id]/inventory/offer-inventory-batch-page"),
        },
      ],
    },
  ],
},
```

## Compound exports

Both the list and detail pages export a `Root` plus parts (per the
UI-ARCHITECTURE compound override pattern). A downstream block can
re-render either with custom children:

```ts
export const OfferListPage = Object.assign(Root, {
  Table: OfferListTable,
  Header: OfferListHeader,
  HeaderTitle: OfferListTitle,
  HeaderActions: OfferListActions,
  DataTable: OfferListDataTable,
});

export const OfferDetailPage = Object.assign(Root, {
  General: OfferGeneralSection,
  Pricing: OfferPricingSection,
  Inventory: OfferInventorySection,
  Shipping: OfferShippingSection,
  StatusSidebar: OfferStatusSidebar,
});
```

## i18n keys

Added to `packages/vendor/src/i18n/translations/en.json` first.
Sister files updated as part of the per-locale sweep. The shape below
reflects the **2026-05-21 Figma redesign**: empty-state copy reworded
to drop "seller" in favour of marketplace-neutral language, the
two-tab Catalogue + Stock Levels & Prices wizard, and the per-row
SKU / per-location switch / per-currency price field templates.

```
"offers": {
  "domain": "Offers",
  "subtitle": "Manage your catalog listings",
  "create": {
    "header": "Create offer",
    "successToast": "Offer created",
    "publish": "Publish",
    "tip": "Select all relevant products that match your inventory, then easily create offers for them by simply adding your stock levels and prices.",
    "tabs": {
      "catalogue": "Catalogue",
      "stockLevelsAndPrices": "Stock Levels & Prices"
    }
  },
  "edit": {
    "header": "Edit offer",
    "description": "Update the offer's identity, shipping profile, or metadata.",
    "successToast": "Offer updated"
  },
  "pricing": {
    "header": "Manage prices",
    "description": "Add, change, or remove prices on this offer's ladder.",
    "successToast": "Prices updated",
    "empty": "No prices configured"
  },
  "inventory": {
    "header": "Manage inventory items",
    "description": "Attach, detach, or change the required quantity per item.",
    "successToast": "Inventory items updated",
    "empty": "No inventory items attached"
  },
  "delete": {
    "description": "You are about to delete offer {{sku}}. This cannot be undone.",
    "successToast": "Offer deleted"
  },
  "bulkDelete": {
    "description": "You are about to delete {{count}} offer(s). This cannot be undone.",
    "successToast": "Deleted {{count}} offer(s)",
    "partialToast": "Deleted {{succeeded}} of {{total}} offer(s); {{failed}} failed"
  },
  "actions": {
    "create": "Create",
    "manage_prices": "Manage prices",
    "manage_inventory": "Manage inventory",
    "bulkDelete": "Delete selected"
  },
  "fields": {
    "sku": "SKU",
    "variant": "Master variant",
    "shippingProfile": "Shipping profile",
    "ean": "EAN",
    "upc": "UPC",
    "requiredQuantity": "Required quantity",
    "stockStatus": "Stock status",
    "stockLocation": "Stock Location {{name}}",
    "priceCurrency": "Price {{code}}",
    "notEnabled": "Not enabled",
    "enabled": "Enabled"
  },
  "stockStatus": {
    "in_stock": "In stock",
    "low_stock": "Low stock",
    "out_of_stock": "Out of stock"
  },
  "empty": {
    "heading": "No offers yet",
    "description": "Create offers to start selling on the marketplace"
  },
  "filtered": {
    "heading": "No matching offers",
    "description": "Adjust filters or search terms."
  }
}
```

Removed keys (compared with the previous version of this spec):

- `offers.create.tabs.variant`
- `offers.create.tabs.details`
- `offers.create.tabs.pricingAndStock`

Both `offers.empty.heading` and `offers.empty.description` change
text; `offers.actions.create` shortens from `"Create offer"` to
`"Create"`.

## Verification

1. `bun install && bun run build` succeeds with the new pages and
   hooks (`packages/vendor` compiles cleanly with `bun run lint`).
2. With a seeded marketplace (at least two sellers, each with one
   product variant), log into the vendor panel as seller A.
   1. Sidebar shows **Offers** nested under Products.
   2. `/offers` renders an empty state with heading **"No offers
      yet"**, description **"Create offers to start selling on the
      marketplace"**, and a primary **Create** CTA (no "offer" suffix
      on the button). The previous "Bind your seller catalog…" copy
      is gone.
3. Click **Create**. The **two-tab** wizard opens (Catalogue → Stock
   Levels & Prices, per Figma `40008331:90298` and
   `40009131:208213`):
   1. Tab 1 (**Catalogue**): the table renders one row per variant
      from `sdk.vendor.productVariants.query`, with **Add filter** /
      **Search table** / sort menu on top and the
      **"Tip: Select all relevant products…"** footer above the
      wizard footer. Selecting variant rows enables **Continue**;
      with zero rows selected **Continue** stays disabled.
   2. Tab 2 (**Stock Levels & Prices**): the grid lists every
      selected variant grouped by product. Each row exposes a SKU
      input, one toggle per stock location (`Not enabled` /
      `Enabled`), and one numeric input per active store currency
      (`Price USD`, `Price PLN`, `Price EUR`, …).
      - Enable one stock location toggle on a row that has no SKU →
        the wizard's `Publish` button surfaces a per-row SKU-required
        error.
      - Type a duplicate SKU into two rows belonging to the same
        store → the client-side validator highlights both rows; on
        `Publish` the server-side `(seller_id, sku)` uniqueness
        check surfaces a 409 toast and the duplicate row keeps the
        inline error.
      - Click **Publish**. The wizard fans out one
        `POST /vendor/offers` per row that has any non-default
        field, removes successful rows from the grid, and surfaces
        per-row failures for the rest.
   3. After every row succeeds, the toast
      `offers.create.successToast` fires and the wizard closes back
      to `/offers`.
4. On the list page:
   1. The list shows one row per published variant with columns
      **Offer** (thumbnail + title), **Category**, **Collection**,
      **Variants** (count), **Status** (`Published` badge).
   2. The sort menu reorders the table (Title / Created / Updated +
      Ascending / Descending).
   3. **Add filter** opens the filter popover (matches Figma).
   4. Pagination footer reads `1 — 10 of N results` /
      `1 of K pages` with `Prev` / `Next`.
5. Open one of the published offers; the detail page renders per
   Figma `40009131:257674`:
   1. Page header is the product title (e.g. **Swiftly Tech Cropped
      Short Sleeve 2.0 - Sports T-shirt**) plus a top-right action
      menu (Edit / Delete).
   2. Main column shows **General** (Description / Subtitle / Handle
      / Discountable), **Media** (variant + product thumbnails),
      **Variants** (table with Title / SKU / attribute axes /
      Inventory cell and a `Go to inventory item` action per row).
   3. Sidebar shows **Organize** (Tags / Type / Primary categories /
      Secondary categories / Collection) and **Attributes**
      (`Variations` chips per axis + `Product Information`
      key/value rows).
   4. Variants whose effective inventory across all locations is `0`
      render the inventory cell text in `text-ui-fg-error`.
6. Edit flows still reachable via the row / detail action menu:
   1. Click **Edit** → identity drawer opens, fields prefilled,
      change `sku`, save. Toast and detail rerender; price table
      untouched.
   2. Click **Manage prices** → drawer opens, prices prefilled. Add a
      new currency row, remove the original. Save. Detail re-renders
      with one row (replace semantics).
   3. Click **Manage inventory** → drawer opens. Change a
      `required_quantity`, attach a new item, remove an existing
      one. Save. Detail re-renders.
7. Return to `/offers`:
   1. Sort by `updated_at DESC` puts the most recently created
      offer first.
   2. Select two row checkboxes, click **Delete selected**, confirm
      in the prompt. Toast shows `offers.bulkDelete.successToast`
      with `count = 2`. Both rows vanish from the list and
      selection clears.
   3. Filter and search both narrow the list.
8. Cross-store isolation: log out, log in as a second store's
   account. `/offers` only shows the active store's offers;
   loading `/offers/<other-store-offer-id>` surfaces the
   `ErrorBoundary` because the route returns
   `MedusaError.Types.NOT_ALLOWED` (403).
9. **Deletion checks (paired with Variant-scoped UI to remove):**
   1. The vendor product detail page no longer renders an "Edit
      prices" or "Manage stock" row action in the variants table
      ActionMenu, and the bulk command bar no longer surfaces a
      stock shortcut.
   2. Navigating directly to `/products/<id>/prices`,
      `/products/<id>/stock`,
      `/products/<id>/edit-stocks-and-prices`, or
      `/products/<product_id>/variants/<variant_id>/prices`
      surfaces the route-level 404 (`<NoMatch />`) — the modules and
      their `lazy(...)` registrations are gone.
   3. The product create wizard's tabs are Details → Organize →
      Attributes → Variants (no Inventory tab is reachable, even
      after toggling fields that previously surfaced it; the
      `transformTabs` branch is removed and the
      `ProductCreateInventoryKitForm` import is gone).
   4. The variants DataGrid inside the product create wizard renders
      only Attributes / Title / SKU columns. Per-currency price
      columns and `manage_inventory` / `allow_backorder` /
      `inventory_kit` toggles are gone.
   5. The standalone variant create wizard
      (`/products/<id>/variants/create`) renders only the Details
      tab. Pricing and Inventory kit tabs are gone.
   6. The variant detail page renders only the General section in
      the main column. No Prices sidebar section, no Inventory items
      main-column section, no "Manage items" / "Manage kit" action
      menu.
   7. The variant edit drawer no longer shows `manage_inventory` or
      `allow_backorder` switches.
   8. `grep -R "products.editPrices\|products.stock\|products.variant.pricesPagination\|products.variant.inventory\|products.create.tabs.inventory" packages/vendor/src` returns no matches.
10. Integration test (Jest + Playwright if available, or a
    route-level harness): the test
    `integration-tests/http/offer/vendor/offer.spec.ts` already
    covers the API contracts referenced by every interaction in
    this spec. This spec's UI verification rides on top of that
    and does not need a parallel API test; if a Playwright suite
    is introduced for the vendor panel, add a smoke test that
    walks step 2 → step 5 above and asserts the rendered DOM via
    `data-testid` attributes named per the page-authoring
    checklist:
    - `offer-list-table`, `offer-list-create-button`,
      `offer-list-row-${id}`, `offer-list-action-menu-${id}`,
      `offer-list-bulk-delete`, `offer-list-sort-trigger`,
      `offer-list-add-filter`.
    - `offer-create-form`,
      `offer-create-tab-{catalogue,stockLevelsAndPrices}`,
      `offer-create-catalogue-search`,
      `offer-create-catalogue-row-${variantId}`,
      `offer-create-stock-row-${variantId}`,
      `offer-create-stock-row-${variantId}-sku-input`,
      `offer-create-stock-row-${variantId}-location-${locationId}-toggle`,
      `offer-create-stock-row-${variantId}-price-${currencyCode}-input`,
      `offer-create-publish`.
    - `offer-detail-{general,media,variants,organize,attributes}-section`,
      `offer-detail-variants-row-${variantId}-go-to-inventory`.
    - `offer-edit-form`, `offer-pricing-edit-form`,
      `offer-inventory-batch-form`.

## Evidence

### 2026-05-21 — Figma redesign accepted (no code change)

- The list, create wizard, and detail page sections were rewritten in
  this file to match the Figma designs cited in
  **Redesign — 2026-05-21 (Figma) → Source designs**.
- The Session-15 implementation captured below (3-tab Variant /
  Details / Pricing & stock wizard, Status sidebar on the detail
  page, etc.) **no longer matches** the contract above and must be
  reworked. See the next-actions list in `claude-progress.md` Session
  16 for the implementation plan.
- No production code was modified in this revision; only this spec
  file changed.

### 2026-05-21 — Initial implementation (vendor UI + variant-scoped deletions)

- **Implemented at:** 2026-05-21
- **Source (additions):**
  - `packages/vendor/src/pages/offers/` — list, detail, create wizard,
    three edit drawers (identity, pricing, batch inventory), common
    constants/types/utils/delete-action hook.
  - `packages/vendor/src/hooks/api/offers.tsx` — `useOffers`,
    `useOffer`, `useCreateOffer`, `useUpdateOffer`,
    `useBatchOfferInventoryItems`, `useDeleteOffer`,
    `useBulkDeleteOffers`.
  - `packages/vendor/src/get-route-map.tsx` — `/offers` route tree
    (`create`, `:id`, `:id/{edit,pricing,inventory}`) + breadcrumb
    + loader wiring.
  - `packages/vendor/src/components/layout/main-layout/main-layout.tsx`
    — **Offers** nested under **Products** as the first child item.
  - `packages/vendor/src/pages/index.ts` + `hooks/api/index.ts` —
    barrel exports.
- **Source (deletions, paired with SPEC-002 backend migrations):**
  - Whole directories: `pages/products/[id]/prices/`,
    `pages/products/[id]/stock/`,
    `pages/products/[id]/edit-stocks-and-prices/`,
    `pages/products/create/components/product-create-inventory-kit-form/`,
    `pages/product-variants/product-variant-detail/components/variant-prices-section/`,
    `pages/product-variants/product-variant-detail/components/variant-inventory-section/`,
    `pages/product-variants/product-variant-manage-inventory-items/`.
  - Single files: `pages/products/common/variant-pricing-form.tsx`,
    `pages/products/[id]/variants/create/create-product-variant-form/inventory-kit-tab.tsx`,
    `.../pricing-tab.tsx`.
  - Modifications: `product-variant-section.tsx` (row actions and
    bulk command stripped), `product-variant-detail.tsx` (sections
    removed), variant edit/create forms (manage_inventory /
    allow_backorder / inventory_kit / prices / inventory removed),
    `product-create-variants-form.tsx` (price + inventory columns
    dropped), `product-create-form.tsx` (inventory tab removed,
    `regionsCurrencyMap` no longer threaded), `product-create.tsx`
    (`InventoryTab` export dropped), `products/create/constants.ts`
    + `utils.ts` (schema and helper branches dropped), and the
    route-map entries for `prices`/`stock`/`edit-stocks-and-prices`/
    `variants/:variant_id/prices` removed.
- **Translations:**
  - `packages/vendor/src/i18n/translations/en.json` — new `offers.*`
    namespace; removed `products.editPrices`, `products.stock`,
    `products.variant.pricesPagination`, `products.variant.inventory.*`
    (manageItems, manageKit, notManagedDesc, actions.inventoryItems,
    actions.inventoryKit, header), `products.create.tabs.inventory`,
    `products.create.inventory`. 32 sister locale files have the
    legacy keys removed via a JSON sweep.
  - `packages/vendor/src/i18n/translations/$schema.json` regenerated
    from `en.json` so the validate-translations vitest stays green.
- **Build artifacts:**
  - `cd packages/vendor && bun run build` → ESM and DTS Build success.
  - `bunx vitest run packages/vendor/src/i18n/translations/__tests__/validate-translations.spec.ts`
    → 1/1 pass.
  - `bunx oxlint --quiet packages/vendor/src/pages/offers
    packages/vendor/src/hooks/api/offers.tsx` → 0 errors / 3 warnings
    (baseline `_tabMeta` underscore-dangle, same as other tabbed
    forms in the package).
  - `grep -R "products\.editPrices\|products\.stock\|
    products\.variant\.pricesPagination\|products\.variant\.inventory\|
    products\.create\.tabs\.inventory" packages/vendor/src` →
    no matches.
- **Outstanding:**
  - The vendor Vite dev server walkthrough (Verification §2–§7)
    has not been performed in this session; the SPA build is green
    but the UI flows still need a runtime smoke before status flips
    to `passing`.
  - `@mercurjs/admin` `bun run build` fails on a pre-existing
    `product-variant-detail.tsx` DTS error rooted in SPEC-002's
    backend removal of `prices`/`options` from `ProductVariant`.
    That regression is **not introduced by this session** (confirmed
    by stashing the SPEC-003 changes and re-running the admin build
    — same failure) and belongs to SPEC-004's admin UI scope.
  - A vendor-side Playwright suite mirroring the spec's
    `data-testid` contract is not yet authored.

## Notes

### Why this spec is separate from SPEC-002

SPEC-002 is canonical and very long. Folding a 12-page UI spec into
it would make both harder to read and harder to keep current. The
contract direction is one-way: the UI must conform to the endpoints
SPEC-002 declares, never the reverse. When the two collide, SPEC-002
wins and this file is updated.

### Bulk delete semantics

There is **no** `POST /vendor/offers/bulk-delete` endpoint in
SPEC-002. The admin surface has
`POST /admin/sellers/:id/offers/bulk-delete` returning `202 { job_id }`,
but the vendor surface does not. `useBulkDeleteOffers` therefore
fans out a per-id `DELETE` against `sdk.vendor.offers.$id.delete`
using `Promise.allSettled`, then surfaces a partial-failure toast
if any leg failed (`offers.bulkDelete.partialToast`). Failed ids
stay selected so the vendor can retry.

This is intentionally a UI-side workaround for a soft-delete
operation that's idempotent at the row level. If real bulk-delete
becomes a hot path for vendors, a follow-up spec can land
`POST /vendor/offers/bulk-delete` and this hook collapses to a
single mutation. Until then, do not add server endpoints to this
spec.

### Three drawers vs one mega-edit page

The edit surface is split across three drawers (identity, prices,
inventory) instead of one combined edit page because:

- The API surface itself is split: identity + price ladder ride
  `POST /vendor/offers/:id`, but `prices` is replace-semantic and
  inventory mutations go through a separate batch endpoint. A
  combined UI would either fire two requests and pretend they're
  one (bad UX on partial failure), or reimplement batch / replace
  semantics on the client.
- Each drawer's submit is one mutation against one endpoint, so
  partial-failure toasts map cleanly. The vendor pays one extra
  click to switch contexts, but never sees a half-updated offer.

This trade-off is recorded so a future migration to a richer edit
surface doesn't quietly invert it.

### Prices repeater reuse

`pricing-form.tsx` is shared between the create wizard's
**Pricing & stock** tab (Prices sub-section) and the standalone
prices edit drawer. The only difference is whether the rows carry
an existing `id` (edit) or not (create). The component takes its
state from React Hook Form via `useFieldArray` and is agnostic to
which host wraps it. The inventory-items repeater follows the same
pattern: the body of the **Pricing & stock** tab's Inventory items
sub-section is identical to the create-bucket UI in the inventory
batch drawer, so the file lives at
`inventory-batch-form/inventory-items-repeater.tsx` and is imported
by both surfaces.

### Why a single Pricing & stock tab instead of two

Splitting prices and inventory items into separate tabs feels neat
on paper but is heavier than the rest of the vendor panel does for
the equivalent operation. The product create wizard packs each
variant's prices + `manage_inventory` + `inventory_kit` toggles
into one DataGrid row on the Variants tab — a single page for the
two concerns. An offer is the single-listing analogue of that row,
so collapsing prices + inventory items onto one tab keeps the
mental model and click count aligned with the precedent. If a
follow-up spec adds bulk price ladders or many-item bundles that
overflow one tab visually, the split becomes the next iteration.

### Field selection on detail load

Loader field list is intentionally tight (only the relations the
detail page renders). Two relations are deliberately omitted because
the offer module does not surface them on every detail call:
`*price_set.prices.price_list` (only needed when a discount badge
is rendered — fetch on demand inside the pricing section if the
backend exposes it) and `*inventory_items.inventory.location_levels.location`
(only needed for the per-location stocked / reserved breakdown — the
inventory section lazy-fetches the location title when the user
expands a multi-location row).

### Sidebar i18n namespace

The sidebar uses `t("offers.domain")`. The translation key lives in
the default vendor namespace alongside other `*.domain` keys. No new
i18n namespace is introduced.

### Paired backend deletions (not owned by this spec)

The Variant-scoped UI deletions above pair with backend deletions
owned by SPEC-002:

- `manage_inventory` and `allow_backorder` columns dropped from
  `ProductVariant` (`Migration20260421093258`,
  `Migration20260422105949`).
- `createProductVariantsWorkflow` override no longer wires
  `inventory_items` to the variant; the
  `product_variant_inventory_item` link table is empty for every
  Mercur-managed variant.
- Master variants no longer carry a `prices` field; each offer owns
  its own `PriceSet`.

Shipping the UI deletions ahead of the backend deletions would
leave the dashboards reading `undefined` / `[]` for fields the
forms used to write, producing silent payload drops on submit.
Shipping the backend deletions ahead of the UI deletions would
leave the variant detail / edit / create surfaces submitting
`manage_inventory: true` / `prices: [...]` payloads that the
backend silently filters out. Both halves land together.

### Out of scope

- Bulk price edits across multiple offers — there is no API for
  this in SPEC-002 and no aggregated UI surface in this spec.
- CSV / feed import of offers — explicitly excluded in SPEC-002.
- A dedicated "duplicate offer" action — recorded as a candidate
  follow-up; if added, it should call `useCreateOffer` with the
  source offer's payload as defaults.
- The buy-button binding on the storefront — owned by SPEC-005.
- The admin offers list / detail — owned by SPEC-004.
