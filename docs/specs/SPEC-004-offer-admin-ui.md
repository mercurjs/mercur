---
status: not_started
canonical: false
priority: 4
area: admin/offers
created: 2026-05-20
last_updated: 2026-05-21
---

> **2026-05-20 product/variant scope removal.** SPEC-002 moves the
> per-vendor commercial surface (prices + inventory linkage) off the
> master `ProductVariant` and onto the `Offer`. The variant model
> in `packages/core/src/modules/product/models/product-variant.ts`
> no longer declares `manage_inventory`, `allow_backorder`, or a
> `prices` field — the `Migration20260421093258` and
> `Migration20260422105949` migrations drop those columns, and
> Mercur's `createProductVariantsWorkflow` override no longer writes
> rows to the `product_variant_inventory_item` link table.
>
> The admin panel currently mirrors Medusa's stock variant-scoped
> commerce UI (prices, stock, inventory-kit, manage-items modals,
> per-variant pricing in the product create wizard). Every one of
> those surfaces now writes payloads the backend silently drops on a
> Mercur-managed variant.
>
> This spec ships the **operator** Offer surface (read-only list +
> detail + per-seller bulk-delete) **and** removes the variant-scoped
> commerce UI in the admin panel in the same change. The vendor
> equivalent is owned by SPEC-003 §Variant-scoped UI to remove.
> SPEC-002 is canonical for the schema and workflow side.
>
> See **Variant-scoped UI to remove (admin)** below for the
> exhaustive deletion list.

# SPEC-004 Offer Management — Admin Panel UI

This spec owns the **operator-facing UI** for the offer module. It is
the visual + interaction contract for the admin dashboard
(`@mercurjs/admin`) that consumes the endpoints declared in
**SPEC-002 §Endpoint Contracts** under `/admin/offers/*` and
`/admin/sellers/:id/offers/bulk-delete`. SPEC-002 is canonical; if
the two ever drift, this spec follows.

The companion specs are:

- **SPEC-002** — domain model, endpoint contracts, workflows, cart
  integration. Canonical.
- **SPEC-003** — vendor panel UI (`@mercurjs/vendor`). Full CRUD on
  the seller's own offers.

## Scope and constraints

The admin surface is **read-only** per SPEC-002 Session 7. Operators
inspect offers across the entire marketplace; they do not create or
edit them. The only write action exposed to admins is bulk soft-delete,
scoped per seller via `POST /admin/sellers/:id/offers/bulk-delete`.

The admin panel has no per-offer mutate routes. That is by design:

- An admin should not author commercial terms on behalf of a seller
  (`sku`, prices, shipping profile, inventory links). Those decisions
  are the seller's. SPEC-002 enforces this on the API side; this spec
  carries the constraint into the UI by simply not surfacing the
  affordances.
- Suspension, expiry, and SLA-driven moderation are deferred per
  SPEC-002 §Storefront API Surface. When they land, the admin UI will
  gain the new actions; until then the detail page intentionally has
  no action menu beyond bulk-delete entry points.

## User-Visible Behavior

