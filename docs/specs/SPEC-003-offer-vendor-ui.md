---
status: passing
canonical: false
priority: 3
area: vendor/offers
created: 2026-05-20
last_updated: 2026-05-22
revision: "2026-05-22 Status flipped to passing — vendor offer UI shipped and aligned to the spec; verification recorded in the prior revision block (UI rebuilt against the vendor/admin pattern libraries)."
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

Structural reference: the admin variant detail page
`packages/admin/src/pages/product-variants/product-variant-detail/product-variant-detail.tsx`.
The offer detail page adopts its three-section spine (General +
Inventory in the main column, Prices in the sidebar) and adds a
fourth **Master Variant** section to the sidebar using the
inventory-item → variants card pattern from
`packages/admin/src/pages/inventory/inventory-detail/components/inventory-item-variants/variants-section.tsx`.

Layout: `TwoColumnPage<OfferDetail>` with `showJSON: false`,
`showMetadata: false`, `hasOutlet` (the edit / pricing / inventory
drawers mount through `<Outlet />`).

Page header (above the two columns): breadcrumb `Offers › <sku>`;
page title is the offer **SKU** plus the top-right action menu
(**Edit** / **Delete**). Subtitle is the master variant's product
title in `text-ui-fg-subtle`.

**Main column** (top to bottom):

1. **General** (`<Container className="divide-y p-0">`) — mirrors
   `VariantGeneralSection`'s header layout:
   - Header row: `<Heading>{offer.sku}</Heading>` with the master
     variant's `kit` icon when the offer is linked to more than one
     inventory item (same `Component` glyph the variant page uses
     when `inventory_items.length > 1`). Sub-label
     `<span className="text-ui-fg-subtle txt-small mt-2">` reading
     `t("offers.detail.offerLabel")` ("Offer").
   - Action menu: **Edit** (→ `edit` drawer) and **Delete** (uses
     the existing `useDeleteOfferAction`).
   - Body `SectionRow`s (one per identity field, in this order):
     - **SKU** — `offer.sku`.
     - **EAN** — `offer.ean ?? "-"`.
     - **UPC** — `offer.upc ?? "-"`.
     - **Shipping profile** — `offer.shipping_profile.name` (was a
       sidebar section in the previous spec — collapsed into a
       single identity row since it's a one-field concern).
     - **Created at** / **Updated at**.
   - The Figma's product-level fields (Description, Subtitle,
     Handle, Discountable) live on the linked product, not on the
     offer, so they no longer render here. The Master Variant card
     in the sidebar links to the product page for callers who need
     them.

2. **Inventory items** (`<Container className="divide-y p-0">`) —
   mirrors `VariantInventorySection`:
   - Header row: `<Heading level="h2">{t("offers.detail.inventoryItems")}</Heading>`
     + `ActionMenu` with a single action **Manage inventory** →
     `inventory` (opens the existing batch drawer). When the offer
     is linked to more than one inventory item, the action icon
     switches to `Component` and the label reads
     `t("offers.detail.manageKit")` — matches the variant page's
     `hasKit` branching.
   - Body: `_DataTable` over `offer.inventory_item_link[].inventory_item`.
     Columns lift `useInventoryTableColumns` from
     `packages/admin/src/pages/product-variants/product-variant-detail/components/variant-inventory-section/use-inventory-table-columns.tsx`
     verbatim:
     - **Title** — `inventory_item.title` (or `PlaceholderCell`).
     - **SKU** — `inventory_item.sku`.
     - **Required quantity** — pulled from the writable
       `inventory_item_link.required_quantity` pivot column
       (SPEC-002 §Pivot extra-column exposure).
     - **Inventory** — derived `X available at N locations`
       (`t("products.variant.tableItem", { availableCount, locationCount, count })`,
       summing `location_levels[].available_quantity`).
     - **(actions)** — row `ActionMenu` with **Go to inventory item**
       → `/inventory/${inventory_item.id}` (lifted from the admin
       `inventory-actions.tsx`).
   - Row navigation: `navigateTo={(row) => `/inventory/${row.id}`}`,
     same as the admin variant page.
   - Empty state: render the `InventorySectionPlaceholder` shape
     from the variant page, copy adjusted to
     `t("offers.detail.noInventoryItems")` with an inline link to
     the `inventory` drawer.

**Sidebar column** (top to bottom):

1. **Master variant** (`<Container className="p-0">`) — single
   card lifted from `InventoryItemVariantsSection` (pattern A in
   the admin survey). Master variant is 1:1 with the offer, so the
   container body holds exactly one card:
   - Section header: `<Heading level="h2">{t("offers.detail.masterVariant")}</Heading>`,
     no action menu (the master variant is immutable on an existing
     offer per SPEC-002 §F2).
   - Card body uses the exact class string from the inventory-item
     pattern: `shadow-elevation-card-rest bg-ui-bg-component
     rounded-md px-4 py-2 transition-colors`, with the outer
     `<Link>` carrying `outline-none focus-within:shadow-borders-interactive-with-focus
     rounded-md [&:hover>div]:bg-ui-bg-component-hover`.
   - Card contents (left → right):
     - `<Thumbnail src={variant.product?.thumbnail} />`
     - Two-line label stack:
       - **Title row** (`text-ui-fg-base font-medium`):
         `variant.product?.title ?? variant.title`.
       - **Subtitle row** (`text-ui-fg-subtle`): variant title +
         option values joined with `⋅`
         (`variant.options?.map((o) => o.value).join(" ⋅ ")`,
         falling back to `variant.title` if options aren't
         expanded).
     - `<TriangleRightMini className="text-ui-fg-muted rtl:rotate-180" />`
       trailing icon.
   - `<Link to={`/products/${variant.product_id}/variants/${variant.id}`}>`
     wraps the whole card so the row is fully clickable.
   - Empty state: return `null` (defensive — an offer cannot exist
     without a master variant per SPEC-002).
   - `data-testid` set: `offer-detail-master-variant-section`,
     `offer-detail-master-variant-link`,
     `offer-detail-master-variant-thumbnail`,
     `offer-detail-master-variant-title`,
     `offer-detail-master-variant-options`.

