---
status: implemented
canonical: false
priority: 2
area: admin/offers
created: 2026-06-12
last_updated: 2026-06-12
---

# SPEC-010 Admin Offers — B2C Figma vs Implementation Gap

This spec audits the **Offers** surface of `@mercurjs/admin`
(`packages/admin/src/pages/offers`) against the canonical B2C offer
design and records the work needed to migrate the admin (operator)
offer surface to the **product-shaped** information architecture that
the vendor panel already adopted in **SPEC-009**.

It is the **admin analogue of SPEC-009** (vendor offers B2C). Where
SPEC-009 reshaped the *seller-facing* offer pages, this spec reshapes
the *operator-facing* ones, **reusing the same components, patterns,
and hooks** — ported from `@mercurjs/vendor` into `@mercurjs/admin` and
adapted for the admin's two hard constraints: the surface is
**read-only** and it is **platform-wide** (offers span every seller, so
a **Store** dimension is first-class).

Like SPEC-009 it is **descriptive, not prescriptive**: the B2C design
is the source of truth for the target IA; the code paths cited are what
exists today. Any divergence from the design must be captured here with
a documented reason — silent drift fails the audit.

## ⚠️ Figma finding — there is no dedicated admin offers design

> **Read this before scoping any screen work.**

The admin offers design page the request points at —
*Mercur 2.0 — Admin Panel* → page node `40016105:57669`
("`↳ Offers`", `figma.com/design/parLCIou6t4gBbCNS2Bsc4`) — is an
**empty placeholder page**: it has **no child frames** (verified via
the Figma MCP — the page node renders 0×0 with no children, and a
content-only screenshot returns an empty raster). The admin offer
screens have **not been designed independently**.

**Consequence.** The canonical reference for the admin offer IA is the
**Vendor Panel B2C** Offers design
(`figma.com/design/sYJoh84Owr5tomRjpxG0no`, page `40016404:290481`) —
the exact file SPEC-009 audits frame-by-frame. This spec therefore
**inherits SPEC-009's frame map** as the target shape and layers the
**admin deltas** (read-only, Store dimension) on top. Every "design"
reference below is to a *vendor B2C* frame; admin-specific changes are
called out explicitly.

If a dedicated admin offers design is later produced, re-audit the
screens marked **(inherited from vendor B2C)** against it and record
any divergence here.

## Relationship to the other offer specs

- **SPEC-002** — offer domain model, endpoint contracts, workflows,
  cart integration. **Canonical.** This spec defers to it. `Offer`
  stays 1:1 with a single master variant; no schema change here.
- **SPEC-003** — vendor panel UI (B2B redesign), shipped.
- **SPEC-004** — the **currently shipped admin offer UI** (read-only
  list + detail + per-store bulk delete). This spec's "what exists
  today" column is sourced from it and from the live code. SPEC-010
  **supersedes SPEC-004's screen shapes** (variant-shaped → product-
  shaped) but **keeps SPEC-004's two load-bearing decisions**: the
  surface is read-only, and bulk-delete is scoped per store
  (`POST /admin/sellers/:id/offers/bulk-delete`).
- **SPEC-009** — vendor offers B2C (the product-shaped redesign this
  spec mirrors). Its backend `wrapProductVariantsWithOffers` helper and
  its page structure are the templates ported here. **Canonical for the
  product-shaped IA.**

## Domain-model gap — the headline finding (admin variant)

> **This is the blocking decision. Read it before scoping any UI work.**

SPEC-009 resolved the offer-grain question for the vendor panel:
**keep `Offer` 1:1 with a variant, and render the "offer = product"
surface in the read layer** by backing the list/detail with the vendor
**product endpoint** and attaching the active seller's offers under
each variant with a `wrapProductVariantsWithOffers` helper (the
`withOffers` flow). No schema change, no migration, no unique
constraint.

The admin inherits that resolution but adds one twist the vendor panel
never had: **there is no "active seller."** Offers on the admin surface
span **every** seller, and a single shared product variant may carry
offers from **many** sellers at once. So the admin must decide what a
*row* is.

**Two ways to grain the admin offer surface:**

1. **Product-grained, all stores (the "store-aware product" model).**
   List row = a **product** that has at least one offer anywhere on the
   marketplace. The product endpoint's `withOffers` wrap attaches
   **every seller's** offers under each variant (each offer carries
   `offer.seller`). The admin-only **Store(s)** column shows the
   distinct stores offering that product; the existing per-store
   **filter** (`seller_id`, already in SPEC-004) collapses the list to
   a single store's listings on demand. The product-shaped detail's
   Variants table renders **one row per offer** across all sellers,
   with a **Store** column to disambiguate. Maximum reuse of the
   SPEC-009 vendor implementation — same product endpoint, same wrap
   shape **minus the seller scope**, same columns **plus** a Store
   column.
2. **`(store, product)`-grained.** List row = a `(seller, product)`
   pair — one row per store's listing of a product. Most literal to the
   "Store is first-class" framing, but it cannot fall straight out of
   the product endpoint (one product expands to N store rows), so it
   needs either a server-side `(seller, product)` projection or a
   client-side expansion of the wrapped graph. Larger blast radius for
   marginal gain over option 1 + the Store filter.

### Decision — option 1 (product-grained, all stores; non-seller-scoped wrap) ✅

**Chosen approach: option 1.** Keep `Offer` 1:1 with a variant
(SPEC-002 untouched) and back the admin list + detail with the
**admin product endpoint** (`GET /admin/products`,
`sdk.admin.products.query`) using a **non-seller-scoped** `withOffers`
wrap that attaches **all** sellers' offers (with `offer.seller`) under
each variant. Rows are **product-grained**; the **Store** dimension is
rendered as a column/filter on top, exactly mirroring how SPEC-004
already treats Store as the admin-only addition to the vendor column
set.

