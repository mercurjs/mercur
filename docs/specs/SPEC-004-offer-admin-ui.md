---
status: passing
canonical: false
priority: 4
area: admin/offers
created: 2026-05-20
last_updated: 2026-05-22
revision: "2026-05-22 Status flipped to passing — admin offer UI shipped: read-only list + detail (TwoColumnPage with General + Inventory items main column, Product variant + Store + Prices sidebar), bulk delete via Promise.allSettled fan-out across DELETE /admin/offers/:id. Master-variant heading aligned to vendor's 'Product variant'. Subtitle and audit-log section removed per design pass. Store column and per-row Open store action dropped; the store sidebar card stays. Variant-scoped UI removal section + per-seller bulk-delete endpoint deferred."
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
store. The operator can search, filter (notably by store and
shipping profile), sort, paginate, and open a single offer's detail
page. The detail page renders the same shape the vendor sees plus a
**Store** sidebar card and an **Audit log** main-column section. The
only mutation available is bulk-delete, surfaced both on the list
page (for offers selected on a single store) and on the store detail
page (for that store's full catalog).

Every visible string on the new pages is wired through `t("…")`
against the keys listed in the **i18n keys** section. No literal
strings are rendered in component JSX — this is enforced by the
admin-form-ui / admin-page-ui review skills the package already
runs.

The screen vocabulary mirrors SPEC-003's **shipped** vendor surface
(`packages/vendor/src/pages/offers/`), not the older first-cut
sections of that spec. Section names, file names, column sets,
ordering, page size, and helper hooks all line up with the vendor
realignment block — adapted for read-only access and adding the
admin-only **Store** column / filter / sidebar card.

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

**File map:** `packages/admin/src/pages/offers/offer-list-page.tsx`
+ `_components/*` + `common/constants.ts`. Folder shape mirrors
SPEC-003 §Folder layout — actual.

- Layout: `SingleColumnPage` + one
  `<Container className="divide-y p-0">` wrapping the
  `OfferListHeader` and `OfferListDataTable` shells.
- **Header row** (`OfferListHeader`): single
  `<Heading>{t("offers.domain")}</Heading>` left-aligned. **No
  primary CTA** — admin cannot create offers. (Differs from the
  vendor header which has the **Create** button.) Optional subtitle
  `<Text className="text-ui-fg-subtle">{t("offers.subtitle")}</Text>`
  is wired but blank by default so the page matches the vendor
  layout density.
- Search bar, sort menu, pagination, filter popover, and bulk
  command bar wired through the existing `_DataTable` primitive used
  by `StoreListDataTable`. Page size **`OFFERS_PAGE_SIZE = 10`**
  declared in `pages/offers/common/constants.ts` — matches the
  shipped vendor value (SPEC-003 §Realignment).
  `keepPreviousData: true` on the underlying query.
- Row navigation: `navigateTo={(row) => row.id}` opens the detail
  page. The select-cell checkbox calls `e.stopPropagation()` so
  selection doesn't trigger row navigation (parity with
  SPEC-003).
- Per-row `ActionMenu` (rightmost column) carries a single action:
  - **Open store** — `to: "/stores/${seller.id}"`, icon
    `<BuildingStorefront />`, label `t("offers.actions.openStore")`.
    Edit / Delete / Manage prices / Manage inventory are
    intentionally absent — see **Scope and constraints**.
- Bulk selection: `enableRowSelection: true` on `useDataTable`,
  selection persisted across pagination via a controlled
  `RowSelectionState`. **Cross-store constraint:** selection is
  only allowed across rows belonging to the same store. When the
  operator's pointer click would extend a selection across stores,
  `onRowSelectionChange` rejects the new selection and surfaces an
  inline `toast.warning(t("offers.bulkDelete.crossStoreWarning"))`.
  The bulk-delete command is also `disabled` when the live
  selection spans more than one `seller_id` (tooltip
  `t("offers.bulkDelete.crossStoreTooltip")`).
- Bulk command (rendered by `_DataTable` when at least one row is
  selected):
  - **Delete selected** — label `t("offers.actions.bulkDelete")`,
    shortcut `d`, icon `<Trash />`. Opens `usePrompt` with
    `{ title: t("general.areYouSure"), description: t("offers.bulkDelete.description", { count, storeName }), confirmText: t("actions.delete"), cancelText: t("actions.cancel"), variant: "danger" }`,
    then calls
    `useBulkDeleteOffersForSeller(sellerId).mutateAsync(offerIds)`
    which dispatches
    `POST /admin/sellers/:id/offers/bulk-delete`.
  - The endpoint returns `202 { job_id }`. The list component pairs
    the mutation with a `useJob(jobId)` poller (or the equivalent
    helper admin already uses for long-running operations — if none
    exists, a `useEffect`-based 2-second interval is acceptable).
    On terminal state the poller invalidates
    `offerQueryKeys.lists()`, clears the selection, and toasts:
    - `succeeded`: `toast.success(t("offers.bulkDelete.successToast", { count }))`.
    - `failed`: `toast.error(t("offers.bulkDelete.errorToast", { message }))`.
- Empty states (consumed via `_DataTable`'s `noRecords` /
  `noResults` slots, exactly like SPEC-003):
  - No offers anywhere:
    `noRecords={{ title: t("offers.empty.heading"), message: t("offers.empty.description") }}`.
    No CTA (admin cannot create — the action is omitted, unlike
    the vendor version that wires a **Create** button).
  - Filtered-empty:
    `noResults={{ title: t("offers.filtered.heading"), message: t("offers.filtered.description") }}`.

### Columns

