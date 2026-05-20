---
status: not_started
canonical: false
priority: 3
area: vendor/offers
created: 2026-05-20
last_updated: 2026-05-20
---

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

## User-Visible Behavior

A logged-in vendor opens the vendor panel and sees a new sidebar entry
**Offers** nested under **Products**. Clicking it lands on
`/offers`, a list page with one row per offer the active seller owns.
From there the vendor can search, filter, sort, paginate, bulk-select
rows, open a single offer's detail page, edit its identity / pricing /
inventory across three drawers, delete a single offer, or bulk-delete
a selection. Creating a new offer opens a four-tab full-screen wizard
that submits to `POST /vendor/offers`.

The screen vocabulary mirrors the existing vendor pages
(`pages/inventory`, `pages/products`) so a seller already familiar
with the dashboard recognizes every interaction.

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
seller's listing on a master variant — conceptually a child of
Products, not a peer of Orders/Inventory/Customers.

### List page (`/offers`)

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
  - No offers yet: heading "Create your first offer", description
    "Bind your seller catalog to a master variant to make it
    purchasable.", primary CTA "Create offer".
  - Filtered to empty: heading "No matching offers", description
    "Adjust filters or search terms.".

### Columns

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
Sister files updated as part of the per-locale sweep.

```
"offers": {
  "domain": "Offers",
  "subtitle": "Manage your catalog listings",
  "create": {
    "header": "Create offer",
    "successToast": "Offer created",
    "tabs": {
      "variant": "Variant",
      "details": "Details",
      "pricingAndStock": "Pricing & stock"
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
    "create": "Create offer",
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
    "stockStatus": "Stock status"
  },
  "stockStatus": {
    "in_stock": "In stock",
    "low_stock": "Low stock",
    "out_of_stock": "Out of stock"
  },
  "empty": {
    "heading": "Create your first offer",
    "description": "Bind your seller catalog to a master variant to make it purchasable."
  },
  "filtered": {
    "heading": "No matching offers",
    "description": "Adjust filters or search terms."
  }
}
```

## Verification

1. `bun install && bun run build` succeeds with the new pages and
   hooks (`packages/vendor` compiles cleanly with `bun run lint`).
2. With a seeded marketplace (at least two sellers, each with one
   product variant), log into the vendor panel as seller A.
   1. Sidebar shows **Offers** nested under Products.
   2. `/offers` renders an empty state with a primary **Create
      offer** CTA.
3. Click **Create offer**. The three-tab wizard opens:
   1. Tab 1 (**Variant**): pick a variant that belongs to a product
      accessible to seller A. **Continue** is disabled until a
      variant is selected.
   2. Tab 2 (**Details**): fill `sku`, pick a shipping profile.
      Validate that submitting with an empty `sku` re-focuses tab 2
      and shows the `Form.ErrorMessage`.
   3. Tab 3 (**Pricing & stock**):
      - In the Prices sub-section, add at least one price row. Add
        a second row with the same `(currency_code, region_id,
        customer_group_id, min_quantity, max_quantity)` tuple — the
        client-side validator blocks **Save** and surfaces an error
        on the duplicate row.
      - In the Inventory items sub-section, add one item. Add a
        duplicate `inventory_item_id` — the client-side validator
        blocks **Save** and surfaces an error on the duplicate row.
      - Remove the duplicates, click **Save**.
   4. Toast `offers.create.successToast`, modal closes, the new
      offer's detail page renders.
4. On the detail page:
   1. General, Pricing, Inventory, Shipping sections render with the
      submitted values. JSON viewer and metadata sections render at
      the bottom of the sidebar.
   2. Stock status badge reflects the seeded inventory level.
   3. Click **Edit** → identity drawer opens, fields prefilled,
      change `sku`, save. Toast and detail rerender; price table
      untouched.
   4. Click **Manage prices** → drawer opens, prices prefilled. Add a
      new currency row, remove the original. Save. Detail re-renders
      with one row (replace semantics).
   5. Click **Manage inventory** → drawer opens. Change a
      `required_quantity`, attach a new item, remove an existing
      one. Save. Detail re-renders.
5. Return to `/offers`:
   1. The list shows the new offer. Sort by `updated_at DESC` puts it
      first.
   2. Select the row's checkbox, then a second offer's checkbox.
      Click **Delete selected**. Confirm in the prompt. Toast shows
      `offers.bulkDelete.successToast` with `count = 2`. Both rows
      vanish from the list and selection clears.
   3. Filter by Shipping profile → the list filters correctly.
   4. Search by partial `sku` → the list filters correctly.
6. Cross-seller isolation: log out, log in as seller B. `/offers`
   only shows seller B's offers; loading `/offers/<seller-A-offer-id>`
   surfaces the `ErrorBoundary` because the route returns
   `MedusaError.Types.NOT_ALLOWED` (403).
7. Integration test (Jest + Playwright if available, or a route-level
   harness): the test
   `integration-tests/http/offer/vendor/offer.spec.ts` already covers
   the API contracts referenced by every interaction in this spec.
   This spec's UI verification rides on top of that and does not need
   a parallel API test; if a Playwright suite is introduced for the
   vendor panel, add a smoke test that walks step 2 → step 4 above
   and asserts the rendered DOM via `data-testid` attributes named
   per the page-authoring checklist:
   - `offer-list-table`, `offer-list-create-button`,
     `offer-list-row-${id}`, `offer-list-action-menu-${id}`,
     `offer-list-bulk-delete`
   - `offer-create-form`, `offer-create-tab-{variant,details,pricingAndStock}`,
     `offer-create-prices-repeater`, `offer-create-inventory-items-repeater`
   - `offer-detail-{general,pricing,inventory,shipping,status}-section`
   - `offer-edit-form`, `offer-pricing-edit-form`,
     `offer-inventory-batch-form`

## Evidence

To be filled in once the spec is implemented:

- **Implemented at:** _TBD_
- **Source:** `packages/vendor/src/pages/offers/...`, hooks in
  `packages/vendor/src/hooks/api/offers.tsx`, route registration in
  `packages/vendor/src/get-route-map.tsx`, sidebar update in
  `packages/vendor/src/components/layout/main-layout/main-layout.tsx`.
- **Translations:** `packages/vendor/src/i18n/translations/en.json`
  - sister locale files.
- **Build artifact:** vendor Vite dev server (`bun run dev`) renders
  every step in **Verification** without console errors.
- **Test run pending:** record the Playwright run id + the existing
  `integration-tests/http/offer/vendor/offer.spec.ts` run id.

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

### Out of scope

- Bulk price edits across multiple offers — there is no API for
  this in SPEC-002 and no aggregated UI surface in this spec.
- CSV / feed import of offers — explicitly excluded in SPEC-002.
- A dedicated "duplicate offer" action — recorded as a candidate
  follow-up; if added, it should call `useCreateOffer` with the
  source offer's payload as defaults.
- The buy-button binding on the storefront — owned by SPEC-005.
- The admin offers list / detail — owned by SPEC-004.