Rationale:

- **Maximum reuse.** The admin list/detail become near-clones of the
  SPEC-009 vendor pages — same `useProducts`/`useProduct` reads, same
  Product/Category/Collection/Variants/Status columns, same product-
  shaped detail (Details / Media / Variants + Associated product) — with
  the Store column/filter and the read-only trimming as the only
  structural deltas.
- **Consistent with SPEC-004.** SPEC-004 already made Store a
  first-class column + filter and scoped bulk-delete per store. Option 1
  preserves both verbatim.
- **No new backend cardinality.** The wrap is the vendor wrap with the
  `seller_id` filter **removed** (admin sees all sellers' offers) and an
  **optional** `seller_id`/`store` filter **added** for the per-store
  view. No `(seller, product)` projection table, no migration.

**No schema change, no migration, no unique constraint.** The only
backend footprint is the admin `wrapProductVariantsWithOffers` helper +
the "products that have an offer" list filter (`has_offer`), both on the
admin product endpoint. Everything else is frontend.

This spec stays `not_started` until the screens below are built, but the
**domain question is resolved** — implementation follows option 1.

## Source designs (inherited from vendor B2C)

All target frames live in **Mercur 2.0 — Vendor Panel B2C**
(`fileKey sYJoh84Owr5tomRjpxG0no`, page `40016404:290481`); see
SPEC-009 §"Source designs" for the full frame table. The frames this
spec maps onto admin screens:

| Admin surface | Vendor B2C reference frame | Admin delta |
| --- | --- | --- |
| Offers list — main view | `40016480:616844` ("Offers") | + **Store** column & filter; **no Create CTA**; row kebab → **Delete** + **Open store** only |
| Offer detail (product-shaped) | `40016489:637892` ("Product Details") | + **Store** sidebar card; Details kebab → **Delete** only (no Edit); **read-only** Media |
| Offer detail — Variants table | `40016500:747473` | + **Store** column; row → Offer Variant detail; row kebab → **Delete** only (no Edit) |
| Offer **Variant** detail (NEW) | `40016491:703365` ("Offer Variant Details") | **read-only** — no Edit Details / Edit Shipping / Edit Price / Manage Inventory drawers; General + Media + Inventory items + Shipping Configuration card + Price card, all read-only; + **Store** sidebar card |

**Explicitly out of scope for admin (vendor-only surfaces):** the
**Create Offer** wizard (Products → Stock Levels & Prices), the **Edit
Price** / **Edit Stock Levels** bulk DataGrids, the **Edit Offer
Variant** / **Edit Shipping Configuration** drawers, and the **Manage
Inventory Items** kit builder. Admin is read-only; operators inspect,
they do not author or edit offers. The **only** mutation is delete
(per-offer and per-store bulk).

## Surface map — what exists today (SPEC-004, shipped)

Current implementation rooted at `packages/admin/src/pages/offers`
(read-only; **variant-shaped**, not product-shaped):

```
offers/
  offer-list-page.tsx                       # SingleColumnPage host
  common/{constants,types}.ts               # OFFERS_PAGE_SIZE=10, OFFER_LIST_FIELDS / OFFER_DETAIL_FIELDS, OfferDetail
  _components/
    offer-list-table.tsx                    # Container shell
    offer-list-header.tsx                   # Heading "Offers" — NO Create CTA
    offer-list-data-table.tsx               # _DataTable + filters + sort + per-store bulk delete
    offer-actions.tsx                       # row ActionMenu — "Open store" only
    use-offer-table-columns.tsx             # select / store / title(variant) / categories / sku / shipping_profile / status / actions
    use-offer-table-filters.tsx             # store(seller_id) / shipping_profile_id / sku / created_at / updated_at
    use-offer-table-query.tsx
  [id]/
    offer-detail-page.tsx                   # TwoColumnPage (variant-shaped): General + Inventory (main); Variant + Store + Pricing (sidebar)
    loader.ts, breadcrumb.tsx
    _components/
      offer-general-section.tsx             # SKU/EAN/UPC/shipping profile/created/updated — read-only
      offer-inventory-section.tsx           # inventory_item_link table — read-only
      offer-pricing-section.tsx             # collapsible currency rows (sidebar)
      offer-store-sidebar.tsx               # Store card (seller name/handle + Open store)
      offer-variant-section.tsx             # "Product variant" card (sidebar)
```

Hooks in `packages/admin/src/hooks/api/offers.tsx`: `useOffers`,
`useOffer`, `useDeleteOffer`, `useBulkDeleteOffers` (a
`Promise.allSettled` fan-out over `DELETE /admin/offers/:id`). **No
create/update hooks** — admin is read-only.

API in `packages/core/src/api/admin/offers/`: `GET /admin/offers`,
`GET /admin/offers/:id`, `DELETE /admin/offers/:id`, `POST
/admin/offers/batch`. The per-store `POST
/admin/sellers/:id/offers/bulk-delete` was **deferred** in SPEC-004 (the
list currently bulk-deletes via the `Promise.allSettled` fan-out); see
§"Backend".

Route in `packages/admin/src/get-route-map.tsx:925+`: `/offers`,
`/offers/:id`. **No `:id/variants/*` sub-route** — there is no Offer
Variant detail page today.

## Status legend

- **Exists** — present and aligned to the target (visual/copy diffs
  noted under *Different*).
- **Different** — implemented but diverges materially.
- **Missing** — no implementation; needs to be built.
- **Dead** — implemented but not wired into the surface.

## Per-screen audit

### Offers list (vendor ref `40016480:616844`)

Target: `SingleColumnPage` + one `<Container className="divide-y p-0">`
hosting header, filter/search/sort row, the table, and the pagination
footer.

- **Page shell** — Exists. `OfferListPage` mounts `SingleColumnPage` +
  `Container`.
- **Header** — Exists/aligned. `<Heading>` "Offers" left; **no primary
  CTA** (admin cannot create). The vendor list's **Create** button is
  intentionally absent — keep it absent.
- **Columns** — **Different (structural).** Target column set is the
  vendor B2C set **plus the admin Store column**:
  **Store · Product · Category · Collection · Variants · Status · ⋯**
  (no selection column is required for navigation, but the **select**
  column **stays** because admin keeps multi-select for per-store bulk
  delete — see below).
  - **Store** — `offer.seller` (avatar + name + handle). **Admin-only.**
    Carried over from SPEC-004. With option 1 a product row can be
    offered by multiple stores → render the **distinct stores** offering
    the product (avatar stack, or "N stores" with the single store's
    name when there is exactly one). When the **Store filter** is
    active, every row resolves to that one store.
  - **Product** — 24×24 product thumbnail + **product title**
    (`product.title`). Replaces the shipped `title` column (which shows
    the *variant* thumbnail + title). With the product-endpoint backing
    the list is one row per product.
  - **Category** — `product.categories[0]?.name`. Shipped has a
    `categories` column ≈ matches.
  - **Collection** — `product.collection?.title`. **Missing** in
    shipped.
  - **Variants** — count of variants that have an attached offer,
    rendered "**N variants**". **Missing** in shipped. Derived as
    `variants.filter(v => v.offers?.length).length` after the wrap. (If
    the Store filter is active, count only that store's offered
    variants.)
  - **Status** — `ProductStatusCell` from `product.status`. Exists ≈.
  - **Drop** the shipped `sku` + `shipping_profile` columns (they live
    on the Offer Variant detail page now), per the vendor B2C list.
- **Row navigation** — target opens the **product-shaped offer detail**
  (`/offers/:id`, `:id` = **product id**), not the variant-shaped page
  shipped today.
- **Filter menu** — **Different.** Vendor B2C filters are
  `Category · Collection · Type · Tag · Status · Created · Updated`
  (all product-graph). Admin **adds the Store filter** (`seller_id`,
  multi-select, searchable — kept from SPEC-004) and **drops**
  `shipping_profile_id` + `sku`. Net admin filter set:
  **Store · Category · Collection · Type · Tag · Status · Created ·
  Updated**.
- **Sort menu** — Title / Created / Updated + Asc/Desc (vendor B2C
  parity; `title` sorts on `product.title`).
- **Row kebab** (`offer-actions.tsx`) — **Different.** Admin is
  read-only, so the vendor's `Edit prices / Edit stock levels` actions
  are **omitted**. The admin row kebab carries:
  **Open store** (`/stores/:seller_id`, kept from SPEC-004) and
  **Delete** (per-store; removes the store's offers on that product via
  the per-store bulk delete — see §"Delete flow"). When a product is
  offered by multiple stores, Delete is presented per-store (submenu or
  store-scoped prompt).
- **Bulk delete** — Exists (keep). Multi-select + per-store
  bulk-delete with the cross-store guard from SPEC-004
  (`offers.bulkDelete.crossStoreWarning` / `crossStoreTooltip`). The
  `select` column and `enableRowSelection` stay. **Difference from
  vendor B2C**, which dropped bulk select entirely — admin keeps it
  because bulk delete is the admin's primary moderation lever.
- **Delete flow** — kebab/bulk → `usePrompt` → mutate → toast. Reuse the
  SPEC-004 per-store delete (grouped by `seller_id`).
- **Pagination footer** — Exists. Page size **10** (`OFFERS_PAGE_SIZE`).
- **Empty state** — Exists (SPEC-004): "No offers yet" / "Stores haven't
  published any offers on this marketplace yet." (no Create CTA). Reuse.

#### Implementation — back the list with the admin **product** endpoint

Mirror SPEC-009 §"Implementation — back the list with the vendor product
endpoint", with the seller scope **removed** (admin sees all sellers)
and an optional store filter **added**:

1. **Query config** requests offers nested under variants —
   `variants.offers.*` (incl. `variants.offers.seller.*` so the Store
   column/Variants-table Store cell can render) in
   `packages/core/src/api/admin/products/query-config.ts`.
2. **`withOffers` flag** in the admin products `GET` handler
   (`packages/core/src/api/admin/products/route.ts`) — detect the
   nested-offer request, strip it from the graph fields before
   `query.graph`, then re-attach via the wrap after the graph runs,
   beside the existing `enrichProductAttributes` call. Same
   strip-then-wrap shape as vendor.
3. **`wrapProductVariantsWithOffers(scope, products, { sellerId? })`** —
   new helper in `packages/core/src/api/admin/products/helpers.ts`
   (admin variant). Collects every `variant.id` on the page, runs **one**
   bounded `query.graph({ entity: "offer", … })` filtered by
   `variant_id IN [...]` **and** — *only when a `seller_id`/store filter
   is present* — `seller_id = <store>`; otherwise **no seller filter**
   (all sellers). Includes `offer.seller.*`. Builds a
   `Map<variant_id, OfferDTO[]>` and assigns `variant.offers` in place.
   The seller scope is **why offers are stripped from the raw graph**:
   the admin still wants a bounded, well-shaped attach (with
   `offer.seller`), not a raw traversal.
4. **Scope the product set to products that have an offer** — the bare
   `GET /admin/products` returns the whole catalogue. The Offers list
   adds a **`?has_offer=true`** filter (admin variant of SPEC-009's
   `applySellerOfferedProductsFilter`, **without** the seller scope):
   resolve the set of variant ids that have **any** offer
   (`query.graph({ entity: "offer", fields: ["variant_id"] })`,
   optionally filtered by the active store), then constrain the product
   query to `filters: { variants: { id: offeredVariantIds } }`. When the
   **Store filter** is set, resolve the offered variant ids **for that
   seller only**, so the list collapses to that store's product
   listings.
5. **Column derivation** — Store(s) from the distinct
   `variants.flatMap(v => v.offers).map(o => o.seller)`;
   Product/Category/Collection/Status from the product; **Variants** =
   `variants.filter(v => v.offers?.length).length`. Row → product-shaped
   detail (`/offers/:product_id`).

Wire the wrap on **both** admin product GET handlers — the list
(`route.ts`) and the detail (`[id]/route.ts`) — behind the same
`withOffers` flag.

#### Multiple offers per variant — row = offer (no unique constraint)

Identical to SPEC-009: `variant.offers` is an **array** (the `Offer`
model permits multiple offers per `(seller, variant)` with distinct
SKUs). The offer-detail **Variants table renders one row per offer**;
the Offer Variant route keys on **`offer_id`**, never `offers[0]`. No
new constraint. In admin, because the wrap is non-seller-scoped, a
single variant's `offers[]` may also span **multiple sellers** — the
Variants table's **Store** column disambiguates those rows.

### Offer detail — product-shaped (vendor ref `40016489:637892`)

> **This page does not exist in its B2C shape today.** Shipped
> `/offers/:id` is a *variant*-shaped `TwoColumnPage`. The target is a
> **product**-shaped page, read-only.

Target layout: wide main column + narrow sidebar.

- **Details** (`<Container className="divide-y p-0">`) —
  **Different / Missing.**
  - Header: product **Title** + `StatusBadge` (`product.status`) +
    kebab.
  - Kebab — **Delete only** (no Edit; admin read-only). Delete removes
    the relevant store's offers on the product (per-store; when multiple
    stores offer the product, scope per store).
  - Body `Info Row`s: **Description / Subtitle / Handle / Discountable**
    — product fields from `GET /admin/products/:id` + offer wrap.
    Replaces the shipped offer General (SKU/EAN/UPC/shipping profile).