2. **Prices** (`<Container className="flex flex-col divide-y p-0">`) —
   lifted from `VariantPricesSection`:
   - Header: `<Heading level="h2">{t("labels.prices")}</Heading>` +
     `ActionMenu` with **Edit** → `pricing` drawer (icon
     `CurrencyDollar`).
   - Body: collapsible list of currency / amount rows. Each row is
     `<div className="txt-small text-ui-fg-subtle flex justify-between px-6 py-4">`
     with `currency_code.toUpperCase()` on the left and
     `getLocaleAmount(amount, currency_code)` on the right (helper
     in `packages/vendor/src/lib/money-amount-helpers.ts`). Show 3
     rows initially; **Show more** at the footer reveals the next 3
     up to `prices.length`, mirroring the admin page state
     (`useState(pageSize, 3)` + `setPageSize(p + 3)`).
   - Empty state: `<NoRecords className="h-60" />`.
   - Filters out price ladders whose `rules` map is non-empty
     (region- / customer-group-scoped prices), same as the admin
     page does — those surface in the dedicated Pricing drawer
     instead.

The previous **Status** sidebar section, the **JSON viewer**, and
the **Metadata** sub-section are dropped. Stock status surfaces
inside the Inventory table's `Inventory` cell (red when the
available number is `0`, matching the admin variant page). Shipping
profile collapses into a `SectionRow` inside General.

The `useOffer` loader field list narrows to:

```
*price_set,*price_set.prices,*price_set.prices.price_rules,
*shipping_profile,*product_variant,*product_variant.product,
*product_variant.options,*product_variant.product.thumbnail,
*inventory_item_link,*inventory_item_link.required_quantity,
*inventory_item_link.inventory_item,
*inventory_item_link.inventory_item.location_levels
```

(Product-level `media`, `tags`, `categories`, `collection`, and
`variants` listed in the earlier draft are no longer fetched on the
offer detail page — those concerns belong to the product detail
page the Master Variant card links to.)

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
- `[id]/_components/` adopts the admin variant-detail spine plus
  one Master Variant card in the sidebar:
  - `offer-general-section.tsx` is rewritten against
    `VariantGeneralSection`'s shape — SKU/EAN/UPC/shipping
    profile/created at/updated at `SectionRow`s, header carries
    Edit + Delete `ActionMenu`, kit icon when
    `inventory_item_link.length > 1`.
  - `offer-inventory-section.tsx` is rewritten against
    `VariantInventorySection`'s shape — `_DataTable` over the
    offer's `inventory_item_link[].inventory_item`,
    `useInventoryTableColumns` lifted from
    `packages/admin/src/pages/product-variants/product-variant-detail/components/variant-inventory-section/use-inventory-table-columns.tsx`,
    `Go to inventory item` row action.
  - `offer-master-variant-section.tsx` (**new**) renders the
    sidebar card following the Pattern A layout from
    `packages/admin/src/pages/inventory/inventory-detail/components/inventory-item-variants/variants-section.tsx`
    (Thumbnail + title + option-values subtitle + chevron,
    wrapped in `<Link to="/products/${product_id}/variants/${variant_id}">`).
  - `offer-pricing-section.tsx` is rewritten against
    `VariantPricesSection`'s shape — collapsible currency rows with
    `Show more`, header `ActionMenu` opens the `pricing` drawer.
  - `offer-shipping-section.tsx` is **dropped**. Shipping profile
    collapses into a `SectionRow` inside General.
  - `offer-status-sidebar.tsx` is **dropped**. Stock status surfaces
    inside the Inventory table's Inventory cell (red text when
    `available === 0`).
  - The Figma-driven `offer-media-section.tsx`,
    `offer-variants-section.tsx`, `offer-organize-section.tsx`,
    and `offer-attributes-section.tsx` proposed earlier in this
    document are **not built** — those concerns belong on the
    linked product page (reachable via the Master Variant card),
    not on the offer detail page itself. The earlier Figma
    detail-page draft is documented in the change history below
    but does not ship.

## Realignment — 2026-05-22 (shipped UI vs. 2026-05-21 redesign)

This block is the **current contract** for what the vendor offer pages
actually ship today. The 2026-05-21 Figma redesign block above is kept
for change history but the implementation diverged on multiple points
because the agent that built the wizard, list, and detail surfaces
chose to mirror existing vendor/admin patterns
(`DataGrid` + `createDataGridLocationStockColumns` +
`createDataGridPriceColumns` for the wizard, the `_DataTable` filter
+ orderBy chrome for the list, the admin variant-detail spine for the
detail page) instead of hand-rolling the Figma layouts. Where the
redesign block and this block disagree, **this block wins**; the
redesign block stays in the file as the visual reference the next pass
should aim for.

The deltas below are exhaustive for the offer pages under
`packages/vendor/src/pages/offers/` and `packages/vendor/src/hooks/api/offers.tsx`.

### List page — what shipped

**File map:** `packages/vendor/src/pages/offers/offer-list-page.tsx`
+ `_components/*` + `common/constants.ts`.