**File:** `_components/use-offer-table-columns.tsx`. Column set
mirrors SPEC-003's **shipped** vendor list (Realignment block) with
one admin-only addition — the **Store** column — placed between
`select` and `title`:

| id | Header i18n key | Source | Cell |
| --- | --- | --- | --- |
| `select` | (none) | `display: "select"` | Checkbox header + row; `e.stopPropagation()` on row checkbox. |
| `store` | `t("offers.fields.store")` | `seller.name`, `seller.handle` | `Avatar size="2xsmall" fallback={seller.name?.[0]}` + `<Text size="small" weight="plus">{seller.name}</Text>` with subtitle `<Text size="xsmall" className="text-ui-fg-subtle">{seller.handle}</Text>`. `PlaceholderCell` if `seller` is missing. **Admin-only column** — no vendor equivalent. |
| `title` | `t("fields.title")` | `product_variant.title`, `product_variant.product.thumbnail`, `product_variant.product.title` | 24×24 `<Thumbnail src={product?.thumbnail} />` + truncated `<Text size="small" weight="plus" leading="compact">{variant.title}</Text>` with the product title carried in the cell's `title=` attribute (parity with vendor). |
| `categories` | `<CategoryHeader />` | `product_variant.product.categories` | `<CategoryCell categories={categories} />` (lifted from `components/table/table-cells/product/category-cell`). |
| `sku` | `t("offers.fields.sku")` | `offer.sku` | Truncated `<Text size="small" leading="compact">`; `PlaceholderCell` if empty. |
| `shipping_profile` | `t("shippingProfile.domain")` | `shipping_profile.name` | Truncated `<Text size="small" leading="compact">`; `PlaceholderCell` if empty. |
| `status` | `<ProductStatusHeader />` | `product_variant.product.status` | `<ProductStatusCell status={status} />`. |
| `actions` | (none) | `display: "actions"` | Row `ActionMenu` with the single **Open store** action above. |

Notes:

- The **Store** column is the only structural addition vs the
  vendor column set. Position is `select → store → title → …` so
  the store is the first identifying piece of data the operator
  sees on every row.
- No Price / Stock / Created column — same rationale as SPEC-003
  shipped: those concerns surface on the detail page, not the
  list.
- Every header string goes through `t(…)`. No literal text.

### Filters

**File:** `_components/use-offer-table-filters.tsx`. Filter set
mirrors SPEC-003's **shipped** vendor filters plus the admin-only
**Store** filter:

- **Store** — `type: "select"`, `key: "seller_id"`, `multiple: true`,
  `searchable: true`. Options backed by
  `useSellers({ limit: 1000 })` → each `{ value: seller.id, label: seller.name ?? seller.id }`.
  Label `t("offers.fields.store")`. **Admin-only filter** — no
  vendor equivalent.
- **Shipping profile** — `type: "select"`, `key: "shipping_profile_id"`,
  `multiple: true`, `searchable: true`. Options backed by
  `useShippingProfiles({ limit: 1000 })`. Label
  `t("shippingProfile.domain")`. (Direct port from SPEC-003.)
- **SKU** — `type: "string"`, `key: "sku"`. Label
  `t("offers.fields.sku")`. (Direct port from SPEC-003.)
- **Created at** — `type: "date"`, `key: "created_at"`. Label
  `t("fields.createdAt")`.
- **Updated at** — `type: "date"`, `key: "updated_at"`. Label
  `t("fields.updatedAt")`.