A logged-in marketplace operator opens the admin panel and sees a new
sidebar entry **Offers** nested under **Products**, mirroring the
vendor panel placement (SPEC-003 §Sidebar entry). Clicking it lands
on `/offers`, a marketplace-wide list of every offer across every
seller. The operator can search, filter (notably by seller and
variant), sort, paginate, and open a single offer's detail page. The
detail page renders the same data the vendor sees plus an audit log
section. The only mutation available is bulk-delete, surfaced both
on the list page (for offers selected on a single seller) and on the
seller detail page (for that seller's full catalog).

The screen vocabulary mirrors the existing admin surfaces
(`pages/stores`, `pages/products`, `pages/inventory`) so a familiar
operator recognizes every interaction.

### Sidebar entry

The `useCoreRoutes` array in
`packages/admin/src/components/layout/main-layout/main-layout.tsx`
gains an `Offers` nested item under the `products.domain` route, as
the **first** entry in the `items` array (matching the vendor panel's
placement in SPEC-003):

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

No new top-level icon is introduced. Rationale: same as the vendor
panel — an offer is a listing on a master variant, conceptually a
child of Products.

### List page (`/offers`)

- Layout: `SingleColumnPage hasOutlet` + one `Container className="divide-y p-0"`.
- Header row: `<Heading>` "Offers" left, subtitle "Browse every
  offer across all sellers"; no primary CTA (admin cannot create).
- Search bar, ordering, and pagination wired through the existing
  `_DataTable` primitive used by `StoreListDataTable` (page size
  **20**, `keepPreviousData`).
- Row click navigates to the detail page (`navigateTo={(row) => row.id}`).
- Per-row `ActionMenu` (rightmost column) has a single action:
  - **Open seller** → `to="/stores/${seller.id}"` (`BuildingStorefront`).

  Edit / Delete / Manage prices / Manage inventory are intentionally
  absent. The detail page itself is the only "drill in" surface.
- Bulk selection: `enableRowSelection: true`. Selection persists
  across pagination but **only across rows belonging to the same
  seller**. If the operator's current selection spans multiple
  sellers, the bulk-delete command is disabled (with a tooltip
  explaining the scope) because the bulk-delete endpoint is
  `POST /admin/sellers/:id/offers/bulk-delete` — single-seller scoped.

  The constraint is enforced client-side: `useDataTable`'s
  `onRowSelectionChange` rejects the new selection if it would mix
  sellers, and surfaces an inline `toast.warn` with copy
  `offers.bulkDelete.crossSellerWarning`.
- Bulk commands (rendered in the `_DataTable` command bar when at
  least one row is selected):
  - **Delete selected** (`Trash`, shortcut `d`). Opens
    `usePrompt` confirmation:
    `{ title: t("general.areYouSure"), description: t("offers.bulkDelete.description", { count, sellerName }), confirmText: t("actions.delete"), cancelText: t("actions.cancel"), variant: "danger" }`,
    then calls `useBulkDeleteOffersForSeller(sellerId).mutateAsync(ids)`
    which dispatches `POST /admin/sellers/:id/offers/bulk-delete`
    with the selected ids in the request body.
  - The endpoint returns `202 { job_id }`. The hook polls
    `sdk.admin.jobs.$id.query({ $id: job_id })` at 2-second intervals
    until the job reaches `succeeded` or `failed`, then invalidates
    `offerQueryKeys.lists()` and toasts the outcome. The toast copy
    differs for the two terminal states:
    - `succeeded`: `offers.bulkDelete.successToast` `{{count}}` deleted.
    - `failed`: `offers.bulkDelete.errorToast` with the job's error
      summary.

  Selection is cleared on success.
- Empty states (via `_DataTable`'s built-in rendering):
  - No offers anywhere: heading "No offers yet", description
    "Vendors haven't published any offers on this marketplace yet.".
  - Filtered to empty: heading "No matching offers", description
    "Adjust filters or search terms.".

### Columns

| Header           | Accessor / Source                                                                          | Cell                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| (selection)      | `display: "select"`                                                                        | Checkbox (header + row), stops propagation                                                          |
| Seller           | `seller.name` (via `offer.seller` read-only link)                                          | `Avatar size="2xsmall"` + `<Text size="small" weight="plus">` truncated; subtitle = `seller.handle` |
| Variant          | `variant.thumbnail` + `variant.product.title` / `variant.title`                            | Thumbnail + truncated `<Text weight="plus">` + product subtitle                                     |
| SKU              | `sku`                                                                                      | Truncated monospaced text; `PlaceholderCell` if empty                                               |
| Price            | Cheapest visible `price_set.prices[*]` rendered as `formatAmount(amount, currency_code)`   | Discounted + strikethrough original when a `PriceList` row applies. `PlaceholderCell` if none      |
| Stock            | Effective stocked quantity (same computation as SPEC-003 list)                             | `StatusBadge` `in_stock` (green) / `low_stock` (orange) / `out_of_stock` (red) + numeric available  |
| Shipping profile | `shipping_profile.name`                                                                    | Text + profile type subtitle (`<Text size="xsmall" className="text-ui-fg-subtle">`)                 |
| Created          | `created_at`                                                                               | Relative date cell                                                                                  |
| (actions)        | `display: "actions"`                                                                       | Row `ActionMenu` (single action: Open seller)                                                       |

Stock computation reuses the helper introduced by SPEC-003
(`pages/offers/common/utils.ts → computeEffectiveStock`); the file
lives in the admin package's `pages/offers/common/utils.ts` and is
identical to the vendor copy. If duplication becomes a maintenance
burden, a future spec moves the helper into `@mercurjs/dashboard-shared`.

### Filters

`useOfferTableFilters` returns:

- **Seller** — multi-select async combobox backed by
  `sdk.admin.sellers.query`. Routes through `seller_id[]`.
- **Variant** — multi-select async combobox backed by
  `sdk.admin.products.query`; the helper expands selected products
  to their variant ids (client-side, then sends `variant_id[]`).
- **Shipping profile** — multi-select from
  `sdk.admin.shippingProfiles.query`.
- **Stock status** — fixed enum applied client-side (parity with
  SPEC-003 §Filters until the route exposes a server-side filter).
- **Created at** / **Updated at** — date range using the standard
  helper.

Ordering supports `sku`, `created_at`, `updated_at`. Default sort
is `created_at DESC`.

### Detail page (`/offers/:id`)

Layout: `TwoColumnPage<HttpTypes.AdminOfferResponse["offer"]>` with
`showJSON`, `showMetadata`, and an `<Outlet />` for nested routes
(currently empty — included for future audit-log expansion).

Main column (top to bottom, each `<Container className="divide-y p-0">`):

1. **General** — header row `<Heading>` "General" with **no action
   menu**. Body rows:
   - Seller — links to `/stores/${seller.id}`
   - SKU
   - Master variant — links to `/products/${variant.product_id}`
   - EAN / UPC — snapshot from the variant at create time
   - Created at / Updated at

2. **Pricing** — header row `<Heading>` "Pricing", no actions. Body
   is an embedded read-only table over `price_set.prices`:
   - Amount + currency (formatted)
   - Region (`PriceRule { region_id }`, "—" if none)
   - Customer group (`PriceRule { customer_group_id }`, "—" if none)
   - Min qty / Max qty
   - Price list (badge if the row belongs to a `PriceList`, "Base" otherwise)

3. **Inventory items** — header row `<Heading>` "Inventory items",
   no actions. Body: one row per `inventory_items[]` link entry,
   identical to the vendor detail page's rows but with the SKU /
   title cell linking to `/inventory/${id}` in the admin namespace.

4. **Audit log** — header row `<Heading>` "Audit log". Body: a
   compact list of `audit_log` entries returned by
   `GET /admin/offers/:id` (`{ at, actor, action, summary }`).
   - Each row: `<Text weight="plus">${action}</Text>`,
     `<Text size="small" className="text-ui-fg-subtle">${summary}</Text>`,
     and `<Text size="xsmall" className="text-ui-fg-muted">${formatDate(at)} · ${actor}</Text>`.
   - Empty state: "No audit entries yet.". The audit log is the
     primary reason this detail page exists at the admin level —
     vendors do not have one.

Sidebar column (right):

- **Status** card: effective stock badge + numeric available;
  soft-delete state if applicable.
- **Seller** card: avatar + name + handle; primary
  `Button variant="secondary" size="small" asChild` "Open seller"
  linking to `/stores/${seller.id}`.
- **Shipping profile** card: profile name + link to
  `/settings/shipping-profiles/${id}`.
- Default `MetadataSection` and `JsonViewSection`.

Loader: `loader.ts` calls
`sdk.admin.offers.$id.query({ $id, fields })` with the same field
list SPEC-003 uses, plus `audit_log` (the field is returned by
`GET /admin/offers/:id` only — vendor reads do not include it):

```
*price_set,*price_set.prices,*price_set.prices.price_rules,
*shipping_profile,*variant,*variant.product,
*seller,
*inventory_items,*inventory_items.inventory,
*inventory_items.inventory.location_levels,
audit_log
```

Errors `throw` so the route-level `ErrorBoundary` renders the fallback.

### Seller-scoped offer slice

The store detail page (`pages/stores/store-details`) gains a new
**Offers** section, modelled after the existing `StoreOrdersSection`
(`packages/admin/src/pages/stores/store-details/components/store-orders-section.tsx`).

```
pages/stores/store-details/components/store-offers-section.tsx
```

- `<Container className="divide-y p-0">`, header row "Offers" with
  the seller's offer count, a secondary `Button asChild`
  "View all" linking to `/offers?seller_id=${sellerId}`, and an
  `ActionMenu` carrying a single destructive action:
  - **Bulk delete catalog** → opens a confirmation prompt with
    `offers.bulkDeleteAll.description` and calls
    `useBulkDeleteOffersForSeller(sellerId)` with the full id set
    returned by the section's current query (or with the wildcard
    `{ all: true }` form once SPEC-002 documents one — until then
    the UI sends the explicit id array).
- Embedded `_DataTable` reusing the same column set as the main
  list (minus the Seller column, since the section is already
  scoped). Page size **10** (matches `StoreOrdersSection`'s
  precedent).
- Empty state: "This seller has no offers yet.".

This gives the operator a single place to triage a seller's catalog
without leaving the seller detail page.

## Data layer

### Hooks file

`packages/admin/src/hooks/api/offers.tsx` (new). Mirrors the
read-only shape of admin's existing per-domain hook files (e.g.
`hooks/api/sellers.tsx`):