- **Media** (`<Container>`) — **Missing.** Read-only grid of product
  image thumbnails. (Reuse the product media section in **read-only**
  mode — no edit kebab/selection/links, mirroring SPEC-009's `readOnly`
  prop on `ProductMediaSection`.)
- **Variants** (`<Container className="divide-y p-0">`) — **Missing.**
  Table, **one row per offer** across the product's offered variants
  (`variants.flatMap(v => v.offers.map(o => ({ variant: v, offer: o })))`):
  - Columns: **Store** (admin-only — `offer.seller`) · **Title**
    (variant thumbnail + title) · **SKU** · **one column per product
    option** (Size, Color, …) · **Inventory** (kit glyph for inventory
    kits, red text at zero) · row kebab (**Delete only**).
  - Row → **Offer Variant detail** keyed by offer id
    (`/offers/:id/variants/:offer_id`).
  - Search / sort / Created-Updated date filters applied **in memory**
    over the wrapped rows (parity with SPEC-009's
    `offer-variants-section.tsx`), plus a **Store** filter (admin-only)
    since rows can span sellers.
  - Header kebab — admin has no bulk Edit Price / Edit Stock Levels
    (read-only); header carries no edit actions (or Delete-all-for-store
    if desired). 
- **Sidebar:**
  - **Associated product** (`<Container className="p-0">`) — **Missing.**
    Pattern-A card linking to the admin product page (`/products/:id`).
  - **Store** card — **Keep (admin-only).** Lift the shipped
    `offer-store-sidebar.tsx` (seller name/handle + **Open store**).
    When the product is offered by multiple stores, render a stores
    summary (or hide when the Store filter pins a single store).