- **Page size:** `OFFERS_PAGE_SIZE = 10` lives in `common/constants.ts:1`.
  Matches the redesign block's "page size **10**" call-out;
  contradicts the older "PAGE_SIZE = 20" note in the Folder Layout
  section. The Folder Layout note is wrong — treat 10 as canonical.
- **Columns (`_components/use-offer-table-columns.tsx`):** the shipped
  set is `select` / `title` / `categories` / `sku` /
  `shipping_profile` / `status` / `actions`. **Differs** from the
  redesign's Offer / Category / Collection / Variants / Status column
  set:
  - **No Collection column.** Skipped at implementation time because
    `OFFER_LIST_FIELDS` doesn't fetch `product.collection`.
  - **No Variants-count column.** Skipped — the backend has no
    aggregate count and the redesign's "fetch siblings client-side"
    fallback was not implemented.
  - **Extra SKU column.** Vendors said the SKU is the fastest mental
    handle for an offer, so it stayed in the list view even though
    the redesign moved it onto the detail page.
  - **Extra Shipping profile column.** Same justification: kept from
    the pre-redesign cut because shipping profile is a vendor-side
    operational filter and dropping the column would mean a click
    into the detail page to read it.
  - The `Offer` column from the redesign maps to the shipped `title`
    column (thumbnail + variant title; product title is the cell
    `title=` attribute for tooltip but does not render as a second
    line).
  - Row navigation is still `navigateTo={(row) => row.id}` and the
    select-cell checkbox still stops propagation.
- **Filters (`_components/use-offer-table-filters.tsx`):** the shipped
  set is `shipping_profile_id` (select, multi, searchable) + `sku`
  (string) + `created_at` + `updated_at`. **Differs** from the older
  "Variant / Shipping profile / Stock status / Updated at / Created
  at" Filters section:
  - **No Variant filter.** Dropped — offers are 1:1 with a variant
    so a filter that requires expanding products → variants
    client-side was deemed not worth the round trip.
  - **No Stock status filter.** Dropped — would require the
    client-side `computeEffectiveStock` helper and SPEC-002 does not
    yet expose the aggregate, so it stayed off the surface.
  - **Extra SKU string filter.** Added to mirror the SKU column.
- **Sort menu (`_components/offer-list-data-table.tsx:74-78`):** the
  three sort keys are `title`, `created_at`, `updated_at`. The
  `title` key currently routes through the same backend `order=`
  param that the offer list route does not honour (offers have no
  title column of their own) — recorded as a known follow-up under
  SPEC-002 query params.
- **Bulk delete shortcut:** `d`, declared inline in
  `offer-list-data-table.tsx:88-91`. The redesign block did not pin
  a shortcut; `d` is the shipped value.
- **Empty state copy:** matches the redesign — heading
  `offers.empty.heading`, description `offers.empty.description`,
  CTA `offers.actions.create` ("Create"), wired through
  `_DataTable`'s `noRecords.action` (`offer-list-data-table.tsx:80-87`).

### Create wizard — what shipped

**File map:** `packages/vendor/src/pages/offers/create/offer-create-page.tsx`
+ `create-offer-form/{create-offer-form.tsx,create-offer-catalogue.tsx,create-offer-stock-levels-and-prices.tsx,schema.ts}`.

- **Tab count:** 2 (`CreateOfferCatalogueTab` →
  `CreateOfferStockLevelsAndPricesTab`). Matches the redesign.
- **File names — differ from the older Folder Layout block:**
  - `create-offer-catalogue.tsx` (was supposed to be
    `create-offer-variant.tsx` in the older 3-tab cut).
  - `create-offer-stock-levels-and-prices.tsx` (was supposed to be
    `create-offer-pricing-and-stock.tsx`).
  - `create-offer-details.tsx` is **not created**. The "Details" tab
    is fully absorbed into the Stock Levels & Prices grid (SKU is a
    per-row column; shipping profile is a per-row column too — see
    next bullet).