```ts
import {
  queryClient,
  sdk,
  useMutation,
  useQuery,
  type ClientError,
  type InferClientInput,
  type InferClientOutput,
} from "@mercurjs/client"
import { queryKeysFactory } from "@mercurjs/dashboard-shared"

export const offerQueryKeys = queryKeysFactory("offer")

export const useOffers = (query, options) =>
  useQuery({
    queryKey: offerQueryKeys.list(query ?? {}),
    queryFn: () => sdk.admin.offers.query(query ?? {}),
    ...options,
  })

export const useOffer = (id, query, options) =>
  useQuery({
    queryKey: offerQueryKeys.detail(id, query),
    queryFn: () => sdk.admin.offers.$id.query({ $id: id, ...(query ?? {}) }),
    enabled: !!id,
    ...options,
  })

export const useBulkDeleteOffersForSeller = (sellerId, options) =>
  useMutation({
    mutationFn: async (offerIds) => {
      const { job_id } = await sdk.admin.sellers.$id.offers.bulkDelete.mutate({
        $id: sellerId,
        offer_ids: offerIds,
      })
      return job_id
    },
    onSuccess: (jobId, _ids, ctx) => {
      // Job polling is the caller's responsibility — the list page
      // pairs this mutation with a useJob(jobId) hook to display
      // progress and trigger invalidation on terminal state.
      options?.onSuccess?.(jobId, _ids, ctx)
    },
    ...options,
  })
```

Polling lives in the list-page component, not in the hook itself,
so the hook returns the `job_id` immediately and the UI subscribes
through a `useJob(jobId)` poller (or whatever job-poll helper admin
already uses for long-running operations; if none exists, a
`useEffect`-based interval is acceptable).

