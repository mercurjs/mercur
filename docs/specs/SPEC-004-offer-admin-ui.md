---
status: not_started
canonical: false
priority: 4
area: admin/offers
created: 2026-05-20
last_updated: 2026-05-20
---

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

### Out of scope

- Operator-initiated offer suspension / reactivation — deferred per
  SPEC-002 §Storefront API Surface.
- CSV / feed import of offers across the marketplace — explicitly
  excluded in SPEC-002.
- Per-offer manual price overrides by admins — see **Read-only stance**.
- The storefront buy-button binding — owned by SPEC-005 (storefront UI).
- Vendor-facing offer CRUD — owned by SPEC-003.