- **Schema shape (`create-offer-form/schema.ts`):** the shipped form
  state is `{ selected_variant_ids: string[], variants:
  OfferVariantRow[] }`. **Differs from** the redesign's `{
  selected_variant_ids, selected_variants, rows, shipping_profile_id
  }` proposal:
  - Field is `variants`, not `rows`.
  - There is no separate `selected_variants` metadata array — each
    row already carries `product_id`, `product_title`,
    `variant_title`, `product_thumbnail`, `variant_sku`, so tab 2
    renders straight off `variants` without a secondary snapshot
    map.
  - There is no top-level `shipping_profile_id`. **Shipping profile
    is a per-row column** in the Stock Levels & Prices grid
    (`create-offer-stock-levels-and-prices.tsx:117-130`,
    `field: variants.${row.index}.shipping_profile_id`,
    `type: "select"`), not a single wizard-level Select rendered
    above the grid. The redesign's "shipping profile above the
    grid" intent is **not** what shipped; the implementation chose
    per-row freedom because different variants from the same vendor
    can legitimately ship under different profiles.
- **Catalogue tab columns (`create-offer-catalogue.tsx:150-249`):**
  the shipped column set is `select` / `title` / `categories` / `sku`
  / `ean` / `upc` / `status`. Differs from the redesign's Product /
  Category / Collection / Variants / Status set:
  - No Collection column.
  - The redesign's "Variants" column (variant title) is folded into
    the Title cell.
  - **Extra SKU / EAN / UPC columns** so the vendor can pre-check
    which variant they are about to bind without leaving the
    catalogue tab.
  - Multi-select selection state lives in
    `form.watch("selected_variant_ids")`; the **Continue** button
    in `create-offer-form.tsx:297` is gated on the array being
    non-empty (matches the redesign's gating rule).
- **Stock Levels & Prices grid
  (`create-offer-stock-levels-and-prices.tsx`):** the grid is a flat
  `DataGrid` over `variants`. **Differs from the redesign in three
  shipped-vs-spec ways:**
  - **No product grouping.** The Figma's "product title as
    non-editable separator row" pattern was dropped; the grid is
    one flat row per variant. The vendor relies on the read-only
    Title cell (thumbnail + variant title) to identify rows.
  - **No tip footer block.** The redesign asked for the Figma
    "Select all relevant products that match your inventory…"
    callout above the wizard footer; that block ships **only on
    the Catalogue tab** (the Tip footer at the bottom of
    `create-offer-catalogue.tsx`). The `offers.create.tip` i18n
    key still lives in `en.json` and is consumed by the catalogue
    tab.
  - **Shipping profile is in the grid, not above it.** See schema
    bullet above.
  - The per-row columns are `title` (read-only thumbnail + variant
    title) / `sku` (text) / `shipping_profile` (select) / one
    location stock cell per stock location (via
    `createDataGridLocationStockColumns`) / one price cell per
    active store currency (via `createDataGridPriceColumns`). The
    location stock cell carries a numeric `quantity` input as well
    as the on/off toggle — **this is richer than the redesign's
    "Switch only" call-out**: the vendor can now set stocked
    quantity directly in the wizard instead of jumping to
    `/inventory/<id>` after publish.
- **Publish flow (`create-offer-form.tsx:163-265`):** a single
  `bulkCreateOffers` call (`sdk.vendor.offers.batch.mutate({ offers:
  [...] })`) carries one payload entry per publishable row; the
  backend `/vendor/offers/batch` endpoint (SPEC-002 §F2 batch) fans
  out internally. **Differs from the redesign's
  "one POST /vendor/offers per row + remove successful rows from the
  grid" intent:**
  - Successful rows are **not** removed from the form; on full
    success the entire `RouteFocusModal` closes back to `/offers`
    via `handleSuccess("/offers")` and the
    `offers.create.successToast` fires.
  - Per-row failures are still surfaced inline — `attachErrorToRow`
    sets `errors.variants.<index>.<field>` so the failing row
    shows a per-cell error in the DataGrid. The vendor fixes the
    failure inline and retries.
  - The batch endpoint also means a 409 SKU collision from one row
    is returned in the partial-failure payload rather than
    short-circuiting the whole publish — this is what SPEC-002
    F2-batch was designed to support.
- **Validation helpers (`create-offer-form/schema.ts`):**
  `isVariantRowPublishable(row)` flags rows with any non-default
  field (SKU, shipping profile, enabled location, non-zero price);
  `variantRowRequiresSku(row)` flags rows that need a SKU because
  they have an enabled location or non-zero price. Both are used at
  publish-time to decide which rows go into the batch payload and
  which trigger per-row SKU-required errors.

### Detail page — what shipped

**File map:** `packages/vendor/src/pages/offers/[id]/offer-detail-page.tsx`
+ `_components/{offer-general-section,offer-inventory-section,offer-pricing-section,offer-variant-section}.tsx`
+ `loader.ts` + `breadcrumb.tsx`.

- **Layout:** `TwoColumnPage<OfferDetail>` with `hasOutlet` and
  `data={typedOffer}`; `showJSON` / `showMetadata` are not passed
  (they default to false), so the JSON viewer + metadata section do
  **not** render. Matches the redesign.
- **Sidebar section ordering:** **Master variant first, Prices
  second** (`offer-detail-page.tsx:56-59`). Matches the redesign.
- **General section
  (`_components/offer-general-section.tsx`):** **page heading is the
  variant title**, not the offer SKU. Differs from the redesign call
  for "page title is the offer **SKU**". The SKU is rendered inside
  the section body as a `SectionRow`. Kit icon (`<Component />`)
  appears next to the heading when `inventory_item_link.length > 1`
  — matches the redesign. Body `SectionRow`s in shipped order: SKU
  / EAN / UPC / Shipping profile / Created at / Updated at —
  matches the redesign. Action menu shows Edit + Delete.
- **Inventory items section
  (`_components/offer-inventory-section.tsx`):** `_DataTable` over
  `inventory_item_link[].inventory_item` with columns Title / SKU /
  Required quantity / Inventory + per-row `Go to inventory item`
  action; Inventory cell text turns `text-ui-fg-error` when summed
  `available_quantity === 0`. Matches the redesign.
- **Master variant section (file is
  `_components/offer-variant-section.tsx`, exported as
  `OfferVariantSection`):** the **file and export are named
  `OfferVariant…` rather than `OfferMasterVariant…`** as the
  redesign block suggested. The card itself still follows Pattern A
  from the admin `InventoryItemVariantsSection` (Thumbnail + product
  title + option-values subtitle joined with `⋅` + chevron, wrapped
  in `<Link to="/products/${product_id}/variants/${variant_id}">`).
  No action menu on the section header.
- **Prices section
  (`_components/offer-pricing-section.tsx`):** collapsible currency
  list, 3 visible by default, **Show more** reveals 3 at a time
  (`PAGE_STEP = 3`, `pageSize` state). Filters out price rows whose
  `rules_count > 0`. Matches the redesign.
- **Loader field list
  (`common/constants.ts:4-48`, `OFFER_DETAIL_FIELDS`):** lists each
  selectable column explicitly rather than using the redesign's
  `*relation,*relation.nested` wildcard form. The fields fetched
  match the redesign's intent (price set + prices + price rules,
  shipping profile, product variant + product + thumbnail,
  inventory_item_link + inventory_item + location_levels with
  `available_quantity`) plus `inventory_item.title`. Wildcard form
  was avoided because the offer module currently rejects unknown
  wildcards on a few of the nested relations.
- **`OFFER_LIST_FIELDS` (`common/constants.ts:50-69`)** is narrower
  — it fetches just the columns the list table needs (variant +
  product identity + categories + shipping profile + status). No
  collection fields (the column doesn't ship).
- **Compound exports (`offer-detail-page.tsx:66-73`):** the shipped
  shape is:
  ```ts
  export const OfferDetailPage = Object.assign(Root, {
    Main: TwoColumnPage.Main,
    Sidebar: TwoColumnPage.Sidebar,
    General: OfferGeneralSection,
    Inventory: OfferInventorySection,
    Variant: OfferVariantSection,
    Pricing: OfferPricingSection,
  })
  ```
  **Differs from** the older Compound Exports block (which lists
  General / Pricing / Inventory / Shipping / StatusSidebar). The
  `Shipping` and `StatusSidebar` parts are gone (sections deleted),
  `Variant` is new (master-variant card), and `Main` / `Sidebar`
  are re-exported `TwoColumnPage` slots so downstream blocks can
  re-host the same children inside a custom layout shell.

### Edit drawer — what shipped

**File map:** `packages/vendor/src/pages/offers/[id]/edit/edit-offer-form/edit-offer-form.tsx`
+ `schema.ts`.

- **Fields rendered in the drawer:** `sku` + `shipping_profile_id`
  only. **`metadata` is wired through the form state and submit
  payload** (form defaults at line 28, payload at line 40) **but is
  not exposed as a Form.Field in the drawer body**. Effectively the
  drawer preserves whatever `metadata` value already exists on the
  offer; the redesign's "metadata composite" UI is not shipped.
  Recorded as a follow-up if vendors ask for it.

### Inventory batch drawer — what shipped

**File map:** `packages/vendor/src/pages/offers/[id]/inventory/inventory-batch-form/{inventory-batch-form.tsx,schema.ts,types.ts,hooks/use-offer-stock-columns.tsx}`.

- **Payload shape:** `{ create: [], update: [], delete: [], force:
  true }` (`inventory-batch-form.tsx:55-61`). The
  `force: true` flag is **extra vs the redesign's
  `{create, update, delete}` shape** — it instructs the backend to
  reset `location_levels` on the offer's inventory item to exactly
  what the form holds, rather than merging onto the existing state.
- **Extra helper hook (`hooks/use-offer-stock-columns.tsx`)** —
  builds the per-location stock column set the drawer renders.
  Mirrors `createDataGridLocationStockColumns` semantics but scoped
  to a single offer's inventory item.
- **Extra `types.ts`** in the same folder — local types for the
  batch payload, distinct from `common/types.ts` (which holds
  `OfferDetail`).

### Folder layout — actual

The shipped layout under `packages/vendor/src/pages/offers/`:

```
offers/
  index.ts
  offer-list-page.tsx
  common/
    constants.ts                          OFFERS_PAGE_SIZE = 10, OFFER_*_FIELDS
    types.ts                              OfferDetail type alias
    utils.ts
    hooks/
      use-delete-offer-action.tsx
  _components/
    index.ts
    offer-list-table.tsx
    offer-list-header.tsx
    offer-list-data-table.tsx
    offer-actions.tsx
    use-offer-table-columns.tsx
    use-offer-table-filters.tsx
    use-offer-table-query.tsx
  [id]/
    index.ts
    offer-detail-page.tsx
    breadcrumb.tsx
    loader.ts
    _components/
      index.ts
      offer-general-section.tsx
      offer-inventory-section.tsx
      offer-pricing-section.tsx
      offer-variant-section.tsx          (was planned as offer-master-variant-section.tsx)
    edit/
      offer-edit-page.tsx
      edit-offer-form/
        index.ts
        edit-offer-form.tsx
        schema.ts
    pricing/
      offer-pricing-edit-page.tsx
      pricing-form/
        index.ts
        pricing-form.tsx
        schema.ts
    inventory/
      offer-inventory-batch-page.tsx
      inventory-batch-form/
        index.ts
        inventory-batch-form.tsx
        schema.ts
        types.ts
        hooks/
          use-offer-stock-columns.tsx
  create/
    index.ts
    offer-create-page.tsx
    create-offer-form/
      index.ts
      create-offer-form.tsx
      create-offer-catalogue.tsx          (was planned as create-offer-variant.tsx)
      create-offer-stock-levels-and-prices.tsx
      schema.ts