### SDK namespace

All calls go through `sdk.admin.*`. No `fetch` calls anywhere in
the page tree.

## Folder layout

```
packages/admin/src/pages/offers/
  index.ts                                 barrel
  offer-list-page.tsx                      compound root, SingleColumnPage hasOutlet
  components/
    offer-list-table/
      index.ts
      offer-list-table.tsx                 Container shell
      offer-list-header.tsx                title + (no CTA)
      offer-list-data-table.tsx            _DataTable wiring + bulk commands
      offer-actions.tsx                    row ActionMenu (Open seller)
      use-offer-table-columns.tsx
      use-offer-table-filters.tsx
      use-offer-table-query.tsx
  common/
    constants.ts                           PAGE_SIZE = 20, OFFER_IDS_KEY
    utils.ts                               computeEffectiveStock, getStockStatusProps
  offer-detail/
    index.ts
    offer-detail.tsx                       compound root, TwoColumnPage
    breadcrumb.tsx
    loader.ts
    components/
      offer-general-section.tsx
      offer-pricing-section.tsx
      offer-inventory-section.tsx
      offer-audit-log-section.tsx
      offer-shipping-section.tsx
      offer-status-sidebar.tsx
      offer-seller-sidebar.tsx
```

Plus the seller-detail addition:

```
packages/admin/src/pages/stores/store-details/components/
  store-offers-section.tsx                 (new)
```

## Variant-scoped UI to remove (admin)

This section is the deletion contract that pairs with the additions
above. It mirrors SPEC-003 §Variant-scoped UI to remove for the
admin package. Every entry is a current admin-panel concern that
SPEC-002 moves onto the offer and that this spec therefore deletes
from the variant-scoped surface. The admin panel is *not* the
authoring surface for offers (see **Scope and constraints**), so
the deletions here are pure removals — there is no "replaced by"
admin page; the relevant data lives on the new
`/offers` / `/offers/:id` pages, which are operator-readable only.

The new domain shape is:

```
product → variant → offers → prices & inventory_items
                              ↑
                              authored by the vendor (SPEC-003)
                              browsed by the operator (this spec)
```

The old shape (variant → prices + inventory_items + manage_inventory)
is structurally absent in the schema after SPEC-002's migrations.
Any admin UI that reads or writes those fields is dead code at best
and misleading the operator at worst (forms that submit values the
backend silently drops, tables that render `[]` for relations the
schema no longer populates).

### Differences vs SPEC-003 (vendor)

The admin tree mirrors the vendor tree almost 1:1, with two
exceptions:

- The admin package does **not** have an "edit stocks and prices"
  combined wizard (`packages/admin/src/pages/products/product-edit-stocks-and-prices/`
  does not exist; the equivalent vendor surface
  `packages/vendor/src/pages/products/[id]/edit-stocks-and-prices/`
  does and is deleted by SPEC-003). No equivalent admin deletion is
  required here.
- The admin per-seller offer slice is in **this spec** (see
  **Seller-scoped offer slice** above), whereas the vendor's offer
  list lives on its own top-level page. Both surfaces ship together.

### Routes to delete from `packages/admin/src/get-route-map.tsx`

| Path | Module under `packages/admin/src/pages/` | Replaced by |
| --- | --- | --- |
| `/products/:id/prices` | `products/product-prices/` | `/offers/:id` (read-only) — operators no longer edit variant prices |
| `/products/:id/stock` | `products/product-stock/` | `/offers/:id` (read-only) |
| `/products/:id/variants/:variant_id/prices` | reuses `products/product-prices/` | `/offers/:id` (read-only) |
| `/products/:id/variants/:variant_id/manage-items` | `product-variants/product-variant-manage-inventory-items/` | `/offers/:id` (read-only) — the `product_variant_inventory_item` link table is empty for Mercur-managed variants |

Removing these implies dropping the matching `lazy()` imports in
`packages/admin/src/get-route-map.tsx` at the lines flagged in the
companion grep:

- `products/product-prices` import at the product-scoped
  `path: "prices"` child.
- `products/product-stock` import at the product-scoped
  `path: "stock"` child.
- the second `products/product-prices` import at the
  variant-nested `path: "prices"` child.
- `product-variants/product-variant-manage-inventory-items` import
  at the variant-nested `path: "manage-items"` child.

Leave the parent `path: "variants/:variant_id"` route in place plus
its `edit` and `metadata/edit` children — the variant detail page
itself survives, only its prices / inventory subroutes go (see
**Detail and edit-form fields** below).

### Pages and components to delete

The following directories under `packages/admin/src/pages/` are
removed in their entirety:

- `products/product-prices/` (`product-prices.tsx`,
  `pricing-edit.tsx`).
- `products/product-stock/` (`product-stock.tsx`, `loader.ts`,
  `schema.ts`, `utils.ts`, `components/`, `hooks/`).
- `product-variants/product-variant-detail/components/variant-prices-section/`
  (the right-sidebar "Prices" section on variant detail).
- `product-variants/product-variant-detail/components/variant-inventory-section/`
  (the main-column "Inventory items" section on variant detail,
  plus its `inventory-actions.tsx` row menu and
  `use-inventory-table-columns.tsx`).