There is **no Metadata/JSON section** in the design.

### Offer **Variant** detail (vendor ref `40016491:703365`) — NEW PAGE, read-only

> The closest thing today is the shipped variant-shaped `/offers/:id`
> detail. In B2C this becomes a **sub-page** keyed by the offer:
> `/offers/:id/variants/:offer_id` (`:id` = product id, `:offer_id` =
> the specific offer). The route does not exist. **Admin renders it
> read-only.**

Target: `TwoColumnPage`. Breadcrumb `Offers › <product> › <variant>`.

Main column:

- **General** (`<Container className="divide-y p-0">`) — Different.
  Heading = variant title + "**Offer Variant**" sub-label; **read-only**
  kebab (no **Edit Details** — admin cannot edit). Rows: **SKU** + one
  row **per option** (Size/Color badges).
- **Media** — Missing. Read-only variant media grid.
- **Inventory items** (`<Container className="divide-y p-0">`) —
  Exists ≈. Lift the shipped admin `offer-inventory-section.tsx`
  (Title · SKU · Required quantity · Inventory), **read-only** (no
  "Manage Inventory Items" header kebab — admin cannot edit the kit).

Sidebar:

- **Shipping Configuration** card — Missing. Read-only card (shipping
  profile name + subtitle); **no Edit kebab**.
- **Price** card (`<Container className="divide-y p-0">`) — Exists ≈.
  Lift the shipped admin `offer-pricing-section.tsx` (currency rows,
  Show more); **no Edit Price kebab**.
- **Store** card — Keep (admin-only): the offer's seller.

## Cross-cutting differences (summary)