Variant filter and Stock-status filter from the older draft are
**not** included — same rationale as SPEC-003 §Realignment
(variant filter is a round-trip the admin doesn't need; stock
status would require a client-side aggregate the offer module
doesn't expose). Both are recorded under **Known follow-ups**.

### Sort menu

**File:** `_components/offer-list-data-table.tsx`. The `orderBy`
prop on `_DataTable` carries three keys — same shape as the
shipped vendor list:

```tsx
orderBy={[
  { key: "title",      label: t("fields.title") },
  { key: "created_at", label: t("fields.createdAt") },
  { key: "updated_at", label: t("fields.updatedAt") },
]}
```

Default sort: `created_at DESC` (admin operators almost always want
"newest first" across the marketplace). The `title` key is wired
through `order=` but the backend offers list route does not yet
expose a title column — known follow-up under SPEC-002 query
params, same caveat as the vendor side carries.

### Detail page (`/offers/:id`)

**File map:** `packages/admin/src/pages/offers/[id]/offer-detail-page.tsx`
+ `_components/{offer-general-section,offer-inventory-section,offer-pricing-section,offer-variant-section,offer-store-sidebar,offer-audit-log-section}.tsx`
+ `loader.ts` + `breadcrumb.tsx`. Folder shape mirrors SPEC-003's
shipped detail folder — admin adds two extra section files
(`offer-store-sidebar.tsx`, `offer-audit-log-section.tsx`).

- Layout: `TwoColumnPage<OfferDetail>` with `hasOutlet`,
  `data={typedOffer}`, and `showJSON` / `showMetadata` **omitted**
  (defaults to false) — matches SPEC-003 §Realignment. The JSON
  viewer + metadata footer do not render on this page.
- Page heading is the **variant title**
  (`offer.product_variant?.title`), with `data-testid="offer-detail-general-section"`
  on the General container — parity with SPEC-003 §Realignment, not
  the older "page title is the SKU" draft.

**Main column** (top to bottom, each
`<Container className="divide-y p-0">`):

1. **General** (`_components/offer-general-section.tsx`):
   - Header row: `<Heading title={variantTitle}>{variantTitle}</Heading>`.
     Kit icon (`<Component />`) renders next to the heading when
     `inventory_item_link.length > 1` (parity with vendor).
   - **No action menu.** Admin is read-only. The vendor's Edit +
     Delete menu is omitted entirely from this section header.
   - Body `SectionRow`s in this order:
     - `t("offers.fields.store")` → `seller.name` rendered as a
       `<Link to="/stores/${seller.id}">` inside the row value.
       Admin-only row; vendor's General section has no store row.
     - `t("offers.fields.sku")` → `offer.sku ?? "-"`.
     - `t("offers.fields.ean")` → `offer.ean ?? "-"`.
     - `t("offers.fields.upc")` → `offer.upc ?? "-"`.
     - `t("shippingProfile.domain")` → `offer.shipping_profile?.name ?? "-"`.
     - `t("fields.createdAt")` → formatted via `Intl.DateTimeFormat`
       (same helper SPEC-003 §Realignment uses).
     - `t("fields.updatedAt")` → same.

2. **Inventory items** (`_components/offer-inventory-section.tsx`):
   - Header row:
     `<Heading level="h2">{t("offers.detail.inventoryItems")}</Heading>`.
     **No action menu.** The vendor's `Manage inventory` action is
     not exposed to the admin.
   - Body: `_DataTable` over `inventory_item_link[].inventory_item`,
     columns `t("fields.title")` / `t("offers.fields.sku")` /
     `t("offers.fields.requiredQuantity")` / `t("inventory.available")` /
     `actions`. The actions cell carries a single
     `t("offers.detail.goToInventoryItem")` row action that
     navigates to `/inventory/${inventory_item.id}` (admin
     namespace). Inventory cell renders in `text-ui-fg-error` when
     summed `available_quantity === 0`. Same shape as SPEC-003
     §Realignment, just under `sdk.admin.*`.

3. **Audit log** (`_components/offer-audit-log-section.tsx`) —
   **admin-only section, no vendor equivalent.**
   - Header row:
     `<Heading level="h2">{t("offers.detail.auditLog")}</Heading>`.
     No action menu.
   - Body: a compact list of `audit_log` entries returned by
     `GET /admin/offers/:id`. Each entry assumed
     `{ at, actor, action, summary }` (see **Audit log shape** in
     Notes — if SPEC-002 lands a different shape, update the
     section).
   - Row layout:
     `<Text weight="plus">{action}</Text>`,
     `<Text size="small" className="text-ui-fg-subtle">{summary}</Text>`,
     `<Text size="xsmall" className="text-ui-fg-muted">{formatDate(at)} · {actor}</Text>`.
   - Empty state: `t("offers.detail.auditLogEmpty")`.

**Sidebar column** (top to bottom):

1. **Master variant** (`_components/offer-variant-section.tsx`) —
   identical shape to SPEC-003 §Realignment: single clickable card
   lifted from the admin `InventoryItemVariantsSection` Pattern A.
   Card contents: `<Thumbnail src={variant.product?.thumbnail} />`,
   title `variant.product?.title ?? variant.title`, subtitle
   joining `variant.options?.map(o => o.value)` with `⋅`, trailing
   `<TriangleRightMini />` chevron. Card wrapper:
   `<Link to="/products/${variant.product_id}/variants/${variant.id}">`.
   Section header
   `<Heading level="h2">{t("offers.detail.masterVariant")}</Heading>`,
   no action menu.

2. **Store** (`_components/offer-store-sidebar.tsx`) —
   **admin-only section, no vendor equivalent.** Single card
   following the same Pattern A shape as the Master variant card so
   the sidebar reads as two stacked profile cards. Card contents:
   - `<Avatar size="small" fallback={seller.name?.[0]}>` (the
     seller module already carries an optional avatar; fall back
     to the initial letter when missing).
   - Title row: `seller.name`.
   - Subtitle row: `seller.handle`.
   - Trailing `<TriangleRightMini />` chevron.
   - Wrapper: `<Link to="/stores/${seller.id}">`.

   Section header
   `<Heading level="h2">{t("offers.detail.store")}</Heading>`, no
   action menu. `data-testid` set:
   `offer-detail-store-sidebar`, `offer-detail-store-link`,
   `offer-detail-store-avatar`, `offer-detail-store-name`,
   `offer-detail-store-handle`.

3. **Prices** (`_components/offer-pricing-section.tsx`) — identical
   shape to SPEC-003 §Realignment: collapsible list of currency /
   amount rows, **`PAGE_STEP = 3`** visible initially, `Show more`
   (label `t("actions.showMore")`) reveals 3 at a time. Filters out
   price ladders whose `rules_count > 0`. Section header
   `<Heading level="h2">{t("labels.prices")}</Heading>`. **No
   action menu** — admin cannot edit prices.

The older Status / Shipping / JSON / Metadata sidebar sections from
the first-cut draft are **not** included — matches SPEC-003
§Realignment. Stock status surfaces inside the Inventory table's
`Inventory` cell (red when `available === 0`); shipping profile
collapses into a `SectionRow` inside General; metadata + JSON
viewer are not rendered because `showJSON` / `showMetadata` are
omitted from the `TwoColumnPage`.

**Loader (`[id]/loader.ts`)** calls
`sdk.admin.offers.$id.query({ $id, fields: OFFER_DETAIL_FIELDS })`.
The `OFFER_DETAIL_FIELDS` constant in `common/constants.ts` is an
explicit comma-joined column list (not a wildcard string) — same
shape SPEC-003 §Realignment uses for the vendor loader, plus the
admin-only additions:

```
id,sku,ean,upc,variant_id,seller_id,shipping_profile_id,
price_set_id,metadata,created_at,updated_at,deleted_at,
product_variant.id,product_variant.title,product_variant.sku,
product_variant.product_id,product_variant.product.id,
product_variant.product.title,product_variant.product.thumbnail,
product_variant.options.id,product_variant.options.value,
shipping_profile.id,shipping_profile.name,shipping_profile.type,
price_set.id,price_set.prices.id,price_set.prices.amount,
price_set.prices.currency_code,price_set.prices.min_quantity,
price_set.prices.max_quantity,price_set.prices.rules_count,
price_set.prices.price_rules.attribute,price_set.prices.price_rules.value,
inventory_item_link.id,inventory_item_link.required_quantity,
inventory_item_link.inventory_item_id,
inventory_item_link.inventory_item.id,
inventory_item_link.inventory_item.sku,
inventory_item_link.inventory_item.title,
inventory_item_link.inventory_item.location_levels.id,
inventory_item_link.inventory_item.location_levels.location_id,
inventory_item_link.inventory_item.location_levels.stocked_quantity,
inventory_item_link.inventory_item.location_levels.reserved_quantity,
inventory_item_link.inventory_item.location_levels.incoming_quantity,
inventory_item_link.inventory_item.location_levels.available_quantity,
seller.id,seller.name,seller.handle,seller.email,
audit_log
```

Two relations only present in the admin shape:

- `seller.*` — drives the General section's Store row and the
  sidebar Store card.
- `audit_log` — returned by `GET /admin/offers/:id` only (vendor
  reads omit it; see SPEC-002 §Endpoint Contracts).

`OFFER_LIST_FIELDS` (also in `common/constants.ts`) is narrower —
fetches just the columns the list table renders: variant + product
identity (title, thumbnail, status, categories) + shipping profile
+ seller (id, name, handle) + offer timestamps. No collection /
inventory / price fields.

Errors `throw` inside `Root` so the route-level `ErrorBoundary`
renders the fallback.

### Store-scoped offer slice (store detail page)

The store detail page (`pages/stores/store-details`) gains a new
**Offers** section, modelled after the existing `StoreOrdersSection`
(`packages/admin/src/pages/stores/store-details/components/store-orders-section.tsx`).

**File:** `pages/stores/store-details/components/store-offers-section.tsx` (new).

- Wrapper `<Container className="divide-y p-0">`. Header row uses
  the standard
  `flex items-center justify-between px-6 py-4` layout:
  - Left: `<Heading level="h2">{t("offers.sellerSection.heading")}</Heading>`
    + `<Text size="small" className="text-ui-fg-subtle">{count} {t("offers.domain")}</Text>`.
  - Right cluster (`gap-x-2`):
    - `<Button size="small" variant="secondary" asChild>` wrapping a
      `<Link to="/offers?seller_id=${sellerId}">` →
      `t("offers.sellerSection.viewAll")`.
    - `<ActionMenu>` with one destructive group:
      - `t("offers.sellerSection.bulkDeleteAll")` →
        opens `usePrompt` with description
        `t("offers.bulkDeleteAll.description", { storeName })` and
        calls
        `useBulkDeleteOffersForSeller(sellerId).mutateAsync(allOfferIds)`
        where `allOfferIds` is the full id list returned by the
        section's current query. If SPEC-002 later adds a wildcard
        `{ all: true }` form, the section migrates to that.
- Body: an embedded `_DataTable` reusing
  `useOfferTableColumns()` **without the `store` column** (the
  section is already store-scoped so showing the seller again would
  be redundant). The hook returns the full set; the section filters
  it via `.filter((c) => c.id !== "store")` so the column ordering
  stays in lock-step with the main list.
  - Page size **`STORE_OFFERS_SECTION_PAGE_SIZE = 10`** (matches
    `StoreOrdersSection`'s precedent).
- Empty state: `t("offers.sellerSection.empty")`.

This is the operator's single triage surface for a store's catalog
without leaving the store detail page.

## Data layer

### Hooks file

`packages/admin/src/hooks/api/offers.tsx` (new). Mirrors the
**read-only** shape of admin's existing per-domain hook files (e.g.
`hooks/api/sellers.tsx`). No create / update / batch hooks — the
admin surface is read-only. Only `useBulkDeleteOffersForSeller`
mutates.

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

The vendor side ships extra hooks (`useCreateOffer`,
`useBulkCreateOffers`, `useUpdateOffer`,
`useBatchOfferInventoryItems`, `useDeleteOffer`,
`useBulkDeleteOffers`) — **none of them have an admin equivalent.**
Operators get exactly three hooks: `useOffers`, `useOffer`,
`useBulkDeleteOffersForSeller`.

### SDK namespace

All calls go through `sdk.admin.*`. No `fetch` calls anywhere in
the page tree.

## Folder layout

Mirrors SPEC-003's shipped folder layout (admin variant), with the
`[id]/{edit,pricing,inventory}` write surfaces removed and two
extra detail sections added (`offer-store-sidebar.tsx`,
`offer-audit-log-section.tsx`):

```
packages/admin/src/pages/offers/
  index.ts                                 barrel
  offer-list-page.tsx                      compound root, SingleColumnPage
  common/
    constants.ts                           OFFERS_PAGE_SIZE = 10,
                                            STORE_OFFERS_SECTION_PAGE_SIZE = 10,
                                            OFFER_IDS_KEY, OFFER_DETAIL_FIELDS,
                                            OFFER_LIST_FIELDS
    types.ts                               OfferDetail type alias
    utils.ts
  _components/
    index.ts
    offer-list-table.tsx                   Container shell
    offer-list-header.tsx                  Heading; no CTA
    offer-list-data-table.tsx              _DataTable wiring + bulk command
    offer-actions.tsx                      row ActionMenu (Open store)
    use-offer-table-columns.tsx
    use-offer-table-filters.tsx
    use-offer-table-query.tsx
  [id]/
    index.ts
    offer-detail-page.tsx                  compound root, TwoColumnPage hasOutlet
    breadcrumb.tsx
    loader.ts
    _components/
      index.ts
      offer-general-section.tsx
      offer-inventory-section.tsx
      offer-pricing-section.tsx
      offer-variant-section.tsx            Master variant card (Pattern A)
      offer-store-sidebar.tsx              ADMIN-ONLY: Store card (Pattern A)
      offer-audit-log-section.tsx          ADMIN-ONLY: audit log main-column section
```

Plus the store-detail addition:

```
packages/admin/src/pages/stores/store-details/components/
  store-offers-section.tsx                 (new)
```

Folder shape **deltas vs SPEC-003 shipped vendor layout**:

- `[id]/edit/`, `[id]/pricing/`, `[id]/inventory/` are **absent**
  — no write affordances.
- `[id]/_components/offer-store-sidebar.tsx` and
  `[id]/_components/offer-audit-log-section.tsx` are **new**, no
  vendor equivalent.
- `create/` is **absent** — admin cannot create offers.

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
  lazy: () =>
    import("./pages/offers").then((m) => ({ Component: m.OfferListPage })),
  children: [
    {
      path: ":id",
      lazy: () => import("./pages/offers/[id]"),
      handle: { breadcrumb: BreadcrumbFromLoader },
      loader: (...args) =>
        import("./pages/offers/[id]/loader").then((m) => m.loader(...args)),
    },
  ],
},
```

No `create`, `edit`, `pricing`, or `inventory` child routes — admin
is read-only. Folder name is `[id]/` (mirrors SPEC-003 §Realignment
shipped vendor folder), not the older `offer-detail/`.

## Compound exports

Mirrors SPEC-003's shipped compound shape, with the admin-only
sidebar Store card and main-column Audit log slot added. The
vendor's `Shipping` / `StatusSidebar` parts that the older draft
listed are **absent** here too — shipping profile is a `SectionRow`
inside General and stock status is the Inventory cell colour.

```ts
export const OfferListPage = Object.assign(Root, {
  Table: OfferListTable,
  Header: OfferListHeader,
  HeaderTitle: OfferListTitle,
  HeaderActions: OfferListActions, // empty by default; blocks can extend
  DataTable: OfferListDataTable,
})