- `product-variants/product-variant-manage-inventory-items/` (the
  full-screen modal that edits the
  `product_variant_inventory_item` link — the link table is empty
  for marketplace variants under SPEC-002 and the admin has no
  per-offer authoring surface to replace it).
- `products/product-create/components/product-create-inventory-kit-form/`
  (the **Inventory** tab in the admin product create wizard — see
  the per-tab list below for the exact knobs it carries).

### Row actions and bulk commands to delete

On `pages/products/product-detail/components/product-variant-section/product-variant-section.tsx`:

- Drop the row **"Edit prices"** action
  (`label: t("products.editPrices")`, `to: "prices"`,
  `icon: <PencilSquare />`).
- Drop the row **"Manage stock"** action
  (`label: t("inventory.stock.action")`, `to: "stock"`,
  `icon: <Buildings />`).
- Drop the bulk command **`useCommands` →
  `inventory.stock.action`** (`shortcut: "i"`, navigates to
  `stock?${PRODUCT_VARIANT_IDS_KEY}=...`).
- Drop the `mainActions.push(...)` branches under the
  `inventoryItemsCount === 1` and `inventoryItemsCount > 1` cases
  (`products.variant.inventory.actions.inventoryItems` /
  `products.variant.inventory.actions.inventoryKit`). The
  `variant.inventory_items` array is `[]` for every Mercur-managed
  variant under SPEC-002, so the branches are dead code.

After the deletions the variants table row ActionMenu keeps only
**Edit variant** (drawer) and **Delete variant** (prompt), and the
table-level ActionMenu (the dropdown next to the heading) is empty
— remove the `actionMenu` prop entirely from the
`DataTable` call.

### Detail and edit-form fields to delete

`pages/product-variants/product-variant-detail/product-variant-detail.tsx`:

- Drop the `VariantPricesSection` import and the sidebar slot.
- Drop the `VariantInventorySectionConnected` import and the
  main-column slot.
- Update the compound exports (`MainInventorySection`,
  `SidebarPricesSection`) accordingly — drop them from the
  `Object.assign(...)` block so downstream blocks cannot accidentally
  re-mount the deleted components.
- The variant detail page becomes a single-section page hosting the
  general section only.

`pages/product-variants/product-variant-edit/components/product-edit-variant-form/product-edit-variant-form.tsx`:

- Drop the `manage_inventory` and `allow_backorder` fields from the
  zod schema, the form defaults, and the `useForm` payload (lines
  ~37–38, ~88–89, ~114–115, ~136–137).
- Drop the two `Form.Field` blocks that render them (lines around
  the `name="manage_inventory"` and `name="allow_backorder"`
  controls, ~377 and ~416).
- The edit drawer keeps the remaining identity fields (title, SKU,
  options, attribute axes, EAN / UPC, weight / dimensions, custom
  metadata).

`pages/products/product-create-variant/components/create-product-variant-form/`:

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
  `inventory_kit`, `prices`, and `inventory` keys from the
  `CreateProductVariantSchema`.

### Product-create wizard knobs to delete

`pages/products/product-create/components/product-create-variants-form/product-create-variants-form.tsx`:

- Drop the `manage_inventory`, `allow_backorder`, and
  `inventory_kit` columns from the variants DataGrid.
- Drop the `createDataGridPriceColumns(...)` spread that adds the
  per-currency / per-region price columns. The variants tab keeps
  only Attributes, Title, and SKU columns.

`pages/products/product-create/components/product-create-form/product-create-form.tsx`:

- Drop the `ProductCreateInventoryKitForm` import and its entry in
  `defaultTabs`.
- Drop the `transformTabs` branch that toggles the `inventory` tab
  on/off based on `watchedVariants.some(v => v.manage_inventory && v.inventory_kit)`.
- The admin product-create wizard's tab set reduces to: Details →
  Organize → Attributes → Variants.

`pages/products/product-create/constants.ts` / `types.ts`:

- Drop the `inventory_kit`, `manage_inventory`, `allow_backorder`,
  and per-variant `prices` keys from the wizard schema and the type
  alias.

`pages/products/product-create/utils.ts`:

- Drop the `normalizeProductFormValues` branches that compute price
  payloads for each variant and that flip `manage_inventory: true`
  when the inventory kit is seeded. The admin
  `POST /admin/products` payload no longer carries those fields on
  Mercur (Medusa's admin product routes are already disabled by
  `patch-medusa.ts` per SPEC-002 §patch-medusa.ts, but the form
  payload is still consumed by an internal product create flow and
  should not submit the dropped fields).

### i18n keys to remove from `packages/admin/src/i18n/translations/en.json`

These keys (and their sister-locale equivalents) are dropped as part
of the per-locale sweep. Exhaustive for the deletions above; verify
with a grep across `packages/admin/src` before merging:

- `products.editPrices`
- `inventory.stock.action` (admin-side only; SPEC-004's offer
  surface introduces no equivalent because admin is read-only)