| Theme | B2C target (vendor) | Admin today (SPEC-004) | Admin verdict |
| --- | --- | --- | --- |
| Offer grain | product (N variants) | single variant | Different — product endpoint + non-seller-scoped wrap (offer stays per-variant, no schema change) |
| Seller scope | active seller only | all sellers (Store column) | Admin keeps all-sellers; wrap is **non-seller-scoped**, with optional `?seller_id` store filter |
| List backing | `/vendor/products` + `withOffers` | `/admin/offers` per-variant rows | Different — migrate to `/admin/products` + admin `withOffers` |
| List columns | Product/Category/Collection/Variants/Status | Store + variant title + SKU + shipping profile + status | Different — Product-grained + **Store** column; drop SKU/shipping-profile |
| Mutations | full CRUD (create/edit/delete) | **read-only** + per-store bulk delete | Admin stays **read-only**; only delete (per-offer + per-store bulk) |
| Create wizard | Products → Stock Levels & Prices | none | **Out of scope** — admin doesn't create |
| Edit drawers / bulk grids / kit builder | yes | none | **Out of scope** — admin doesn't edit |
| Offer detail | product-shaped (Details/Media/Variants + Associated product) | variant-shaped (General/Inventory + Variant/Store/Prices) | Missing (new page) — read-only; + Store sidebar card |
| Offer Variant detail | dedicated editable sub-page | none | Missing (new route) — **read-only** |
| Bulk select | dropped | kept (per-store, cross-store guard) | Admin **keeps** bulk select for moderation |

## Backend

> Admin variant of SPEC-009's backend slice. **No schema change, no
> migration, no unique constraint.** Two pieces: the wrap helper and the
> `has_offer` list filter, both on the admin product endpoint, plus
> confirming the per-store bulk-delete endpoint.

1. **`wrapProductVariantsWithOffers`** (`packages/core/src/api/admin/products/helpers.ts`)
   — clone of the vendor helper with the `seller_id` filter made
   **optional** (present only when the request carries a store filter)
   and `offer.seller.*` added to the attached payload. Bounded
   `query.graph` over `entity: "offer"` filtered by `variant_id IN`
   (+ optional `seller_id`), keyed onto variants in place.
2. **`withOffers` strip-then-wrap** wired on `GET /admin/products`
   (`route.ts`) and `GET /admin/products/:id` (`[id]/route.ts`), beside
   `enrichProductAttributes`. Triggered when `fields` includes
   `variants.offers`.
3. **`has_offer` list filter** (`packages/core/src/api/admin/products/middlewares.ts`
   + `validators.ts`) — admin variant of `applySellerOfferedProductsFilter`
   **without** the seller scope (resolve all offered variant ids,
   constrain `variants.id IN`); when a `seller_id` store filter is also
   set, resolve offered variant ids for that seller only.
4. **Per-store bulk delete** — confirm/implement
   `POST /admin/sellers/:id/offers/bulk-delete` (SPEC-004 deferred it;
   the list currently fans out `DELETE /admin/offers/:id` via
   `Promise.allSettled` in `useBulkDeleteOffers`). The product-shaped
   list's per-row + bulk Delete can keep the `Promise.allSettled`
   fan-out (no new endpoint required) **or** adopt the per-store
   endpoint if/when it lands. Either way deletion stays **per store**.

   The admin offer endpoints (`GET/DELETE /admin/offers*`) are **not
   removed** — the product-shaped reads move to the product endpoint, but
   delete still targets `/admin/offers/:id`.

## Frontend — admin panel redesign (read-only, ported from vendor)

Treat the admin offer pages as a **thin, read-only offer-aware layer
over the admin product read surface**, ported from the SPEC-009 vendor
pages. The user-facing instruction — *"use the same components and
patterns and hooks from the vendor panel"* — means: **port the vendor
offer page structure into `@mercurjs/admin`** (the two packages don't
share page components; shared primitives live in
`@mercurjs/dashboard-shared`), swapping `sdk.vendor.*` → `sdk.admin.*`
and stripping every write surface.

### Reads & hooks

- **Reuse the admin product hooks** `useProducts(query)` /
  `useProduct(id, query)` (`packages/admin/src/hooks/api/products.tsx`,
  already route-based SDK) for the list + product-shaped detail + variant
  detail reads, with `variants.offers.*` + the `withOffers` wrap.
- Add offer-aware field constants in `pages/offers/common/constants.ts`:
  - `OFFER_PRODUCT_LIST_FIELDS` — product identity + `*categories`,
    `*collection`, `variants.id`, `variants.offers.id`,
    `variants.offers.seller.*` (Store column).
  - `OFFER_PRODUCT_DETAIL_FIELDS` — the above + product Details
    (`description,subtitle,handle,discountable`), `*images`, and the
    per-offer payload the Variants table + variant detail need
    (`variants.offers.sku`, `variants.offers.shipping_profile.*`,
    `variants.offers.prices.*`, `variants.offers.inventory_item_link.*`,
    `variants.offers.seller.*`, `variants.options.*`).
- **Keep the read/delete hooks** in `hooks/api/offers.tsx`: `useOffers`
  (still used where a raw offer read is convenient), `useOffer`,
  `useDeleteOffer`, `useBulkDeleteOffers`. **No create/update hooks** —
  admin is read-only. After any delete, invalidate **both** the offer
  query keys **and** the product query keys
  (`productQueryKeys.lists()` / `.detail(productId)`).

### Routing (`packages/admin/src/get-route-map.tsx`)

`:id` changes meaning from **offer-id → product-id** (the detail is
product-shaped) — a breaking change to saved `/offers/<offerId>` admin
deep links; call it out in the PR.