export const OfferDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  General: OfferGeneralSection,
  Inventory: OfferInventorySection,
  AuditLog: OfferAuditLogSection,   // admin-only
  Variant: OfferVariantSection,
  StoreSidebar: OfferStoreSidebar,  // admin-only
  Pricing: OfferPricingSection,
})
```

## i18n keys

Added to `packages/admin/src/i18n/translations/en.json` first;
sister locale files updated as part of the per-locale sweep.
**Every visible string on the new pages goes through `t(...)`** —
no literal text in JSX, no inline English copy in component
defaults. The admin `offers.*` namespace overlaps with the vendor
namespace by intent (so operators and sellers see consistent
labels for the same concepts), but the admin namespace also adds
`offers.fields.store`, `offers.detail.store`,
`offers.actions.openStore`, `offers.detail.auditLog*`,
`offers.bulkDelete.crossStore*`, and the
`offers.sellerSection.*` keys that the vendor never needs.

```jsonc
"offers": {
  "domain": "Offers",
  "subtitle": "Browse every offer across all stores",

  "empty": {
    "heading": "No offers yet",
    "description": "Stores haven't published any offers on this marketplace yet."
  },
  "filtered": {
    "heading": "No matching offers",
    "description": "Adjust filters or search terms."
  },

  "actions": {
    "openStore": "Open store",
    "bulkDelete": "Delete selected"
  },

  "fields": {
    "store": "Store",
    "sku": "SKU",
    "variant": "Master variant",
    "ean": "EAN",
    "upc": "UPC",
    "shippingProfile": "Shipping profile",
    "requiredQuantity": "Required quantity",
    "stockStatus": "Stock status"
  },

  "detail": {
    "offerLabel": "Offer",
    "masterVariant": "Master variant",
    "store": "Store",
    "inventoryItems": "Inventory items",
    "auditLog": "Audit log",
    "auditLogEmpty": "No audit entries yet.",
    "goToInventoryItem": "Go to inventory item",
    "manageKit": "Inventory kit"
  },

  "bulkDelete": {
    "description": "You are about to delete {{count}} offer(s) from {{storeName}}. This cannot be undone.",
    "successToast": "Deleted {{count}} offer(s)",
    "errorToast": "Bulk delete failed: {{message}}",
    "crossStoreWarning": "Select offers from one store at a time. Bulk delete is scoped per store.",
    "crossStoreTooltip": "Bulk delete only works within one store."
  },

  "bulkDeleteAll": {
    "description": "You are about to delete every offer for {{storeName}}. This cannot be undone.",
    "actionLabel": "Delete catalog"
  },

  "sellerSection": {
    "heading": "Offers",
    "viewAll": "View all",
    "bulkDeleteAll": "Delete catalog",
    "empty": "This store has no offers yet."
  },

  "stockStatus": {
    "in_stock": "In stock",
    "low_stock": "Low stock",
    "out_of_stock": "Out of stock"
  }
}
```

Reused keys (already present in the admin translation file from
sibling pages — referenced but not re-declared above):
`fields.title`, `fields.createdAt`, `fields.updatedAt`,
`labels.prices`, `actions.delete`, `actions.cancel`,
`actions.showMore`, `general.areYouSure`, `shippingProfile.domain`,
`inventory.available`, `products.domain`, `collections.domain`,
`categories.domain`.

Naming convention:

- The user-facing word for the seller entity is **"Store"**, not
  "Seller" — matches SPEC-003's "Store everywhere user-facing"
  policy from the 2026-05-21 Figma redesign. Internal field /
  variable names (`seller_id`, `useSellers`, `useBulkDeleteOffersForSeller`)
  stay on the backend term; user-visible labels read **Store**.
- Removed (vs the older draft of this spec): `offers.actions.openSeller`,
  `offers.fields.seller`, `offers.bulkDelete.crossSellerWarning`,
  `offers.list.empty.*`, `offers.list.filtered.*`,
  `offers.detail.general|pricing|inventory|shipping`,
  `offers.detail.openSeller`. Replaced with the keys above so the
  shape lines up with SPEC-003's shipped namespace.

## Verification

1. `bun install && bun run build` succeeds with the new pages and
   hooks (`packages/admin` compiles cleanly with `bun run lint`).
   `bunx vitest run packages/admin/src/i18n/translations/__tests__/validate-translations.spec.ts`
   stays green after the new `offers.*` keys land in `en.json` and
   the regenerated `$schema.json`.
2. With a seeded marketplace (at least two stores, each with one
   product variant and one offer), log into the admin panel as an
   operator.
   1. Sidebar shows `t("offers.domain")` nested under
      `t("products.domain")` as the first child of Products.
   2. `/offers` renders both stores' offers in one list. No "Create"
      CTA is present in the header (admin is read-only). Empty-state
      heading reads `t("offers.empty.heading")` when no offers exist
      anywhere.
3. List columns and interactions:
   1. The column order reads
      **select / Store / Title / Categories / SKU / Shipping
      profile / Status / actions**, with `Store` rendering an
      avatar + store name + handle subtitle.
   2. Filter by **Store** (`offers.fields.store` label, backed by
      `useSellers`) → only that store's offers remain.
   3. Filter by **Shipping profile** → list filters correctly.
   4. Filter by **SKU** (string filter) → list filters by SKU
      substring.
   5. Sort menu offers Title / Created at / Updated at with
      ascending / descending toggle. Default is
      `created_at DESC`; most recent offer is first.
   6. Pagination footer reads
      `1 — 10 of {N} results` (page size 10).
4. Bulk delete:
   1. Select two rows that share a `seller_id`. The
      `t("offers.actions.bulkDelete")` command becomes enabled.
      Trigger it, confirm in the prompt (description renders
      `t("offers.bulkDelete.description", { count: 2, storeName })`).
      The list polls the returned `job_id`; on `succeeded` it toasts
      `t("offers.bulkDelete.successToast", { count: 2 })` and clears
      the selection. Both rows vanish.
   2. Attempt to extend the selection to a row that belongs to a
      different `seller_id`. The selection change is rejected and a
      `toast.warning(t("offers.bulkDelete.crossStoreWarning"))`
      fires. If the operator coerces the selection to span stores,
      the bulk-delete command stays `disabled` with tooltip
      `t("offers.bulkDelete.crossStoreTooltip")`.
5. Detail page:
   1. From the list, click a row. The page heading is the master
      variant title; the General `<Container>` carries
      `data-testid="offer-detail-general-section"`.
   2. Main column renders **General** (with a `Store` SectionRow
      linking to `/stores/${seller.id}`, SKU / EAN / UPC /
      Shipping profile / Created at / Updated at rows; kit icon
      next to the heading if `inventory_item_link.length > 1`),
      **Inventory items** (`_DataTable` over the offer's inventory
      item links with a per-row "Go to inventory item" action;
      inventory cell red when `available === 0`), and **Audit log**
      (one row per `audit_log[]` entry; empty-state copy
      `t("offers.detail.auditLogEmpty")`).
   3. Sidebar renders three stacked cards in this order:
      **Master variant** (links to
      `/products/<product_id>/variants/<variant_id>`),
      **Store** (links to `/stores/<seller_id>`), and **Prices**
      (collapsible list, 3 visible by default, `Show more` reveals
      3 more).
   4. No edit / delete / manage-prices / manage-inventory
      affordances are anywhere on the page. The General section's
      header carries no `ActionMenu`. The Inventory items section
      carries no `ActionMenu`. The Prices section carries no
      `ActionMenu`.
6. Store-scoped slice:
   1. On `/stores/${seller.id}`, the **Offers** section renders the
      store's offers (page size 10). The header shows the count and
      a `t("offers.sellerSection.viewAll")` secondary button that
      navigates to `/offers?seller_id=${sellerId}` and applies the
      store filter on the list page.
   2. The section's table reuses `useOfferTableColumns()` filtered
      to drop the `store` column (already scoped by the page).
   3. The section's `ActionMenu` exposes
      `t("offers.sellerSection.bulkDeleteAll")`. Triggering it (and
      confirming the prompt with description
      `t("offers.bulkDeleteAll.description", { storeName })`)
      bulk-deletes every offer for that store. After the job
      succeeds the section empties out and renders the
      `t("offers.sellerSection.empty")` copy.
7. **i18n coverage check:** `grep -RnE "(>[^<{}]*[A-Za-z]{2}[^<{}]*<)" packages/admin/src/pages/offers packages/admin/src/pages/stores/store-details/components/store-offers-section.tsx`
   reveals no literal English copy inside JSX text nodes — every
   string flows through `t("…")`. (Static `<Heading>` /
   `<Text>` / `<Button>` content carries a `{t(...)}` expression,
   never a bare string.)
8. Integration tests: the admin contracts (`GET /admin/offers`,
   `GET /admin/offers/:id`, `POST /admin/sellers/:id/offers/bulk-delete`)
   are already covered by the existing offer suites referenced in
   SPEC-002 §Testing. This spec's verification rides on top of
   those. If a Playwright suite is introduced for the admin panel,
   add a smoke test that walks step 2 → step 6 above and asserts
   the rendered DOM via the `data-testid` attributes listed below.
9. **Deletion checks (paired with Variant-scoped UI to remove (admin)):**
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

Each interactive element on the new pages and the store-detail
section carries a kebab-case `data-testid`. Names mirror
SPEC-003's vendor `data-testid` contract where the surface is
shared, with admin-only additions for the Store column / card /
section and the audit log:

- List page: `offer-list-table`, `offer-list-row-${id}`,
  `offer-list-row-${id}-store-cell`,
  `offer-list-action-menu-${id}`, `offer-list-open-store-${id}`,
  `offer-list-bulk-delete`, `offer-list-cross-store-warning`,
  `offer-list-sort-trigger`, `offer-list-add-filter`.
- Detail page:
  `offer-detail-general-section`,
  `offer-detail-inventory-section`,
  `offer-detail-audit-log-section`,
  `offer-detail-master-variant-section`,
  `offer-detail-master-variant-link`,
  `offer-detail-master-variant-thumbnail`,
  `offer-detail-master-variant-title`,
  `offer-detail-master-variant-options`,
  `offer-detail-store-sidebar`,
  `offer-detail-store-link`,
  `offer-detail-store-avatar`,
  `offer-detail-store-name`,
  `offer-detail-store-handle`,
  `offer-detail-prices-section`,
  `offer-detail-inventory-row-${inventoryItemId}-go-to-inventory`.
- Store-detail page section:
  `store-offers-section`,
  `store-offers-section-view-all`,
  `store-offers-section-bulk-delete`,
  `store-offers-section-empty`.

## Evidence

### 2026-05-22 — Admin offer UI shipped (read-only list + detail + bulk delete)

Implementation landed under `packages/admin/src/pages/offers/`,
`packages/admin/src/hooks/api/offers.tsx`, and a new `DELETE` handler
on `packages/core/src/api/admin/offers/[id]/route.ts`. Concretely:

- **Hooks** (`packages/admin/src/hooks/api/offers.tsx`):
  - `useOffers(query, options)` → `sdk.admin.offers.query(...)`
  - `useOffer(id, query, options)` → `sdk.admin.offers.$id.query(...)`
  - `useDeleteOffer(id, options)` → `sdk.admin.offers.$id.delete(...)`
  - `useBulkDeleteOffers(options)` → `Promise.allSettled` fan-out over
    `sdk.admin.offers.$id.delete` returning `{ succeeded: string[], failed: { id, error }[] }`.
- **Backend** (`packages/core/src/api/admin/offers/[id]/route.ts`):
  added `DELETE` handler that runs `deleteOffersWorkflow` (mirrors the
  vendor route). Route map regenerated under
  `packages/core/.mercur/index.d.ts` so `sdk.admin.offers.$id.delete` is typed.
  The per-seller `POST /admin/sellers/:id/offers/bulk-delete` endpoint
  declared in SPEC-002 §Endpoint Contracts is **not yet implemented**;
  the admin UI fan-outs single deletes instead.
- **List page** (`pages/offers/offer-list-page.tsx` +
  `pages/offers/_components/*`): `SingleColumnPage` → `Container divide-y p-0`
  → `OfferListHeader` (single `<Heading>{t("offers.domain")}</Heading>`,
  no subtitle, no CTA) → `_DataTable` over `useOffers`.
  - Columns (final): `select` / `title` (variant title + thumbnail) /
    `categories` / `sku` / `shipping_profile` / `status` / `actions`.
    The **Store** column was scaffolded then removed at design review —
    operators always navigate from `/stores/:id` so the per-row store
    chip was redundant. Per-row **Open store** ActionMenu action also
    dropped.
  - Filters: `seller_id` (Store; backed by `useSellers`), `shipping_profile_id`,
    `sku`, `created_at`, `updated_at`.
  - Sort: `title` / `created_at` / `updated_at`. Default `-created_at`.
  - Page size `OFFERS_PAGE_SIZE = 10`. `keepPreviousData` on the query.
  - Bulk command **Delete selected** (`shortcut: "d"`): `usePrompt`
    confirmation → `useBulkDeleteOffers.mutateAsync(ids)` → success or
    partial-failure toast; failed ids stay selected.
- **Detail page** (`pages/offers/[id]/offer-detail-page.tsx` +
  `_components/*`): `TwoColumnPage<OfferDetail>` with
  `hasOutlet`, `data={typedOffer}`, `showJSON` and `showMetadata`
  omitted (defaults to false).
  - Page header is the **variant title**;
    `data-testid="offer-detail-general-section"`.
  - Main column: **General** (SectionRows: SKU / EAN / UPC /
    Shipping profile / Created at / Updated at — kit icon next to
    heading when `inventory_item_link.length > 1`); **Inventory items**
    (`_DataTable` over `inventory_item_link[].inventory_item` with a
    per-row **Go to inventory item** action; available qty renders red
    when `quantity === 0`).
  - Sidebar: **Product variant** card (matches vendor's
    `offers.detail.productVariant` key; admin had originally shipped
    the heading as "Master variant" → renamed); **Store** card
    (Avatar + name + handle, links to `/stores/${seller.id}`);
    **Prices** (collapsible, 3-at-a-time `Show more`, hides
    `rules_count > 0` ladders).
  - **Audit log** main-column section was scaffolded then removed at
    design review. `GET /admin/offers/:id` doesn't currently return
    `audit_log` and the admin design doesn't want it surfaced. Spec
    section "Audit log shape" is now stale; treat the section as not
    rendered.
  - **No action menus anywhere** on the detail page — admin is
    read-only per **Scope and constraints**.
- **Routing** (`packages/admin/src/get-route-map.tsx`): `/offers` and
  `/offers/:id` registered as **siblings** under the `main` bucket
  (matches vendor's structure). Initially nested as a child of the
  list route, which caused the list and detail to render stacked;
  fixed in the same session.
- **Sidebar** (`packages/admin/src/components/layout/main-layout/main-layout.tsx`):
  `Offers` added as the first nested item under
  `t("products.domain")`, mirroring SPEC-003 §Sidebar entry.
- **i18n** (`packages/admin/src/i18n/translations/en.json` +
  `$schema.json`): full `offers.*` namespace added (38 keys after the
  design-review trim: removed `subtitle`, `detail.auditLog`,
  `detail.auditLogEmpty`; renamed `detail.masterVariant` →
  `detail.productVariant`). Schema↔en parity verified (38/38).
- **Loader fields** (`pages/offers/common/constants.ts`):
  `OFFER_DETAIL_FIELDS` did not initially drop
  `product_variant.options.*`. The backend rejected the request with
  `ValidationError: Entity 'ProductVariant' does not have property 'options'`
  (SPEC-002 dropped `options`/`prices` from the variant). Fixed in the
  same session by removing those two paths from both
  `OFFER_DETAIL_FIELDS` and the `OfferDetail` type.

**Static checks:**

- `bunx tsc --noEmit` on `packages/admin` reports no new errors on the
  new files. The only offer-tree warnings are four lines that match
  vendor's existing offer code 1:1 (`InventoryRow` location_levels
  shape, `orderBy.key` constrained by `keyof OfferTableRow`).
- `bun run lint` clean on all new files.

**Deferred from spec (unchanged from 2026-05-22 plan):**

- Per-seller bulk-delete endpoint
  `POST /admin/sellers/:id/offers/bulk-delete` (declared in
  SPEC-002 §Endpoint Contracts but unimplemented). Admin currently
  fan-outs `DELETE /admin/offers/:id` per row through
  `Promise.allSettled`. When SPEC-002 lands the wildcard endpoint,
  flip `useBulkDeleteOffers` to a single call and re-add the
  per-store warnings + tooltip outlined under **List page** above.
- **Variant-scoped UI removal** (the long deletion list under
  **Variant-scoped UI to remove (admin)**). Those deletions are still
  required for SPEC-004 to move to `passing`; tracking as a follow-up
  in this branch.
- **Store-scoped offer slice** on `/stores/:id`. A scaffolded section
  shipped briefly then was removed when its `_DataTable` import flagged
  as deprecated and the section's purpose collapsed back into the main
  `/offers` filter chain. If we restore it, prefer the non-deprecated
  `DataTable` primitive.
- **Per-locale i18n sweep.** `en.json` is canonical and validated by
  `validate-translations.spec.ts`. Sister locales (`de`, `fr`, `es`,
  `pl`, `ja`, …) still need the `offers.*` block; recorded as a
  follow-up.

### 2026-05-22 — Spec realigned to SPEC-003 shipped vendor patterns

- Spec rewritten to mirror SPEC-003 §Realignment (the **shipped**
  vendor offer UI). Concretely:
  - List columns become `select / store / title / categories / sku
    / shipping_profile / status / actions` — same shape as the
    vendor list plus the admin-only **Store** column.
  - List filters become `seller_id` (admin-only) + `shipping_profile_id`
    + `sku` + `created_at` + `updated_at` — same shape as the
    vendor filters plus the admin-only **Store** filter.
  - Sort menu carries `title` / `created_at` / `updated_at`. Page
    size = 10 (`OFFERS_PAGE_SIZE` constant in
    `pages/offers/common/constants.ts`).
  - Detail page is a `TwoColumnPage` with `hasOutlet` and
    `showJSON`/`showMetadata` omitted. Page heading is the variant
    title. Main column = General + Inventory items + **Audit log**
    (admin-only). Sidebar = Master variant + **Store** card
    (admin-only) + Prices. No Status / Shipping / JSON / Metadata
    sections.
  - Folder layout is `pages/offers/{_components,common,[id],...}` —
    matches SPEC-003 §Realignment, with `[id]/edit`, `[id]/pricing`,
    `[id]/inventory`, and `create/` absent and
    `[id]/_components/{offer-store-sidebar,offer-audit-log-section}.tsx`
    added.
  - Hooks file ships **only** `useOffers`, `useOffer`,
    `useBulkDeleteOffersForSeller`. No create / update / batch
    hooks.
  - Every visible string flows through `t("…")`. The user-facing
    word for the seller entity is **"Store"**; backend identifiers
    keep `seller_id`/`useSellers` naming.
- **No code changes in this revision.** This is a docs-only update
  whose purpose is to bring SPEC-004 in line with the shipped
  vendor surface before admin implementation starts.
- **Implementation evidence (TBD):** record build artefact, lint
  output, vitest run id, and Playwright run id once the admin
  pages land.

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

### Cross-store selection constraint

The bulk-delete endpoint is `POST /admin/sellers/:id/offers/bulk-delete`
— **single-store scoped** (the route still uses `seller_id` on the
backend; only the user-facing copy says "Store"). The UI surfaces a
friendly client-side constraint instead of attempting to dispatch
one request per store behind the scenes, because:

- Fanning out per store introduces partial-failure UX a single
  toast can't cleanly summarize, and admins are likelier than
  vendors to be operating on a single store anyway.
- The endpoint returns a `job_id` and runs asynchronously, so
  spawning N parallel jobs would require N concurrent pollers.
  Avoidable complexity for a corner case.

If marketplace operators ever ask for cross-store bulk delete in
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