- `products.stock.*` (heading, description, columns, the
  `product-stock` route's i18n keys)
- `products.variant.pricesPagination`
- `products.variant.inventory.*` (`manageItems`, `manageKit`,
  `notManagedDesc`, `actions.inventoryItems`,
  `actions.inventoryKit`)
- `products.create.tabs.inventory` (the product-create inventory
  kit tab label)

Keep `inventory.*` keys that pertain to the standalone `/inventory`
page tree — those are unrelated and the surface stays in full.

### What stays

These admin variant-scoped surfaces survive because their concern is
identity / catalog, not commerce:

- The standalone variant create flow at
  `/products/:id/variants/create` keeps the **Details** tab so an
  operator can still create a master variant. Master variant
  creation is the only way to seed a new SKU into the catalog that
  a vendor's offer can later bind to.
- The variant edit drawer at
  `/products/:id/variants/:variant_id/edit` keeps title, options,
  attribute axes, SKU (master-catalog identifier per SPEC-002),
  EAN/UPC, weight / dimensions, and custom metadata.
- The product variant section on product detail keeps its variant
  list with **Edit variant** + **Delete variant** row actions and
  the standard date / option / attribute columns.
- The `/inventory` page tree stays in full. Inventory items are
  seller-owned first-class entities; the admin browses them
  unchanged. The admin offer detail page links to
  `/inventory/${id}` from its read-only Inventory items section.
- The product-prices admin surface for **Price Lists** (under
  `/price-lists/...`) stays — price-list-scoped pricing is a
  separate concern from per-variant pricing and is consumed by
  offers through the standard pricing module rule resolution per
  SPEC-002 §Pricing Architecture.

### Why the deletions land in this spec rather than SPEC-002

Same rationale as SPEC-003: SPEC-002 owns the schema migration, the
cart-pricing rewrite, and the workflows. It does not own the admin
panel. Splitting the UI deletions into SPEC-004 keeps SPEC-002's
diff scoped to backend code and keeps the admin UI churn (route
map, page deletions, i18n keys, deleted compound-export slots)
inside one reviewable spec.

Both halves ship together: shipping SPEC-002 without SPEC-003 /
SPEC-004 leaves both dashboards showing prices / inventory fields
that the backend silently drops, which is worse than either half
alone.

### Paired backend deletions (not owned by this spec)

Same as SPEC-003: the admin UI deletions above pair with backend
deletions owned by SPEC-002:

- `manage_inventory` and `allow_backorder` columns dropped from
  `ProductVariant` (`Migration20260421093258`,
  `Migration20260422105949`).
- `createProductVariantsWorkflow` override no longer wires
  `inventory_items` to the variant; the
  `product_variant_inventory_item` link table is empty for every
  Mercur-managed variant.
- Master variants no longer carry a `prices` field; each offer owns
  its own `PriceSet`.

## Route map registration

`packages/admin/src/get-route-map.tsx` adds the page tree under the
`main` bucket (handled by `<ProtectedRoute><MainLayout>`):

```tsx
{
  path: "/offers",
  lazy: () => import("./pages/offers").then((m) => ({ Component: m.OfferListPage })),
  children: [
    {
      path: ":id",
      lazy: () => import("./pages/offers/offer-detail"),
      handle: { breadcrumb: BreadcrumbFromLoader },
      loader: (...args) =>
        import("./pages/offers/offer-detail/loader").then((m) => m.loader(...args)),
    },
  ],
},
```

No `create`, `edit`, `pricing`, or `inventory` child routes — the
admin surface is read-only.

## Compound exports

```ts
export const OfferListPage = Object.assign(Root, {
  Table: OfferListTable,
  Header: OfferListHeader,
  HeaderTitle: OfferListTitle,
  HeaderActions: OfferListActions,           // empty by default; here so blocks can extend
  DataTable: OfferListDataTable,
})

export const OfferDetailPage = Object.assign(Root, {
  General: OfferGeneralSection,
  Pricing: OfferPricingSection,
  Inventory: OfferInventorySection,
  AuditLog: OfferAuditLogSection,
  Shipping: OfferShippingSection,
  StatusSidebar: OfferStatusSidebar,
  SellerSidebar: OfferSellerSidebar,
})
```

## i18n keys

Added to `packages/admin/src/i18n/translations/en.json` first;
sister locale files updated as part of the per-locale sweep. Many
keys overlap with SPEC-003's vendor namespace (e.g. `offers.domain`,
`offers.fields.*`, `offers.stockStatus.*`). Those overlap is fine —
admin and vendor each ship their own translation files and do not
share namespaces.