```
/offers                                   → product-endpoint list (read-only)
/offers/:id                               → product-shaped offer detail (read-only)
                                            (:id = product_id; loader → sdk.admin.products.$id + withOffers)
  └── variants/:offer_id                  → Offer Variant detail (NEW, read-only; keyed by offer id)
```

No `edit` / `pricing` / `inventory` / `edit-price` / `edit-stock`
children — admin has no edit surfaces. (Contrast SPEC-009's vendor tree,
which hangs four edit routes + two bulk grids off these nodes.)

### List page (`pages/offers/offer-list-page.tsx` + `_components/`)

- Swap the data source from `useOffers` to `useProducts` with
  `OFFER_PRODUCT_LIST_FIELDS` + `has_offer: "true"`; page size 10.
- `use-offer-table-columns.tsx` → **Store** (admin-only, distinct
  sellers) / **Product** / **Category** / **Collection** / **Variants**
  (offered count) / **Status** / row kebab. Keep the `select` column
  (bulk delete). Drop the shipped `sku` + `shipping_profile` columns.
  `navigateTo={(row) => row.id}` (product id).
- `use-offer-table-filters.tsx` → **Store** (`seller_id`, kept) +
  **Category** / **Collection** / **Type** / **Tag** / **Status** /
  **Created** / **Updated**. Drop `shipping_profile_id` + `sku`.
- `offer-actions.tsx` → **Open store** + **Delete** (per store).
- Keep the per-store bulk-delete command + cross-store guard.

### Offer detail page (`pages/offers/[id]/offer-detail-page.tsx`)

Rebuild as a `TwoColumnPage` over the admin product DTO:

- **Main**: `OfferDetailGeneralSection` (Details rows + status badge +
  **Delete-only** kebab) → `OfferMediaSection` (product media,
  **read-only**) → `OfferVariantsSection` (one row per offer; **Store**
  column; row → `variants/:offer_id`; row kebab **Delete-only**).
- **Sidebar**: `OfferAssociatedProductSection` (Pattern-A card →
  `/products/:product_id`) + **Store** card (lift
  `offer-store-sidebar.tsx`).
- Compound-export every slot (`Object.assign(Root, { … })`).

### Offer Variant detail page (`pages/offers/[id]/variants/[offer_id]/`) — NEW, read-only

`TwoColumnPage`, resolving the offer off the product query by
`offer_id`:

- **Main**: `OfferVariantGeneralSection` (variant title + "Offer
  Variant" sub-label; **read-only**, no Edit kebab; SKU + per-option
  rows) → Media (read-only) → **Inventory items** (lift the shipped
  admin `offer-inventory-section.tsx`, read-only).
- **Sidebar**: **Shipping Configuration** card (read-only) + **Price**
  card (lift the shipped admin `offer-pricing-section.tsx`, read-only) +
  **Store** card.

### Folder layout — target

```
pages/offers/
  offer-list-page.tsx                       # now product-backed (read-only)
  common/constants.ts                        # + OFFER_PRODUCT_*_FIELDS
  _components/                               # list columns/filters/query → products; Store column kept
  [id]/
    offer-detail-page.tsx                    # product-shaped (read-only)
    loader.ts                                # sdk.admin.products.$id + withOffers
    _components/
      offer-detail-general-section.tsx       # Details rows, Delete-only kebab
      offer-media-section.tsx                # read-only product media
      offer-variants-section.tsx             # one row per offer; Store column; Delete-only kebab
      offer-associated-product-section.tsx   # Pattern-A sidebar card
      offer-store-sidebar.tsx                # kept (admin-only)
    variants/[offer_id]/                     # NEW Offer Variant detail (read-only, keyed by offer id)
      offer-variant-detail-page.tsx
      loader.ts, breadcrumb.tsx
      _components/{general,inventory,shipping-card,price-card,store-card}-section.tsx
```

### Migration order (slices)

1. **Backend** — admin `withOffers` wrap + `has_offer` filter (+ confirm
   per-store bulk delete). Without the wrap the reads return nothing
   useful. **No migration, no constraint.**
2. **List** → product-backed (`useProducts`, new columns incl. Store);
   keep bulk delete.
3. **Offer detail** (product-shaped, read-only) — Details / Media /
   Variants + Associated product + Store sidebar.
4. **Offer Variant detail** (read-only) — General / Media / Inventory +
   Shipping / Price / Store sidebar cards.

Each slice builds and ships independently; old offer-id deep links 404
after slice 3 (documented breaking change).

## Integration tests — admin `wrapProductVariantsWithOffers` + `has_offer`

The backend slice carries dedicated coverage. Add a vendor-style admin
suite (e.g. `integration-tests/http/product/admin/offer-products.spec.ts`)
seeding via existing helpers. Cases:

1. **Wrap attaches offers (all sellers)** — sellers A and B both offer
   the **same shared variant** V of product P (distinct SKUs).
   `GET /admin/products/:P?fields=…,variants.offers.*` returns V's
   `offers` array containing **both** A's and B's offers (each with
   `offer.seller`), and every other variant returns `offers: []`. This
   is the **inverse** of the vendor isolation test — admin must **not**
   scope to one seller.
2. **Store-scoped wrap** — the same request with `?seller_id=A` returns
   V's `offers` containing **only A's** offer. Proves the optional store
   filter.
3. **Multiple offers per variant** — one seller, two distinct-SKU offers
   on V → `offers.length === 2`.
4. **`withOffers` off** — request without `variants.offers.*` returns
   variants with no `offers` key (flag/strip path inert).
5. **`has_offer` filter** — seed offers on P1, P2 out of a larger
   catalogue (P3, P4 with none). `GET /admin/products?has_offer=true`
   returns **exactly {P1, P2}** (all sellers). With
   `?has_offer=true&seller_id=A`, returns only the products **A** offers.