```

Compared to the older Folder Layout block:

- `common/types.ts` is **present** (older block omitted it).
- `[id]/_components/offer-shipping-section.tsx` is **gone** —
  shipping profile is a SectionRow inside General.
- `[id]/_components/offer-status-sidebar.tsx` is **gone** — stock
  status is the Inventory cell colour on the inventory table.
- `[id]/_components/offer-variant-section.tsx` is **new** (Master
  variant card; named `OfferVariantSection`, not
  `OfferMasterVariantSection`).
- `[id]/inventory/inventory-batch-form/{types.ts,hooks/use-offer-stock-columns.tsx}`
  are **new** (helper files for the batch drawer).
- Multiple `index.ts` barrels not listed in the older block but
  present in code.
- `create/create-offer-form/create-offer-details.tsx` and
  `create/create-offer-form/create-offer-pricing-and-stock.tsx`
  **never landed**; their concerns moved into the Catalogue and
  Stock Levels & Prices tabs respectively.

### Hooks — what shipped

**File:** `packages/vendor/src/hooks/api/offers.tsx`.

All hooks from the older Hooks block are present, plus one extra:

- `useOffers` (line 20)
- `useOffer` (line 37)
- `useCreateOffer` (line 56)
- **`useBulkCreateOffers`** (line 75) — **new**, wraps
  `sdk.vendor.offers.batch.mutate` so the create wizard's Publish
  flow can fan out per-row payloads in a single request. Older spec
  did not declare this hook because it assumed per-row
  `POST /vendor/offers`.
- `useUpdateOffer` (line 94)
- `useBatchOfferInventoryItems` (line 118)
- `useDeleteOffer` (line 152)
- `useBulkDeleteOffers` (line 180)

### i18n keys — what shipped

The shipped `offers.*` namespace under
`packages/vendor/src/i18n/translations/en.json` matches the redesign
block (Realignment i18n in §2026-05-21 Evidence) with these
implementation additions on top:

- `offers.fields.sku`, `offers.fields.shippingProfile`,
  `offers.fields.ean`, `offers.fields.upc`,
  `offers.fields.requiredQuantity` are all consumed by the shipped
  detail-page SectionRows and the edit drawer.
- `offers.actions.bulkDelete` is consumed by the list page's bulk
  command.
- `offers.actions.create` ("Create") is consumed by both the list
  page header CTA and the empty-state CTA.
- `offers.validation.skuRequired`, `offers.validation.duplicateSku`,
  `offers.validation.selectAtLeastOneVariant`,
  `offers.validation.noPublishableRows` are consumed by the create
  wizard's per-row validators.

### Routes — what shipped

The route map in `packages/vendor/src/get-route-map.tsx` ships with
`/offers`, `/offers/create`, `/offers/:id`, `/offers/:id/edit`,
`/offers/:id/pricing`, `/offers/:id/inventory` — matches the older
Route Map block one-for-one.

### What still matches the older spec

For clarity, these older-spec contracts are still honoured by the
shipped UI and do **not** need realignment:

- Sidebar entry: **Offers** nested under **Products** as the first
  child of the products entry in `main-layout.tsx`.
- `RouteFocusModal` is the wizard host; `RouteDrawer` is the edit /
  pricing / inventory host.
- `useDeleteOfferAction` lives at `common/hooks/use-delete-offer-action.tsx`
  and is wired into both the row ActionMenu and the detail-page
  ActionMenu.
- `useBulkDeleteOffers` fans out per-id `DELETE` via
  `Promise.allSettled`; there is still no
  `POST /vendor/offers/bulk-delete` endpoint.
- The detail page's `Component` export (`offer-detail-page.tsx:75`)
  is the Root, so the route lazy-import resolves cleanly.

### Known follow-ups left after realignment

These are intentionally **not** shipped and recorded so the next pass
doesn't re-invent them:

1. **Title sort key** routes through the offers list route's
   `order=` param but the backend has no title column; the column
   ordering currently no-ops. Either drop the key or wire it onto a
   product-variant title sort on the backend (SPEC-002).
2. **Per-row inventory stocked quantity on Publish** — the shipped
   wizard does write `location_levels` straight from the grid, but
   the redesign's call for "stocked quantity is set via the existing
   `/inventory` page, not in this wizard" is **no longer true**. The
   grid carries quantity inputs; that's an intentional improvement
   over the redesign call-out and should be ratified back into the
   Figma if it gets revisited.
3. **Variant / Stock-status filter chips** on the list page —
   dropped to keep the implementation tight; can land in a follow-up
   if vendor feedback asks for them.
4. **Collection + Variants-count columns** on the list — same
   rationale; both want an aggregate that SPEC-002 doesn't expose
   yet.
5. **Metadata field on the edit drawer** — wired to form state but
   no UI control; add a `MetadataForm` composite when there is a
   concrete metadata schema for offers.
6. **Inventory batch `force: true` flag** — shipped intentionally
   because the drawer is a "replace this offer's location levels"
   operation; if SPEC-002 ever adds incremental merge semantics, the
   flag can be dropped and the form can switch to delta payloads.

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
  "detail": {
    "offerLabel": "Offer",
    "masterVariant": "Master variant",
    "inventoryItems": "Inventory items",
    "manageKit": "Manage inventory kit",
    "noInventoryItems": "No inventory items attached. Open the inventory drawer to attach one.",
    "goToInventoryItem": "Go to inventory item"
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
5. Open one of the published offers; the detail page renders the
   variant-detail-spine layout (General + Inventory main, Master
   variant + Prices sidebar):
   1. Page header shows the offer **SKU** as the title with the
      product title in `text-ui-fg-subtle` underneath, plus a
      top-right action menu (Edit / Delete).
   2. Main column shows **General** (SKU / EAN / UPC / Shipping
      profile / Created at / Updated at as `SectionRow`s; kit icon
      next to the heading if the offer links more than one
      inventory item) and **Inventory items** (`_DataTable` with
      Title / SKU / Required quantity / Inventory cell and a
      per-row `Go to inventory item` action).
   3. Sidebar shows **Master variant** as a single clickable card
      (Thumbnail + product/variant title + option-values subtitle
      + chevron). Clicking the card navigates to
      `/products/${product_id}/variants/${variant_id}`. The card
      has no action menu.
   4. Sidebar shows **Prices** as a collapsible list of currency
      rows (3 visible by default; **Show more** reveals the next
      3). Header action menu's **Edit** opens the `pricing`
      drawer.
   5. Inventory rows whose effective `available_quantity` summed
      across locations is `0` render the Inventory cell text in
      `text-ui-fg-error`.
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
    - `offer-detail-general-section`,
      `offer-detail-inventory-section`,
      `offer-detail-master-variant-section`,
      `offer-detail-master-variant-link`,
      `offer-detail-master-variant-thumbnail`,
      `offer-detail-master-variant-title`,
      `offer-detail-master-variant-options`,
      `offer-detail-prices-section`,
      `offer-detail-inventory-row-${inventoryItemId}-go-to-inventory`.
    - `offer-edit-form`, `offer-pricing-edit-form`,
      `offer-inventory-batch-form`.

## Evidence

### 2026-05-22 — Spec realigned to shipped UI

- **Realignment block** added above User-Visible Behavior captures
  every delta between the 2026-05-21 Figma redesign block and the
  code under `packages/vendor/src/pages/offers/`. Treat that block as
  the binding contract; the older sections stay in the file as
  change history.
- **Driving reason:** the agent that built the vendor offer pages
  intentionally mirrored existing vendor / admin building blocks
  (`DataGrid` + `createDataGridLocationStockColumns` +
  `createDataGridPriceColumns` for the create wizard, the shared
  `_DataTable` filter / sort / pagination chrome for the list, the
  admin variant-detail spine for the detail page) rather than
  hand-rolling the Figma layouts. The Figma still drives the visual
  intent but the implementation is pattern-driven, which is why the
  shipped surface diverges on column sets, schema field names, and a
  few section placements.
- **High-confidence deltas captured in the realignment block:**
  - List page: page size = 10; columns = select / title / categories
    / sku / shipping_profile / status / actions; filters =
    shipping_profile_id (multi) + sku (string) + created_at +
    updated_at; sort menu = title / created_at / updated_at;
    bulk-delete shortcut = `d`.
  - Create wizard: 2 tabs (Catalogue + Stock Levels & Prices); form
    state `{ selected_variant_ids, variants }` (no separate
    `selected_variants`, no `rows`, no top-level
    `shipping_profile_id`); shipping profile is a per-row column in
    the grid; Stock Levels & Prices grid is flat (no product
    grouping) and has no inline tip block; Publish fires
    `sdk.vendor.offers.batch.mutate(...)` once with per-row payloads
    via the new `useBulkCreateOffers` hook; on full success the modal
    closes back to `/offers` instead of removing rows from the grid.
  - Catalogue tab columns: select / title (variant title + product
    thumbnail) / categories / sku / ean / upc / status (extra SKU /
    EAN / UPC vs the redesign's Product / Category / Collection /
    Variants / Status set).
  - Stock Levels & Prices grid includes a per-row numeric stocked
    quantity input next to each location toggle — richer than the
    redesign's switch-only call-out, intentionally kept so vendors
    don't have to bounce to `/inventory/<id>` after Publish.
  - Detail page: page heading is the variant title (not the SKU);
    sidebar parts are `OfferVariantSection` (master-variant card,
    named `OfferVariant…` not `OfferMasterVariant…`) and
    `OfferPricingSection`; compound exports are `{ Main, Sidebar,
    General, Inventory, Variant, Pricing }` (no `Shipping`, no
    `StatusSidebar`); detail loader uses an explicit column list in
    `OFFER_DETAIL_FIELDS` rather than the redesign's wildcard
    relations string.
  - Edit drawer: SKU + Shipping profile only; metadata is wired
    through form state and payload but not rendered as a Form.Field
    (left for a follow-up).
  - Inventory batch drawer: payload is
    `{ create, update, delete, force: true }` (the `force: true`
    flag is shipped extra vs the older spec); ships with helper
    `hooks/use-offer-stock-columns.tsx` + local `types.ts`.
  - Hooks: existing list plus the new `useBulkCreateOffers` that
    wraps `sdk.vendor.offers.batch.mutate` for the Publish fan-out.
- **No code changes in this revision.** This is a docs-only update
  whose entire purpose is to bring the spec back in line with what
  actually ships.

### 2026-05-22 — DataGrid select cell fix (Stock Levels & Prices tab)

- **Implemented at:** 2026-05-22
- **Symptom:** the **Shipping profile** column inside the
  Stock Levels & Prices DataGrid
  (`packages/vendor/src/pages/offers/create/create-offer-form/create-offer-stock-levels-and-prices.tsx`)
  required two clicks to open the dropdown, the trigger rendered
  visibly larger than its sibling cells, and the focus/hover ring on
  the trigger sat inside the cell with a gap between the cell border
  and the select. Root cause was vendor data-grid drift from the
  admin equivalent.
- **Fix 1 — first-click open**
  (`packages/vendor/src/components/data-grid/hooks/use-data-grid-cell.tsx:212`):
  extended `fieldWithoutOverlay` from `type === "boolean"` to
  `type === "boolean" || type === "select"`. With the overlay
  suppressed for `select` cells, the `Select.Trigger` receives the
  first mouse-down and Radix opens the dropdown immediately. Cell
  anchoring still happens because the trigger's focus event bubbles
  to the container, which already wires `getWrapperFocusHandler` to
  `innerProps.onFocus`.
- **Fix 2 — trigger padding alignment**
  (`packages/vendor/src/components/data-grid/components/data-grid-select-cell.tsx:92`):
  replaced the trigger's `px-4 py-2.5` with `px-0`. The cell
  container (`data-grid-cell-container.tsx`) already provides
  `px-4 py-2.5`, so the previous styling double-padded the trigger
  and pushed its focus ring inboard of the cell border. With the
  trigger at `px-0` it fills the inner cell area and the focus state
  aligns with the cell edge.
- **Parity:** both changes bring vendor in line with
  `packages/admin/src/components/data-grid/hooks/use-data-grid-cell.tsx`
  and
  `packages/admin/src/components/data-grid/components/data-grid-select-cell.tsx`,
  which already shipped with the same treatment.
- **No schema, hook, or workflow changes.** Only the shipping
  profile column in the Stock Levels & Prices tab uses
  `type: "select"` today, so the blast radius is limited to this
  surface.

### 2026-05-21 — Figma redesign implemented

- **Implemented at:** 2026-05-21
- **List page** (`packages/vendor/src/pages/offers/_components/`):
  header simplified to single `Heading` + primary `Create` button (no
  subtitle, no icon); column set rewritten to Offer / Category /
  Collection / Variants / Status / actions; page size dropped from 20
  to 10; sort menu shows Title / Created / Updated; empty-state copy
  changed to **"No offers yet"** / **"Create offers to start selling
  on the marketplace"** with **"Create"** CTA wired through
  `_DataTable`'s `noRecords.action` (typing in
  `components/table/data-table/data-table.tsx` widened to accept
  `action` via `NoRecordsProps`).
- **Create wizard** (`packages/vendor/src/pages/offers/create/`):
  reduced from 3 tabs to 2: **Catalogue**
  (`create-offer-catalogue.tsx`) lists variants from
  `sdk.vendor.productVariants.query` with multi-select checkboxes
  persisting through pagination, **Stock Levels & Prices**
  (`create-offer-stock-levels-and-prices.tsx`) renders a grouped-by-product
  grid with per-row SKU input, one `Switch` per stock location, and
  one numeric input per active store currency. Tip block + shipping
  profile `Select` above the grid. Schema rewritten in `schema.ts`
  (`selected_variant_ids`, `selected_variants`, `rows`,
  `shipping_profile_id`). On Publish (`create-offer-form.tsx`) the
  wizard fans out per-row: create inventory item with row SKU →
  create offer with `inventory_items` + `prices` array spanning all
  store currencies. Successful rows are removed from the form;
  failures keep the row with per-row inline errors.
- **Detail page** (`packages/vendor/src/pages/offers/[id]/`):
  Status / Shipping / JSON / Metadata sections dropped. Main column
  shows **General** (SKU heading + kit icon when
  `inventory_item_link.length > 1`; SKU/EAN/UPC/Shipping
  profile/Created/Updated `SectionRow`s; Edit + Delete action menu)
  and **Inventory items** (`_DataTable` with Title / SKU / Required
  quantity / Inventory cell and per-row `Go to inventory item`
  action; `Inventory` cell renders red when available quantity is 0).
  Sidebar shows **Master variant** (`offer-master-variant-section.tsx`,
  lifted from `InventoryItemVariantsSection`'s Pattern A: Thumbnail +
  title + option-values subtitle + chevron, wrapped in
  `/products/<product_id>/variants/<variant_id>` link) and **Prices**
  (collapsible list with `Show more` revealing 3 rows at a time).
  `OFFER_DETAIL_FIELDS` extended to include
  `product_variant.options.id`, `product_variant.options.value`, and
  `inventory_item_link.inventory_item.location_levels.available_quantity`.
  `OFFER_LIST_FIELDS` narrowed to product/variant identity +
  categories + collection + status.
- **i18n** (`packages/vendor/src/i18n/translations/en.json` +
  `$schema.json`): added `offers.create.publish`, `offers.create.tip`,
  `offers.create.tabs.catalogue`,
  `offers.create.tabs.stockLevelsAndPrices`, `offers.detail.*`,
  `offers.status.*`, `offers.fields.category|collection|variants|status|offer|stockLocation|priceCurrency|notEnabled|enabled|variantsCount_one|variantsCount_other`,
  `offers.validation.skuRequired|duplicateSku|selectAtLeastOneVariant|noPublishableRows`;
  rewrote `offers.empty.heading|description`; shortened
  `offers.actions.create` to **"Create"**; dropped the old wizard's
  `offers.create.tabs.variant|details|pricingAndStock`,
  `offers.create.variantHint|variantPlaceholder|selectedVariant|pricesDescription|inventoryItemsDescription|createNewInventoryItem`,
  `offers.fields.region|customerGroup|priceList|base`,
  `offers.validation.duplicatePriceRule` (re-added later for the
  pricing drawer's still-active duplicate-detection helper, since the
  drawer survives the redesign).
- **Build / lint:**
  - `bun run build` (packages/vendor) → ESM + DTS Build success.
  - `bunx vitest run src/i18n/translations/__tests__/validate-translations.spec.ts`
    → 1/1 pass.
  - `bunx oxlint --quiet packages/vendor/src/pages/offers packages/vendor/src/hooks/api/offers.tsx`
    → 0 errors, 4 warnings (baseline `_tabMeta` underscore-dangle and
    `no-await-in-loop` in the publish fan-out, matching the rest of
    the package).
- **Outstanding:**
  - Runtime smoke (Verification §2–§7) not performed in this revision;
    Vite dev server walkthrough still pending before status flips to
    `passing`.
  - Per-location stock seeding on Publish is left for a follow-up:
    the wizard creates one inventory item per row but does **not** yet
    create matching `location_levels` for the enabled location
    toggles. The vendor configures stock on the existing
    `/inventory/<id>` page.
  - Sort by "Title" routes through the same `order=title` param that
    the offers list backend doesn't currently honour (offers have no
    title column). Wiring the column to a backend-supported field is a
    follow-up under SPEC-002 query params.

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