```
"offers": {
  "domain": "Offers",
  "subtitle": "Browse every offer across all sellers",
  "list": {
    "empty": {
      "heading": "No offers yet",
      "description": "Vendors haven't published any offers on this marketplace yet."
    },
    "filtered": {
      "heading": "No matching offers",
      "description": "Adjust filters or search terms."
    }
  },
  "detail": {
    "general": "General",
    "pricing": "Pricing",
    "inventory": "Inventory items",
    "auditLog": "Audit log",
    "auditLog.empty": "No audit entries yet.",
    "shipping": "Shipping profile",
    "openSeller": "Open seller"
  },
  "bulkDelete": {
    "description": "You are about to delete {{count}} offer(s) from {{sellerName}}. This cannot be undone.",
    "successToast": "Deleted {{count}} offer(s)",
    "errorToast": "Bulk delete failed: {{message}}",
    "crossSellerWarning": "Select offers from one seller at a time. Bulk delete is scoped per seller."
  },
  "bulkDeleteAll": {
    "description": "You are about to delete every offer for {{sellerName}}. This cannot be undone.",
    "actionLabel": "Delete catalog"
  },
  "sellerSection": {
    "heading": "Offers",
    "viewAll": "View all",
    "empty": "This seller has no offers yet."
  },
  "actions": {
    "openSeller": "Open seller",
    "bulkDelete": "Delete selected"
  },
  "fields": {
    "seller": "Seller",
    "sku": "SKU",
    "variant": "Master variant",
    "shippingProfile": "Shipping profile",
    "ean": "EAN",
    "upc": "UPC",
    "requiredQuantity": "Required quantity",
    "stockStatus": "Stock status",
    "createdAt": "Created at",
    "updatedAt": "Updated at"
  },
  "stockStatus": {
    "in_stock": "In stock",
    "low_stock": "Low stock",
    "out_of_stock": "Out of stock"
  }
}
```

## Verification

1. `bun install && bun run build` succeeds with the new pages and
   hooks (`packages/admin` compiles cleanly with `bun run lint`).
2. With a seeded marketplace (at least two sellers, each with one
   product variant and one offer), log into the admin panel as an
   operator.
   1. Sidebar shows **Offers** nested under Products.
   2. `/offers` renders both sellers' offers in one list. No
      "Create offer" CTA is present in the header.
3. List interactions:
   1. Filter by Seller → only that seller's offers remain.
   2. Filter by Variant → list filters correctly.
   3. Search by partial `sku` → list filters correctly.
   4. Sort by `updated_at DESC` → most recent on top.
4. Bulk delete:
   1. Select two rows from seller A. Bulk-delete command is
      enabled. Click it, confirm in the prompt. The list polls the
      job, then toasts `offers.bulkDelete.successToast` with
      `count = 2` and clears selection. Both rows vanish.
   2. Try to select a row from seller A together with a row from
      seller B. The cross-seller toast warns and the bulk-delete
      command stays disabled.
5. Detail page:
   1. From the list, click a row. Detail page renders General,
      Pricing, Inventory items, Audit log, plus the sidebar Status
      / Seller / Shipping cards.
   2. Audit log shows at least the `created` entry.
   3. No edit / delete / manage-prices / manage-inventory affordances
      are present.
   4. "Open seller" CTA navigates to `/stores/${seller.id}`.
6. Seller-scoped slice:
   1. On `/stores/${seller.id}`, the **Offers** section renders that
      seller's offers (paginated at 10). "View all" navigates to
      `/offers?seller_id=${sellerId}` and the list applies the
      seller filter.
   2. The section's `ActionMenu` exposes **Delete catalog**.
      Triggering it (and confirming the prompt) bulk-deletes every
      offer for that seller. After the job succeeds the section
      empties out with the empty-state copy.
7. Integration tests: the admin contracts (`GET /admin/offers`,
   `GET /admin/offers/:id`, `POST /admin/sellers/:id/offers/bulk-delete`)
   are already covered by the existing offer suites referenced in
   SPEC-002 §Testing. This spec's verification rides on top of
   those. If a Playwright suite is introduced for the admin panel,
   add a smoke test that walks step 2 → step 6 above and asserts
   the rendered DOM via the `data-testid` attributes listed below.
8. **Deletion checks (paired with Variant-scoped UI to remove (admin)):**
   1. The admin product detail page no longer renders an "Edit
      prices" or "Manage stock" row action in the variants table
      ActionMenu, and the bulk command bar no longer surfaces a
      stock shortcut. The variants table's heading-level
      `actionMenu` prop is gone.
   2. Navigating directly to `/products/<id>/prices`,
      `/products/<id>/stock`,
      `/products/<id>/variants/<variant_id>/prices`, or
      `/products/<id>/variants/<variant_id>/manage-items` surfaces
      the route-level 404 — the modules and their `lazy()`
      registrations are gone from
      `packages/admin/src/get-route-map.tsx`.
   3. The admin product create wizard's tab set is Details →
      Organize → Attributes → Variants (no Inventory tab is
      reachable; the `transformTabs` branch is gone and
      `ProductCreateInventoryKitForm` is no longer imported).
   4. The variants DataGrid inside the admin product create wizard
      renders only Attributes / Title / SKU columns. Per-currency
      price columns and `manage_inventory` / `allow_backorder` /
      `inventory_kit` toggles are gone.
   5. The standalone admin variant create wizard
      (`/products/<id>/variants/create`) renders only the Details
      tab. Pricing and Inventory kit tabs are gone.
   6. The admin variant detail page
      (`/products/<id>/variants/<variant_id>`) renders only the
      General section in the main column. No Prices sidebar
      section, no Inventory items main-column section, no
      "Manage items" / "Manage kit" action menu entries. The
      compound exports `MainInventorySection` and
      `SidebarPricesSection` are gone from
      `ProductVariantDetailPage`'s `Object.assign(...)`.
   7. The admin variant edit drawer no longer shows
      `manage_inventory` or `allow_backorder` switches.
   8. `grep -R "products.editPrices\|products.stock\|products.variant.pricesPagination\|products.variant.inventory\|products.create.tabs.inventory" packages/admin/src` returns no matches.