6. **Wrap on both routes** — cases 1–3 run against both
   `GET /admin/products` and `GET /admin/products/:id`.

## Design-system conformance notes

Every new admin surface follows the dashboard contract (see
`packages/admin` UI skills): `TwoColumnPage` detail hosts; sections as
`<Container className="divide-y p-0">` with
`flex items-center justify-between px-6 py-4` headers; `DataTable` +
`useDataTable` with `PAGE_SIZE` matched to the footer copy; `StatusBadge`
/ `ProductStatusCell` for status; Pattern-A sidebar cards
(`shadow-elevation-card-rest bg-ui-bg-component rounded-md` + `<Link>` +
`TriangleRightMini`); `ActionMenu` for kebabs; `NoRecords` / `NoResults`
empty states; only `@medusajs/icons`, only Medusa UI tokens; every
string through `t(...)` under `offers.*`; kebab-case `data-testid` on
every interactive element. **No edit primitives** (no `RouteDrawer` /
`RouteFocusModal` / `DataGrid` / `KeyboundForm`) — admin is read-only.

## User-Visible Behavior

An operator opens **Offers** and sees a list of **product offers across
the whole marketplace** — one row per offered product, showing which
**store(s)** list it, plus category, collection, variant count, and
publish status, filterable by store. Opening one lands on a **read-only
product-shaped offer detail**: product details, media, and a **variants
table** (one row per offer, with a Store column). Selecting a variant
opens a **read-only Offer Variant** sub-page showing that offer's SKU,
options, media, inventory items, price, shipping configuration, and
store. The operator cannot create or edit offers; the only action is
**delete**, scoped per store (per-row and bulk).

## Verification

> Cannot be executed until the screens are built. When implementing,
> verify each screen against its **vendor B2C** reference frame
> (admin Figma offers page is empty) and record evidence below.

1. **Admin product offer wrap (all sellers)** — both
   `GET /admin/products` and `GET /admin/products/:id` with
   `variants.offers.*` return each variant with `offers[]` populated from
   **every** seller (two sellers on one shared variant both appear);
   `?seller_id=X` scopes to one store. Covered by the integration suite.
2. **`has_offer` scoping** — `GET /admin/products?has_offer=true` returns
   only products with at least one offer; `+&seller_id=X` returns only
   that store's offered products.
3. **List** — `/offers` renders Store / Product / Category / Collection /
   Variants / Status off the product endpoint; row → product-shaped
   detail; filter (incl. Store) / search / sort / pagination behave;
   per-store bulk delete + cross-store guard work; **no Create CTA**.
4. **Offer detail** — Details / Media (read-only) / Variants (Store
   column) + Associated product + Store sidebar render; Variants row →
   variant sub-page; Delete (per store) works; **no edit affordances**.
5. **Offer Variant detail** — `/offers/:id/variants/:offer_id` renders
   General (SKU + option rows) / Media / Inventory items + Shipping
   Configuration + Price + Store sidebar cards, **all read-only**.
6. **Build** — `bun run lint` and `bun run build` pass.
7. **Tests** — the admin wrap + `has_offer` filter carry integration
   coverage under `integration-tests/http/product/admin/`.

## Evidence

### Implemented (2026-06-12) — branch `feat/admin-offers-b2c` off `origin/canary`

**Backend (Slice 1)** — `packages/core/src/api/admin/products/`:
- `helpers.ts` — new `wrapProductVariantsWithOffers(scope, products, sellerId?)`:
  platform-wide by default (attaches **every** seller's offers, each with
  `offer.seller`), bounded `query.graph` over the page's variant ids,
  keyed onto variants in place; `offers: []` when none.
- `route.ts` + `[id]/route.ts` — `withOffers` strip-then-wrap on both GET
  handlers, beside `enrichProductAttributes`.
- `validators.ts` — `has_offer: booleanString()` pseudo-filter.
- `middlewares.ts` — `applyOfferedProductsFilter` on `GET /admin/products`:
  scopes products to those with any offer; when `seller_id` is present it
  is reinterpreted as the **offer's store** (consumed, so it never filters
  products by ownership) and the offered-variant set is resolved for that
  seller.

**Frontend (Slices 2–4)** — `packages/admin/src/pages/offers/`:
- List → `useProducts` + `OFFER_PRODUCT_LIST_FIELDS` + `has_offer`;
  columns **Store** (distinct sellers via `SellerCell`) / Product /
  Category / Collection / Variants (offered count) / Status, select kept;
  filters Store + Category/Collection/Type/Tag/Status/Created/Updated;
  row kebab **Open store** (single-store) + **Delete**; per-row + bulk
  delete collect offer ids across the product's variants.
- Product-shaped detail (`[id]/`) — `TwoColumnPage`: Details (Delete-only
  kebab) + read-only `OfferMediaSection` + `OfferVariantsSection`
  (one row per offer, **Store** column, Delete-only, row →
  `variants/:offer_id`) | sidebar **Associated product** + **Stores** card.
- Offer Variant detail (`[id]/variants/[offer_id]/`) — **read-only**
  `TwoColumnPage`: General (SKU + options, no Edit) + reused
  `OfferInventorySection` | reused `OfferPricingSection` + read-only
  Shipping Configuration card + reused `OfferStoreSidebar`. Loaded by
  offer id from `/admin/offers/:id`. Route wired in `get-route-map.tsx`.
- i18n (`en.json` + `$schema.json`): `offers.fields.variants` /
  `variantsCount`, `offers.detail.{associatedProduct,stores,offerVariant,
  shippingConfiguration}`, `offers.delete.*`.

**Tests** — `integration-tests/http/product/admin/offer-products.spec.ts`
(6 cases): wrap attaches **all** sellers' offers on a shared variant (the
inverse of the vendor isolation test) with `offer.seller` populated;
multiple offers per variant kept; wrap inert without `variants.offers`;
`?has_offer=true` returns only offered products (any seller);
`?has_offer=true&seller_id=X` scopes the product set to one store; wrap
applies on list rows too.

**Verification:**
- `bun run build` (turbo, all 9 packages) → **9/9 successful** (core tsc +
  codegen; admin ESM + DTS type-check clean).
- `oxlint` on all newly authored files → clean. (Pre-existing warnings in
  the reused `offer-inventory-section.tsx` from SPEC-004 are untouched.)
- `bun run test:integration:http http/product/admin/offer-products` →
  **1 suite, 6 tests passed** (31.3s).

### Implementation decisions / deviations from the draft

1. **The wrap attaches all sellers' offers unconditionally; the Store
   filter narrows the product set, not the attach.** The helper keeps an
   optional `sellerId` param, but both admin routes call it without one.
   So `?seller_id=X` collapses the *list* to that store's offered products
   while the detail's Variants table still shows every store's offers on a
   variant (disambiguated by the Store column) — an operator overview, not
   a per-store filter on the attach. Per-store scoping of the attach is a
   future option (the helper already supports it).
2. **Bulk delete is product-row-grained without the SPEC-004 cross-store
   guard.** Since rows are products (potentially spanning stores), the
   cross-store selection guard no longer maps; selecting product rows
   collects their offer ids (all stores) and removes them via the existing
   per-offer DELETE fan-out (`useBulkDeleteOffers`). The dedicated
   `POST /admin/sellers/:id/offers/bulk-delete` endpoint remains deferred
   (as in SPEC-004).
3. **Media is a dedicated read-only `OfferMediaSection`**, not the admin
   product detail's editable `ProductMediaSection` (which has no `readOnly`
   prop) — admin offers never mutate product media.

### Review fixes (PR [mercurjs#981](https://github.com/mercurjs/mercur/pull/981))

- **Deduplicated the backend** — the wrap and the offered-products filter
  now live once in `packages/core/src/api/utils/offers.ts` and are reused
  by both the vendor and admin product endpoints.
  `wrapProductVariantsWithOffers(scope, products, sellerId?)` takes an
  optional seller (vendor passes the active seller; admin passes none —
  platform-wide). `applyOfferedProductsFilter` reads the seller scope from
  `req.seller_context` (vendor) or the `seller_id` query param (admin Store
  filter). The admin `helpers.ts` duplicate and the vendor
  `applySellerOfferedProductsFilter` copy were removed.
- **Canonical DTOs** — `OfferDTO` (`@mercurjs/types`) gained the
  documented-but-missing `seller` / `product_variant` / `shipping_profile`
  relations. The admin offer types now compose `OfferDTO` /
  `ProductVariantDTO` instead of ad-hoc local shapes (the offers array is
  `OfferDTO[]`; the variant General section types its variant as
  `ProductVariantDTO`; the Shipping card consumes `OfferDTO["shipping_profile"]`).
- Re-verified: `bun run build` → 9/9; `offer-products` suites (admin +
  vendor) → **13 tests passed**.

### Design revisions (post-review feedback)

- **List Store column removed.** The Offers list no longer renders a Store
  column (rows are product-grained; a product can span stores). The Store
  **filter** (`seller_id`) and the row "Open store" action (when a single
  store offers the product) are kept.
- **Detail "Stores" sidebar card removed.** The product-shaped offer detail
  sidebar now shows only the Associated-product card. (`offers.detail.stores`
  i18n key removed.)
- **Media reuses the product detail's `ProductMediaSection`.** A `readOnly`
  prop was added to the admin `ProductMediaSection` (mirroring the vendor
  panel) and the offer detail consumes it, replacing the bespoke
  `OfferMediaSection` so the media grid/empty-state matches the product
  detail exactly.
- **Variants-section header border.** The section `Container` now uses
  `divide-y p-0` (matching the admin product variant-section) so the header
  is separated from the table by a border.

### Known follow-ups
- Runtime QA of the admin Offers screens in the live dashboard (the
  backend wrap/filter is integration-covered; the UI is type-checked +
  build-clean but not exercised headlessly).
- Optional: per-store scoping of the wrap attach + the
  `POST /admin/sellers/:id/offers/bulk-delete` endpoint if operators want
  store-isolated deletes.

## Notes

- The admin offers Figma page (`parLCIou6t4gBbCNS2Bsc4`, node
  `40016105:57669`) is **empty**; the canonical reference is the
  **vendor B2C** offers design. Re-audit against a dedicated admin design
  if one is produced.
- This is the **admin analogue of SPEC-009** with two systematic
  deltas applied across every screen: **read-only** (drop create wizard,
  all edit drawers/grids, the kit builder; keep only delete) and
  **platform-wide** (the non-seller-scoped wrap + the first-class
  **Store** column/filter/sidebar carried over from SPEC-004).
- Reuse keeps the blast radius down: the admin already ships the
  read-only Inventory-items table, the Price sidebar card, the Store
  sidebar card, the per-store bulk-delete flow, and route-based
  `useProducts`/`useProduct` hooks — the work is mostly a read-layer +
  routing rebuild plus porting the vendor offer page skeleton, minus
  every write surface.
- **No `manage_inventory` / `allow_backorder` work** and **no schema
  change** — same as SPEC-009. `Offer` stays 1:1 with a variant; the
  product grouping is entirely read-layer.