### data-testid attributes

Each interactive element on the new pages and the seller section
carries a kebab-case `data-testid`:

- `offer-list-table`, `offer-list-row-${id}`,
  `offer-list-action-menu-${id}`, `offer-list-bulk-delete`,
  `offer-list-cross-seller-warning`.
- `offer-detail-{general,pricing,inventory,audit-log,shipping,status,seller}-section`.
- `offer-detail-open-seller-button`.
- `store-offers-section`, `store-offers-section-view-all`,
  `store-offers-section-bulk-delete`.

## Evidence

To be filled in once the spec is implemented:

- **Implemented at:** _TBD_
- **Source:** `packages/admin/src/pages/offers/...`,
  `packages/admin/src/pages/stores/store-details/components/store-offers-section.tsx`,
  hooks in `packages/admin/src/hooks/api/offers.tsx`, route
  registration in `packages/admin/src/get-route-map.tsx`, sidebar
  update in
  `packages/admin/src/components/layout/main-layout/main-layout.tsx`.
- **Translations:**
  `packages/admin/src/i18n/translations/en.json` + sister locale
  files.
- **Build artifact:** admin Vite dev server (`bun run dev`) renders
  every step in **Verification** without console errors.
- **Test run pending:** record the Playwright run id + the
  pre-existing admin offer suite run ids referenced in
  SPEC-002 §Testing.

## Notes

### Why this spec is separate from SPEC-003

Vendor and admin surfaces share the offer module but **do not share
a UI surface**. They differ in:

- SDK namespace (`sdk.vendor.*` vs `sdk.admin.*`).
- Scope (single-seller catalog vs marketplace-wide).
- Write affordances (full CRUD vs read-only + scoped bulk-delete).
- Audit log visibility (admin-only field on `GET /admin/offers/:id`).

A combined spec would obscure those differences. Splitting them
keeps each scope unambiguous and avoids cross-coupling between two
dashboards that already ship from independent packages.

### Cross-seller selection constraint

The bulk-delete endpoint is `POST /admin/sellers/:id/offers/bulk-delete`
— **single-seller scoped**. The UI surfaces a friendly client-side
constraint instead of attempting to dispatch one request per seller
behind the scenes, because:

- Fanning out per seller introduces partial-failure UX a single
  toast can't cleanly summarize, and admins are likelier than
  vendors to be operating on a single seller anyway.
- The endpoint returns a `job_id` and runs asynchronously, so
  spawning N parallel jobs would require N concurrent pollers.
  Avoidable complexity for a corner case.

If marketplace operators ever ask for cross-seller bulk delete in
real volume, the right path is a server-side
`POST /admin/offers/bulk-delete` that does the fan-out under one
job id. Recorded as a follow-up; not added to this spec.

### Audit log shape

SPEC-002 §Endpoint Contracts states that
`GET /admin/offers/:id` returns `{ offer, audit_log: AuditEntry[] }`
but does not nail the `AuditEntry` shape. This spec assumes
`{ at: string, actor: string, action: string, summary: string }`
based on the conventional admin audit-log shape elsewhere in the
codebase (e.g. payouts). If the SPEC-002 implementation lands a
different shape, update the section component to match and bump
this spec's `last_updated`.

### Field-list duplication with SPEC-003

The loader's `fields` string is intentionally similar to the
vendor detail loader's. The two pages render the same data
relations, plus `audit_log` on the admin side. Keep them in sync
when the offer module's field shape changes — a regression on one
will usually need the other patched too.

### Read-only stance

The intentional read-only stance is the most important non-obvious
constraint in this spec. A future contributor adding "just a small
edit form for the operator to fix a vendor's typo" would re-open
the door SPEC-002 deliberately closed. If a real need arises (e.g.
operator-driven moderation, compliance edits), it belongs in a
follow-up canonical product spec — not a quiet inline UI addition.

The variant-scoped UI deletions reinforce this stance: every admin
write that used to land on a Mercur-managed variant's `prices`,
`manage_inventory`, `allow_backorder`, or inventory-item link
graph is gone. After this spec ships, the only admin write actions
that touch offer-adjacent state are bulk-delete (this spec) and
master-variant identity edits (unchanged). If the deletion list
above is incomplete and a stray variant-scoped write path remains,
treat it as a SPEC-002 invariant violation, not a UI bug.

### Out of scope

- Operator-initiated offer suspension / reactivation — deferred per
  SPEC-002 §Storefront API Surface.
- CSV / feed import of offers across the marketplace — explicitly
  excluded in SPEC-002.
- Per-offer manual price overrides by admins — see **Read-only stance**.
- The storefront buy-button binding — owned by SPEC-005 (storefront UI).
- Vendor-facing offer CRUD — owned by SPEC-003.
