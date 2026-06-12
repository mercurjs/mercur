---
status: in_progress
canonical: false
priority: 2
area: vendor/offers
created: 2026-06-11
last_updated: 2026-06-12
---

# SPEC-009 Vendor Offers — B2C Figma vs Implementation Gap

This spec audits the **Offers** surface of `@mercurjs/vendor`
(`packages/vendor/src/pages/offers`) against the canonical Figma file
*Mercur 2.0 — Vendor Panel **B2C*** → *Offers*
(`figma.com/design/sYJoh84Owr5tomRjpxG0no`, page node
`40016404:290481`). It lists every screen the design covers, classifies
each one against the current implementation as **exists / different /
missing / dead**, and records the work needed to bring the vendor panel
in line with the design.

It is intentionally **descriptive, not prescriptive**: the design is the
source of truth for what should exist; the code paths cited below are
what exists today. Any decision that diverges from the design must be
captured here (or in a child spec) with a documented reason — silent
drift fails the audit.

## Relationship to SPEC-002 / SPEC-003

The offer surface already shipped once, against an **earlier B2B
redesign** captured in **SPEC-003** (file
`wA3p6jDQ9dE7PPnaNMIJKD`, "Mercur 2.0 - B2B Extention"). SPEC-003 is
`passing`. The B2C design audited here is a **different Figma file** and
a **materially different information architecture** — it is not a visual
refresh of the B2B offer pages, it reshapes the domain surface. Where
the two designs conflict, **this spec does not silently override
SPEC-003**. The headline tension (offer-as-variant vs. offer-as-product)
is resolved **without a schema change** — `Offer` stays 1:1 with a
variant, and the product-grained surface is rendered by backing the list
and detail with the vendor **product** endpoint and wrapping each
variant with the seller's offers (`wrapProductVariantsWithOffers`). So
SPEC-002's contracts are untouched. See
§"Domain-model gap — the headline finding" for the decision and
§"Offers list → Implementation" for the read mechanism.

- **SPEC-002** — offer domain model, endpoint contracts, workflows.
  **Canonical.** This spec defers to it.
- **SPEC-003** — the shipped vendor offer UI (B2B redesign). Documents
  exactly what exists today; this spec's "what exists" column is sourced
  from it and from the live code.
- **SPEC-004** — admin offer UI. Out of scope here.

## Domain-model gap — the headline finding

> **This is the blocking decision. Read it before scoping any UI work.**

The current `Offer` model
(`packages/core/src/modules/offer/models/offer.ts`) is **1:1 with a
single master variant**:

```ts
const Offer = model.define("Offer", {
  id, seller_id,
  variant_id,            // exactly one master variant
  shipping_profile_id,   // one profile per offer
  sku, ean, upc,         // one identity per offer
  created_by, metadata,
})
```

One offer = one `(seller, variant)` pair, with its own SKU, EAN, UPC,
shipping profile, price set, and inventory-item links. SPEC-002 §scope
removal (2026-05-20) deliberately stripped `manage_inventory`,
`allow_backorder`, and `prices` off the shared `ProductVariant` and
moved the commercial surface onto this per-variant `Offer`.

The **B2C design models an offer as a product that spans multiple
variants.** Concretely, in the new design:

- The **list** row is a *product* — the Product cell renders the
  **product title** (the mock's "Offer Name" is placeholder text, not a
  separate offer-level name; offers have no title of their own), with
  Category, Collection, "**8 variants**", "Published" — not a variant.
- The **offer detail page** is product-shaped: product Details
  (Description / Subtitle / Handle / Discountable), product **Media**,
  and a **Variants table** with one row per variant. It links out to an
  "Associated product".
- A new **Offer Variant detail page** sits one level below the offer.
  *That* page is what the current single-variant offer detail page
  roughly corresponds to (SKU, options, media, inventory items, price,
  shipping profile).
- The **Edit Offer Variant** drawer in the design shows **`Manage
  inventory`** and **`Allow backorders`** toggles — the exact fields
  SPEC-002 removed from the variant. **These two toggles are NOT being
  shipped** (product direction); the drawer ships with SKU only. See the
  Edit Details audit.

So the B2C design wants an offer to be a **`(seller, product)`
aggregate** owning **N "Offer Variants"**, where each Offer Variant
carries the `sku / price set / shipping profile / inventory-item links /
manage_inventory / allow_backorder` that today live on the single
`Offer` row.

**Three ways to reconcile:**

1. **Group-only via the product endpoint + offer wrap (no schema
   change).** Keep `Offer` 1:1 with a variant. Render the "offer =
   product" surface purely in the read layer: back the list and the
   product-shaped detail with the **vendor product endpoint**, and
   attach the seller's offers under each variant with a
   `wrapProductVariantsWithOffers` helper (the `withOffers` flow detailed
   below). The "Offer Variant" page is the existing single-offer detail
   page. **No migration, no new column.** Cost: offer-level concepts
   (the "Associated product" card, the variants-count column) are
   derived from the wrapped product graph. (`manage_inventory` /
   `allow_backorder` are **not shipped** — the design's two toggles are
   dropped per product direction, so no offer-side field is needed.)
2. **New parent entity.** Introduce an `Offer` parent
   `(seller, product)` and rename today's row to `OfferVariant`
   `(offer, variant)`. Most faithful to the design; largest migration
   and the biggest blast radius across SPEC-002 workflows, cart
   integration, and SPEC-004 admin.
3. **Reject the product framing.** Treat the B2C "offer" purely as a
   presentation grouping and keep the entity per-variant forever;
   document the design's product-level fields as product-page concerns
   reachable via the "Associated product" link. Closest to what
   SPEC-003 already shipped.

### Decision — option 1 (product endpoint + offer wrap, no schema change) ✅

**Chosen approach: option 1.** Keep `Offer` 1:1 with a variant
(preserving SPEC-002's cart / commission / payout contracts untouched)
and build the product-grained surface entirely in the read layer: the
list and the product-shaped detail read from the **vendor product
endpoint**, with the active seller's offers attached under each variant
by `wrapProductVariantsWithOffers` (`withOffers` flow). **No `product_id`
column and no migration are needed** — the product grouping comes from
the product endpoint itself, and the offer→variant relationship is all
the wrap needs (it fetches the seller's offers by `seller_id` +
`variant_id`, keyed onto each product's variants).

The full read mechanism — `withOffers` flag, the wrap helper, seller
scoping, and scoping the list to **products the seller actually offers**
(via the seller's offered *variant ids*, not a product column) — is in
§"Offers list → Implementation — back the list with the vendor product
endpoint".

**No further backend changes for this surface.** `Offer` stays 1:1 with
a variant, a seller may hold multiple offers per variant (distinct SKUs —
no unique constraint; see §"Multiple offers per variant"), and the
design's `manage_inventory` / `allow_backorder` toggles are **not
shipped**. So the entire backend footprint is the `wrapProductVariantsWithOffers`
helper + the seller-offered product filter; everything else is frontend.

This spec stays `not_started` until the screens below are scoped/built,
but the **domain question is resolved** — implementation follows option
1. The per-screen audit notes, per screen, what option 1 specifically
costs (it is the cheapest of the three for every screen).

## Source designs

All frames live in **Mercur 2.0 — Vendor Panel B2C**
(`fileKey sYJoh84Owr5tomRjpxG0no`), page node `40016404:290481`
("↳ Offers 🟢"). Canonical component symbols sit in the *Parent
Components* frame (`40016404:296712`); flow frames reference them.

| Surface | Canonical symbol | Notable flow frames |
| --- | --- | --- |
| Offers list — main view | `40016480:616844` ("Offers") | `40016404:290565` (default); `40016482:523228` (filter open); `40016482:525367` (filter values); `40016482:527543` (row kebab); `40016503:756062`→`758202`→`887317` (Delete → Prompt → Toast) |
| Create Offer — Products (Master Catalogue) | `40016485:395969` ("Master Catalogue") | `40016485:281650` (tab), `40016485:453778` (filter menu) |
| Create Offer — Stock Levels & Prices | `40016485:528987` ("Stock Levels & Prices") | `40016485:530743`, `40016485:532222` |
| Create Offer — toast/state | — | `40016404:297171` ("Create Offer - State") |
| Offer detail (product-shaped) | `40016489:637892` ("Product Details", 1245 tall) | `40016489:640014` (read), `40016491:701157`/`40016489:640874` (kebabs), `40016491:694469` (toast) |
| Offer detail — Edit Price | `40008137:146047` ("Edit Prices") | `40016489:645154` |
| Offer detail — Edit Stock Levels | `40016491:694025` ("Edit Stock Levels") | `40016489:691425` |
| Offer **Variant** detail (NEW) | `40016491:703365` ("Offer Variant Details", 812 tall) | `40016404:290489` (read), `40016491:705355` (price kebab), `40016498:709389` (details kebab), `40016503:749900` (shipping kebab), `40016498:724338` (manage-inventory kebab) |
| Offer Variant — Edit Price | reuses `40008137:146047` | `40016404:290482` |
| Offer Variant — Edit Details (drawer) | `40016498:718479` ("Modal") | `40016498:711395` |
| Offer Variant — Edit Shipping Configuration (drawer) | `40016503:755951` ("Modal") | `40016503:749903` |
| Offer Variant — Manage Inventory Items (One Item / Kit) | `40014196:378442` ("Manage Inventory Items") | `40016404:290495`, `40016404:290515` (kit) |

Reused primitives: a *Toast* (success notification) appears across every
mutate flow; a *Prompt* (`40016503:810125`) backs the destructive
delete; *Filter Menu* / *Select Menu* / *Menu* (kebab) components recur.

## Surface map — what exists today

Current implementation rooted at `packages/vendor/src/pages/offers`
(per SPEC-003 §Realignment, which is canonical for shipped state):

```
offers/
  offer-list-page.tsx                       # SingleColumnPage host
  common/{constants,types,utils}.ts         # OFFERS_PAGE_SIZE=10, OFFER_*_FIELDS, OfferDetail
  common/hooks/use-delete-offer-action.tsx
  _components/
    offer-list-table.tsx                    # Container shell
    offer-list-header.tsx                   # Heading "Offers" + "Create"
    offer-list-data-table.tsx               # _DataTable + filters + sort + bulk delete  (B2C: drop bulk-delete — no select column)
    offer-actions.tsx                       # row ActionMenu  (B2C: Edit prices / Edit stock levels / Delete)
    use-offer-table-columns.tsx             # SHIPPED: select / title / categories / sku / shipping_profile / status / actions
                                            #   B2C TARGET: Product / Category / Collection / Variants / Status / actions  (NO select)
    use-offer-table-filters.tsx             # SHIPPED: shipping_profile_id / sku / created_at / updated_at
                                            #   B2C TARGET: Category / Collection / Type / Tag / Status / Created / Updated
    use-offer-table-query.tsx
  [id]/
    offer-detail-page.tsx                   # TwoColumnPage (variant-shaped, NOT product-shaped)
    loader.ts, breadcrumb.tsx
    _components/
      offer-general-section.tsx             # SKU/EAN/UPC/shipping profile/created/updated
      offer-inventory-section.tsx           # inventory_item_link table
      offer-pricing-section.tsx             # collapsible currency rows (sidebar)
      offer-variant-section.tsx             # "Master variant" card (sidebar)
    edit/      …                            # RouteDrawer: sku + shipping_profile_id
    pricing/   …                            # RouteDrawer: price-set editor
    inventory/ …                            # RouteFocusModal: inventory batch grid
  create/
    offer-create-page.tsx                   # RouteFocusModal host
    create-offer-form/
      create-offer-form.tsx                 # TabbedForm (2 tabs) + batch publish
      create-offer-catalogue.tsx            # one row per VARIANT
      create-offer-stock-levels-and-prices.tsx  # flat DataGrid, one row per variant
      schema.ts
```

Routes in `packages/vendor/src/get-route-map.tsx:534+`:
`/offers`, `/offers/create`, `/offers/:id`, `/offers/:id/edit`,
`/offers/:id/pricing`, `/offers/:id/inventory`. **No `:id/variants/*`
sub-route exists** — there is no Offer Variant detail page today.

Hooks in `packages/vendor/src/hooks/api/offers.tsx`: `useOffers`,
`useOffer`, `useCreateOffer`, `useBulkCreateOffers`, `useUpdateOffer`,
`useBatchOfferInventoryItems`, `useDeleteOffer`, `useBulkDeleteOffers`.

Sidebar: **Offers** nested under **Products**
(`main-layout.tsx:277`) — matches the B2C design's sidebar.

## Status legend

- **Exists** — present and aligned to the design (visual/copy diffs
  noted under *Different*).
- **Different** — implemented but diverges materially (wrong shape,
  missing slot/CTA, different copy).
- **Missing** — no implementation; needs to be built.
- **Dead** — implemented but not wired into the surface.

## Per-screen audit

### Offers list (`40016480:616844`)

Design: `SingleColumnPage` + one `<Container className="divide-y p-0">`
hosting header, a filter/search/sort row, the table, and the pagination
footer.

- **Page shell** — Exists. `OfferListPage` mounts `SingleColumnPage` +
  `Container`.
- **Header** — Exists. `<Heading>` "Offers" left; primary
  `Button size="small"` "**Create**" right (no icon) → `create`.
  Matches.
- **Filter / search / sort row** — Different. Design shows
  `Add filter` (left) + `Search` input + sort icon-button (right),
  laid out as a dedicated row under the header. Shipped uses the legacy
  `_DataTable` chrome; verify the row composition matches (search +
  sort cluster on the right, `Add filter` on the left).
- **Columns** — **Different (structural).** Design column set is exactly
  **Product · Category · Collection · Variants · Status · ⋯ (kebab)** —
  **no selection/checkbox column** (verified against `40016480:616844` /
  `40016404:290565`). The shipped list's leading `select` column **and
  its bulk-delete command must be dropped** for B2C; deletion is per-row
  via the kebab only.
  - **Product** — 24×24 product thumbnail + **product title**
    (`product.title`; the mock's "Offer Name" is placeholder, offers
    carry no name of their own). Maps to the
    shipped `title` column (which shows the *variant* thumbnail + title).
    With the product-endpoint + offer-wrap backing, the list is one row
    per product the seller offers and this cell shows the **product**
    identity, not the
    variant.
  - **Category** — `product.categories[0]?.name`. Shipped has a
    `categories` column ≈ matches.
  - **Collection** — `product.collection?.title`. **Missing** in
    shipped (`OFFER_LIST_FIELDS` doesn't fetch `product.collection`;
    SPEC-003 dropped this column).
  - **Variants** — count, rendered "**8 variants**". **Missing** in
    shipped (no aggregate; SPEC-003 dropped it). With the product-endpoint
    approach (below) the count is **the number of variants the active
    seller has an offer on**, not the product's full variant count — if
    the seller offers 4 of the product's 8 variants, the cell reads
    "4 variants". Derived as `variants.filter(v => v.offers?.length).length`
    after the offer wrap.
  - **Status** — `StatusBadge` "Published" (green). Exists.
  - The shipped **extra** `sku` + `shipping_profile` columns are **not**
    in the B2C list and must be **dropped** (they live on the Offer
    Variant detail page now). The B2C list has no SKU / shipping-profile
    column.
- **Row navigation** — Exists conceptually (`navigateTo`), but the
  target changes: design navigates to a **product-shaped offer detail**
  (`/offers/:id`), not the variant-shaped page shipped today.
- **Filter menu** (`40016482:525329`) — **Different. Confirmed: 7
  filters — `Category` · `Collection` · `Type` · `Tag` · `Status` ·
  `Created` · `Updated`** (all product-level, matching the
  product-endpoint backing). The shipped set
  (`shipping_profile_id / sku / created_at / updated_at`) is **replaced**
  wholesale: drop `shipping_profile_id` + `sku`, add `Category /
  Collection / Type / Tag / Status`, keep `Created / Updated`. These map
  onto product-graph filters (`categories.id`, `collection_id`,
  `type_id`, `tags.id`, `status`, `created_at`, `updated_at`).
- **Sort menu** (`40016482:527505`) — Exists/confirmed. Popover: field
  (**Title / Created / Updated**) + direction (**Ascending 1→30 /
  Descending 30→1**). Shipped keys are `title / created_at / updated_at`
  (note: `title` sort was a documented no-op in SPEC-003 §follow-ups; on
  the product endpoint it sorts by `product.title`, which resolves it).
- **Row kebab** (`40016482:529681`) — **Different. Confirmed: 3 actions —
  `Edit prices` · `Edit stock levels` · `Delete`** (Delete in its own
  group). This is **not** the shipped row menu (Edit / Manage prices /
  Manage inventory / Delete). `Edit prices` / `Edit stock levels` open
  the bulk DataGrid modals (`edit-price` / `edit-stock`) scoped to that
  product's offered variants; `Delete` removes the seller's offers on the
  product.
- **Delete flow** (`756062`→`758202`→`887317`) — Exists. Row kebab →
  `Delete` → `usePrompt` confirmation → success `toast`. Matches the
  `use-delete-offer-action.tsx` pattern.
- **Pagination footer** — Exists. `1 — 10 of 100 results` left;
  `1 of 10 pages` + `Prev`/`Next` right. Page size **10**
  (`OFFERS_PAGE_SIZE`). Matches.
- **Empty state** — Exists (SPEC-003): "No offers yet" / "Create offers
  to start selling on the marketplace" / "Create". The B2C file's main
  list frames show the populated state; reuse the shipped empty state.

#### Implementation — back the list with the vendor **product** endpoint

The list is product-grained but rows must reflect **only the active
seller's offers**. Rather than grouping `/vendor/offers` client-side,
the list page is migrated to the **vendor product endpoint**
(`GET /vendor/products`, `sdk.vendor.products.query`) with the seller's
offers embedded under each variant. This makes the product / category /
collection / variants-count / status columns fall straight out of the
product graph, and the "Variants" cell counts only offered variants.

Mechanism (mirrors Medusa's `withInventoryQuantity` strip-then-wrap flow
in `packages/medusa/src/api/store/products/route.ts` + the
`wrapProductsWithTaxPrices` helper in
`.../store/products/helpers.ts` — both in the `medusa` repo at
`/Users/viktorholik/Desktop/medusa`):

1. **Query config** requests offers nested under variants —
   `variants.offers.*` (plus `variants.offers.prices.*`,
   `variants.offers.shipping_profile.*` as the columns need) in
   `packages/core/src/api/vendor/products/query-config.ts`.

2. **`withOffers` flag** in the vendor products `GET` handler — detect
   the nested-offer request and strip it from the graph fields before
   `query.graph`, exactly like the inventory-quantity flag:

   ```ts
   const withOffers = req.queryConfig.fields.some((f) =>
     f.includes("variants.offers")
   )
   if (withOffers) {
     req.queryConfig.fields = req.queryConfig.fields.filter(
       (f) => !f.includes("variants.offers")
     )
   }
   // … existing query.graph({ entity: "product", … }) …
   if (withOffers) {
     await wrapProductVariantsWithOffers(req, products)
   }
   ```

   The offers are stripped from the graph because the
   `offer ↔ product_variant` link must be **seller-scoped** — a raw
   graph traversal would surface every seller's offers on the shared
   variant. The wrap re-attaches only the caller's own offers.

3. **`wrapProductVariantsWithOffers(req, products)`** — new helper in
   `packages/core/src/api/vendor/products/helpers.ts`, shaped after
   `wrapProductsWithTaxPrices`. It:
   - collects every `variant.id` across the page of products;
   - runs **one** bounded `query.graph({ entity: "offer", … })` filtered
     by `seller_id = req.seller_context!.seller_id` **and**
     `variant_id IN [...]` (the variant ids collected from the page of
     products);
   - builds a `Map<variant_id, OfferDTO[]>`;
   - assigns `variant.offers = map.get(variant.id) ?? []` onto each
     variant in place (same mutate-in-place pattern the tax/inventory
     wraps use).

4. **Scope the product set to the seller's offers** — ⚠️ the bare
   `GET /vendor/products` returns the **master-catalogue union** (every
   `published` product **plus** the seller's own products in any state —
   see `applySellerProductLinkFilter` in
   `packages/core/src/api/vendor/products/middlewares.ts`), which is far
   larger than the offers list. The Offers list must therefore add a
   **"only products this seller has an offer on"** filter — **no offer
   column needed**: resolve the seller's offered **variant ids** with one
   bounded `query.graph({ entity: "offer", filters: { seller_id },
   fields: ["variant_id"] })`, then constrain the product query to
   `filters: { variants: { id: offeredVariantIds } }` (products having
   any variant in that set). Implement as a dedicated list-only
   middleware (e.g. `applySellerOfferedProductsFilter`) or a
   `?has_offer=true` param on the vendor products route bound to the
   active seller. (The product-shaped *detail* page needs no set filter —
   it fetches one product by id and just wraps.) Offer seller-scoping
   itself stays inside the wrap's `query.graph` filter, so a vendor only
   ever sees their own offers attached, never a competitor's.

5. **Column derivation** — the list table reads the wrapped shape:
   Product / Category / Collection from the product; **Variants** =
   `variants.filter(v => v.offers?.length).length`; Status from
   `product.status`. Row navigation targets the product-shaped offer
   detail (which is the same product endpoint with a single `id` filter
   + `withOffers`).

The wrap is wired on **both** vendor-product GET handlers — the list
(`packages/core/src/api/vendor/products/route.ts`) **and** the detail
(`packages/core/src/api/vendor/products/[id]/route.ts`). Both already run
a post-`query.graph` enrichment hook (`enrichProductAttributes`), so
`wrapProductVariantsWithOffers` slots in right beside it behind the same
`withOffers` flag — no new route, just the strip-then-wrap added to each
handler.

This is what powers the **product-shaped offer detail page** and its
**Variants table**: the detail page is `GET /vendor/products/:id` with
`variants.offers.*` + `withOffers`, and its Variants section renders
**only variants that have an attached offer**
(`variants.filter(v => v.offers?.length)`) — a product variant the
seller has not made an offer on does **not** appear in the detail
Variants table (confirmed against Figma `40016489:640014`). The seller
adds those missing variants as offers through the create wizard, after
which they show up in the table.

#### Multiple offers per variant — row = offer (no unique constraint)

The wrap attaches `variant.offers` as an **array**, because the `Offer`
model permits **multiple offers per `(seller, variant)`** with distinct
SKUs — exercised today by the integration test *"should allow a single
seller to create multiple offers on the same variant with distinct sku"*
(`integration-tests/http/offer/vendor/offer.spec.ts`).

**Decision (product direction): keep this — a seller may create multiple
offers on the same variant as long as the SKUs differ.** A
`(seller_id, variant_id)` unique constraint is **explicitly rejected**;
the only uniqueness rule stays the existing `(seller_id, sku)` partial
unique index. So **no new migration / constraint** for this.

Consequences for the B2C surface (the "row = offer" model):

- The offer-detail **Variants table renders one row per offer**, not per
  variant. A variant carrying 2 offers shows as 2 rows that share the
  variant-level columns (Title, option badges, Media) and differ in SKU /
  price / inventory — accepted as **distinct sellables** (e.g. a single
  unit vs a 2-pack on the same master variant). This is intended, not a
  bug.
- The Offer Variant detail route keys on the **offer id**, not the
  variant id: **`/offers/:id/variants/:offer_id`** (`:id` = product id,
  `:offer_id` = the specific offer). `variant.offers` may hold more than
  one entry, so the page resolves the row by `offer_id`, never
  `offers[0]`.
- The Variants/count semantics follow the offer, not the variant: the
  table footer counts **offers** the seller has on the product (the mock
  renders one offer per variant, so "8 variants" == 8 offers there); when
  a variant has multiple offers each is its own row and counts once.
- **No B2B fallout** — the multi-offer-per-variant test stays green; B2C
  and B2B share the same `Offer` cardinality. Nothing to ratify in
  SPEC-002 for this.

The vendor offers endpoint (`/vendor/offers`) is **not removed** — the
create wizard, the Offer Variant detail page, and all per-offer
mutations (edit / pricing / inventory / delete) still target it. Only
the **list** (and the product-shaped detail read) move to the product
endpoint + offer wrap.

### Create Offer — Products / Master Catalogue (`40016485:395969`)

Design: tab 1 of a 2-tab `RouteFocusModal` wizard
(`Products` → `Stock Levels & Prices`), titled **"Products"** in the
frame.

- **Host + tabs** — Exists. `RouteFocusModal` + `TabbedForm`, 2 tabs.
  Note the **tab label**: B2C tab 1 reads **"Products"**; shipped tab 1
  reads **"Catalogue"** (`offers.create.tabs.catalogue`). Reconcile the
  label (and the breadcrumb chip).
- **Table grain** — **Different (structural).** B2C catalogue lists one
  row **per product** (thumbnail + "Product Name", Category, Collection,
  "**8 variants**", Status). Shipped catalogue
  (`create-offer-catalogue.tsx`) lists one row **per variant** with
  `select / title / categories / sku / ean / upc / status`. The B2C
  grain is product-level multi-select; the next tab fans the selected
  products out to their variants.
- **Columns** — Different. Design: Product / Category / Collection /
  Variants / Status. Shipped: no Collection, no Variants-count, extra
  SKU/EAN/UPC.
- **Toolbar** — Exists. `Add filter` (left) + `Search` + sort
  (right). Filter menu frame `40016485:453778` mirrors the list filter.
- **Tip footer** — Exists. "**Tip:** Select all relevant products that
  match your inventory, then easily create offers for them by simply
  adding your stock levels and prices." (`offers.create.tip`). Matches.
- **Footer** — Exists. `Cancel` + `Continue` (disabled until ≥1
  selected). Matches the shipped gating.
- **Pagination** — `1 — 10 of 100 results`, page size 10. Matches.

### Create Offer — Stock Levels & Prices (`40016485:528987`)

Design: tab 2, a `DataGrid` with rows **grouped by product** (a
non-editable product separator row — "Swiftly Tech Cropped Sh…",
"SET - Sports dress" — above its variant rows).

- **Grid** — Different. Columns **Title · SKU · Shipping Profile ·
  Stock Location N · Price &lt;ccy&gt;** per row. Shipped grid
  (`create-offer-stock-levels-and-prices.tsx`) has the **same column
  family** (title / sku / shipping_profile select / per-location stock /
  per-currency price) — strong alignment.
- **Product grouping** — **Missing.** B2C renders a product separator
  row per product group; shipped grid is **flat** (one row per variant,
  no group headers) per SPEC-003 §"No product grouping".
- **Stock Location cells** — Different. B2C shows a **Switch only**
  (`Not enabled` / `Enabled`) per location. Shipped cell carries a
  numeric **quantity** input *and* the toggle (richer than the design;
  SPEC-003 §follow-up #2 flags this divergence — keep or revert is a
  product call).
- **Toolbar** — Exists. `View` (column visibility) left; `Shortcuts`
  right. Matches `DataGrid` defaults.
- **Footer** — Exists. `Cancel` + `Publish` (primary). Matches.
- **Publish** — Exists. Fans out via
  `useBulkCreateOffers` → `sdk.vendor.offers.batch.mutate`. Per-row
  failures surface inline. Matches SPEC-003.

### Offer detail — product-shaped (`40016489:637892`)

> **This page does not exist in its B2C shape today.** Shipped
> `/offers/:id` is a *variant*-shaped `TwoColumnPage` (the B2C "Offer
> Variant detail", roughly). The B2C offer detail is a **product**
> page.

Design layout: a wide main column (≈739px) + a narrow sidebar
(≈440px), total 1245 tall. Sections, top to bottom in the main column:

- **Details** (`<Container className="divide-y p-0">`) — **Different /
  Missing.**
  - Header: product **Title** ("Swiftly Tech Cropped Short Sleeve 2.0
    - Sports T-shirt") + `StatusBadge` "**Published**" + kebab.
  - Kebab (`40016491:701157`): single **Delete** action
    (`40016489:640874` shows the menu).
  - Body `Info Row`s: **Description** (multi-line), **Subtitle**,
    **Handle** (`/tech-tshirt`), **Discountable** (`True`). These are
    **product** fields — shipped offer General shows SKU/EAN/UPC/
    shipping profile instead. With option 1 these come straight from the
    product the detail page reads (`GET /vendor/products/:id` + offer
    wrap), and the kebab's Delete acts on the seller's offers for that
    product.
- **Media** (`<Container>`) — **Missing.** Grid of product image
  thumbnails (`file-thumbnails`, 96×96), with a center-aligned empty
  state ("Empty State Center Aligned"). No media section on the shipped
  offer page.
- **Variants** (`<Container className="divide-y p-0">`) — **Missing.**
  A full table:
  - Table Menu header (kebab — `40016498:716194`).
  - Table Filter row: `Add filter` + `Search` + sort
    (`40016489:640014` shows the filter/sort popovers).
  - Columns (verified against `40016500:747473`): **Title** (variant
    thumbnail + "XS / Green") · **SKU** ("-" when unset) · **one column
    per product option** (here **Size** + **Color**, each an option-value
    badge) · **Inventory** ("50 available" with a kit/`Component` glyph
    when the variant's offer is an inventory kit; "0 available at 0 loc"
    in `text-ui-fg-error` when zero) · row kebab.
  - **One row per offer** (the "row = offer" model — see §"Multiple
    offers per variant"). The table flattens the wrapped shape to one row
    per `variant.offers[]` entry across the product's offered variants
    (`product.variants.flatMap(v => v.offers.map(o => ({ variant: v, offer: o })))`),
    so a variant with 2 offers shows as 2 rows (distinct SKU/price) and a
    variant with no offer doesn't appear. **Row navigates to the Offer
    Variant detail page keyed by offer id**
    (`/offers/:id/variants/:offer_id`).
  - Table footer + pagination (`1 — 8 of 8 results`).
  - **Note:** the Figma mock renders 8 rows (one offer per variant); the
    "only variants with an attached offer" rule is product direction,
    implemented by flattening over `v.offers` (non-offered variants
    contribute zero rows).
  - **Status (2026-06-12): toolbar parity landed.**
    `offer-variants-section.tsx` now mirrors the product variants table
    (`product-variant-section.tsx`): a compact filter bar with **Search**
    (client-side over variant title + offer/variant SKU), **Sort**
    (Title / SKU / Created / Updated, via sortable accessor columns), and
    **Add filter → Created / Updated** date filters
    (`useDataTableDateFilters`, matching `40016489:640014`). Because the
    rows come from the wrapped product graph (client-side), search / sort
    / date-filter / pagination are applied **in memory** against the offer
    rows (`PAGE_SIZE = 10`, prefix `ov`) rather than re-fetched. The
    Created/Updated date columns are shown (parity with the product table;
    the static B2C mock omits them) and key off the **offer's**
    `created_at` / `updated_at` — so `OFFER_PRODUCT_DETAIL_FIELDS` now
    requests `variants.offers.created_at` / `.updated_at`. Empty vs
    filtered states wired (`offers.empty.*` / `offers.filtered.*`).
    Follow-up fixes in the same pass:
    - **Row navigation bug.** Row click resolved to
      `variants/undefined`. Medusa's `DataTable` passes the **TanStack
      Row** (not the original datum) to `rowHref`/`onRowClick`, so the
      custom `row.offerId` field read `undefined`. Renamed the flattened
      row's id field to **`id`** (= the offer id) and switched
      `getRowId` / `rowHref` to `row.id`, which resolves correctly whether
      the callback receives the Row (its `.id` is the `getRowId` result)
      or the original datum — the same reason `product-variant-section`'s
      `row.id` works.
    - **Removed the header "N variants" count text** (`variantsCount`),
      leaving just the section heading + actions kebab, matching the Figma
      header (`40016491:701157`).
    - **Double-border fix.** Dropped `divide-y` from the section
      `Container` (now `p-0`). In compact mode the DataTable's filter bar
      already carries its own `border-t`, and the hidden toolbar row
      collapses to zero height, so a Container divider stacked a second
      1px line between the header and the filter row. The filter bar now
      owns the header/filter separator; the table supplies its own
      `border-y`. (The offers **list** table avoids this only because it
      is non-compact, so its visible toolbar row separates the two
      borders.)
  - **Status (2026-06-12, follow-up): three remaining cell gaps closed.**
    `offer-variants-section.tsx` now matches the Figma row anatomy
    (`40016500:747473`):
    - **Per-row kebab.** Added `columnHelper.action({ actions })` (the
      28px trailing cell in the design) with **Edit** (→
      `variants/:offer_id/edit`) and **Delete** (per-offer, via
      `useBulkDeleteOffers([offerId])` + `usePrompt` → toast). Mirrors the
      product variants table's Edit/Delete kebab; row-click still
      navigates to the Offer Variant detail.
    - **Leading thumbnail column.** Empty-header 24px thumbnail cell
      (Figma `40016500:747487`). Variant-level images aren't carried by
      the `withOffers` wrap, so the cell falls back to the **product**
      thumbnail (passed in via a new `thumbnail` prop from
      `offer-detail-page.tsx`).
    - **Inventory cell parity.** Now renders the canonical Medusa shape: a
      `Component` kit glyph when the offer is an inventory kit
      (`inventory_item_link.length > 1`, Figma `40016500:749885`) and
      `text-ui-fg-error` red text when `available === 0` (the "0 available
      at 0 loc" rows). Data comes from the wrap's
      `inventory_item_link.inventory_item.location_levels` (always
      attached server-side, independent of requested
      `variants.offers.*` fields).
    - The extra Created/Updated columns are **kept** (documented
      intentional parity with the product table; the static mock omits
      them).

Sidebar:

- **Associated product** (`<Container className="p-0">`) — **Missing.**
  Single card: thumbnail + product title + `/tech-tshirt` subtitle +
  chevron, wrapped in a `<Link>` to the product page. (The shipped page
  has a *Master variant* card instead, which links to the variant.)

There is **no Metadata / JSON** section in the design (consistent with
shipped — neither is rendered).

### Offer detail — Edit Price (`40008137:146047`)

- **Missing (in this context).** `RouteFocusModal` + `DataGrid` over
  **all of the offer's variants** with columns **Title · Price USD ·
  Price PLN · Price EUR** (one column per active store currency).
  Footer `Cancel` + `Save`. This edits prices across the whole offer's
  variants at once. Shipped pricing edit
  (`/offers/:id/pricing`) is a `RouteDrawer` scoped to a **single**
  offer's price set — a different grain.

### Offer detail — Edit Stock Levels (`40016491:694025`)

- **Missing.** `RouteFocusModal` + `DataGrid` over the offer's variants
  (and inventory-kit child rows) with columns **Title · SKU · Stock
  Location N** (Switch per location). Footer `Cancel` + `Save`. Bulk
  stock editing across variants; no equivalent today (shipped
  `/offers/:id/inventory` is a single-offer batch drawer).

### Offer **Variant** detail (`40016491:703365`) — NEW PAGE

> The closest thing today is the shipped `/offers/:id` detail page. In
> B2C this becomes a **sub-page** keyed by the offer:
> `/offers/:id/variants/:offer_id` (`:id` = product id, `:offer_id` = the
> specific offer, since a variant may carry several). The route does not
> exist.

Design: `TwoColumnPage` (812 tall). Breadcrumb
`Offers › <product> › <variant>` ("XS / Green").

Main column:

- **General** (`<Container className="divide-y p-0">`) — Different.
  - Header: `<Heading>` variant title ("XS / Green") + sub-label
    "**Offer Variant**" + kebab.
  - Kebab (`40016498:709389`) → **Edit Details** (and likely Delete).
  - Body `SectionRow`s: **SKU**, then one row **per option** (**Size**
    = "XS" badge, **Color** = "Green" badge). Shipped General shows
    SKU/EAN/UPC/Shipping profile/Created/Updated instead — the option
    rows are new; shipping profile + price move to the sidebar.
- **Media** (`<Container>`) — Missing. Variant media thumbnail grid
  (one 96×96 thumbnail in the frame).
- **Inventory items** (`<Container className="divide-y p-0">`) —
  Exists ≈. `_DataTable` over inventory-item links: **Title · SKU ·
  Required quantity · Inventory** ("50 available at 1 location") + row
  kebab. Header kebab (`40016498:724338`) → **Manage Inventory Items**.
  This matches the shipped `offer-inventory-section.tsx` closely.

Sidebar:

- **Shipping Configuration** (`<Container className="p-0">`) — Missing
  (as a sidebar card). Card: building icon + **"Small Items"** /
  "Small" subtitle + chevron; header kebab (`40016503:749900`) →
  **Edit Shipping Configuration**. Shipped surfaces shipping profile as
  a `SectionRow` inside General, not a sidebar card.
- **Price** (`<Container className="divide-y p-0">`) — Exists ≈.
  Currency rows (USD $100.00 / PLN zł100.00 / EUR €100.00), `1 — 3 of 3
  results`, **Show more**, header kebab (`40016491:705355`) → **Edit
  Price**. Matches the shipped `offer-pricing-section.tsx` shape.

### Offer Variant — Edit Details drawer (`40016498:718479`)

- **Different.** `RouteDrawer` titled **"Edit Offer Variant"**.
  - Figma shows three fields — **SKU** (Optional) + **Manage inventory**
    (`SwitchBox`) + **Allow backorders** (`SwitchBox`).
  - **🚫 DO NOT SHIP the `Manage inventory` and `Allow backorders`
    toggles** (product direction). `manage_inventory` / `allow_backorder`
    were removed from the model by SPEC-002 (2026-05-20) and are **not**
    being re-introduced — the two toggles in the design are intentionally
    dropped. **No SPEC-002 amendment, no new field.**
  - **Shipped scope of this drawer: `SKU` only.** (Shipping profile moved
    to its own "Edit Shipping Configuration" drawer below.) Footer
    `Cancel` + `Save`, submitting via `useUpdateOffer({ sku })`.

### Offer Variant — Edit Shipping Configuration drawer (`40016503:755951`)

- **Different.** `RouteDrawer` titled **"Edit Shipping Configuration"**
  with a single **Shipping profile** `Select` ("Small Items"). Footer
  `Cancel` + `Save`. Today this field lives in the same drawer as SKU
  (`edit-offer-form.tsx`); the B2C design splits it into its own
  drawer reached from the Shipping Configuration sidebar card's kebab.

### Offer Variant — Manage Inventory Items (`40014196:378442`)

- **Different.** `RouteFocusModal` titled **"Inventory items"** with a
  per-variant kit builder:
  - Sub-heading: variant/product name ("2 Pack Pure Cotton T-Shirts")
    + "Define inventory items required for this variant. Add multiple
    items to create an inventory kit." + **Add** button.
  - Each kit row: **Item** `Select` + **Quantity** input + remove (×).
  - One-item vs. inventory-kit variants (frames `…290495` vs
    `…290515`) differ only by row count.
  - Footer `Cancel` + `Save`.
  - Shipped `/offers/:id/inventory` is a **DataGrid of per-location
    stock**, not a kit builder — a different concern. The B2C "Manage
    Inventory Items" edits the **inventory_item_link set** (which
    inventory items back the variant + their `required_quantity`),
    matching the admin variant page's "manage items" flow. This is
    closer to the admin `inventory_item_link` editor than to the
    shipped per-location batch grid.

## Cross-cutting differences (summary)

| Theme | B2C design | Shipped today | Verdict |
| --- | --- | --- | --- |
| Offer grain | product (N variants) | single variant | Different — rendered via product endpoint + offer wrap (offer stays per-variant, no schema change) |
| List backing | `/vendor/products` + `withOffers` wrap (seller offers under variants) | `/vendor/offers` per-variant rows | Different — migrate list to product endpoint |
| Offers per `(seller, variant)` | many (distinct SKUs) — row = offer | many (distinct SKUs) | Same — no constraint; Variants table renders one row per offer, route keyed by `offer_id` |
| List columns | Product / Category / Collection / Variants (offered) / Status | + SKU + Shipping profile, − Collection − Variants | Different |
| Offer detail | product-shaped (Details/Media/Variants + Associated product) | variant-shaped (General/Inventory + Master variant/Prices) | Missing (new page) |
| Offer Variant detail | dedicated sub-page | none | Missing (new route) |
| `manage_inventory` / `allow_backorder` | toggles in Edit Offer Variant drawer | removed by SPEC-002 | **Not shipped** — toggles dropped per product direction (no field re-introduced) |
| Shipping profile edit | own drawer (sidebar card) | folded into the SKU drawer | Different |
| Manage inventory | kit builder (Item + Quantity) | per-location stock DataGrid | Different |
| Bulk price / stock edit | DataGrid across all variants | single-offer drawers | Missing |
| Create catalogue grain | per product | per variant | Different |
| Stock & Prices grid | grouped by product, Switch-only stock | flat, stock has qty input | Different |

## Design-system conformance notes (per docs/UI-ARCHITECTURE.md)

When this work is scoped, every new surface must follow the dashboard
contract. Concrete mappings for the B2C screens:

- **Pages** — Offer detail and Offer Variant detail are `TwoColumnPage`
  hosts; the list stays `SingleColumnPage`. Each section is
  `<Container className="divide-y p-0">` with a
  `flex items-center justify-between px-6 py-4` header
  (`<Heading>` + `StatusBadge` + `ActionMenu`).
- **Sidebar cards** (Associated product, Shipping Configuration) use the
  Pattern-A card shape already used by the shipped Master-variant card
  (`shadow-elevation-card-rest bg-ui-bg-component rounded-md`, wrapped
  in a focusable `<Link>` with a trailing `TriangleRightMini`).
- **Edit drawers** — `RouteDrawer` + `RouteDrawer.Form` + `KeyboundForm`;
  body `flex flex-col gap-y-4`; toggles use `SwitchBox`
  (`@mercurjs/dashboard-shared`). Gate behind `ready = !isPending &&
  !!entity`.
- **Bulk grids** (Edit Price / Edit Stock Levels / Create tab 2) — reuse
  the `DataGrid` primitive + `createDataGridPriceColumns` /
  `createDataGridLocationStockColumns` the shipped create wizard already
  uses; host in `RouteFocusModal`.
- **Tables** — `DataTable` + `useDataTable`, `PAGE_SIZE` aligned to the
  footer copy (10 for the list; the Variants table footer reads
  `1 — 8 of 8`), `actions` column rendering `<ActionMenu>`, empty states
  via `NoRecords` / `NoResults`.
- **Delete** — the existing `use-delete-offer-action.tsx` (`usePrompt` →
  mutate → toast) covers the design's Delete → Prompt → Toast flow.
- **Icons / colors / i18n / test-ids** — only `@medusajs/icons`, only
  Medusa UI tokens, every string through `t(...)` under the `offers.*`
  namespace, kebab-case `data-testid` on every interactive element.

## Technical approach — vendor panel redesign (frontend)

> Companion to the backend approach (`withOffers` wrap + seller-offered
> product filter; no schema change, no constraint, multiple offers per
> variant allowed). This section is the
> page-by-page UI build plan. It leans on a key reuse insight: the
> vendor package **already ships a product-shaped detail surface** at
> `packages/vendor/src/pages/products/[id]/product-detail-page.tsx`
> (`ProductDetailPage` = `TwoColumnPage` with `ProductGeneralSection` /
> `ProductMediaSection` / `ProductVariantSection` + sidebar sections).
> The B2C offer detail is that page, re-skinned and pointed at the
> seller's offers — not a from-scratch build.

### Strategy

Treat the offer pages as a **thin offer-aware layer over the existing
product + product-variant detail surfaces**, wired to the existing
`/vendor/offers` mutation endpoints:

- **Reads** (list + product-shaped detail + variant detail) come from
  the **vendor product endpoint** with `variants.offers.*` + the
  `withOffers` wrap. Reuse `useProducts` / `useProduct`.
- **Writes** (create / edit details / edit shipping / edit price /
  manage inventory / delete) keep going to `/vendor/offers*` via the
  existing `useCreateOffer` / `useBulkCreateOffers` / `useUpdateOffer` /
  `useBatchOfferInventoryItems` / `useDeleteOffer` hooks.

Net effect: one new data-source swap (offers→products for reads), a set
of new offer-aware section components that mostly clone existing product
/ variant / shipped-offer sections, and the create wizard largely as-is.

### Routing (`packages/vendor/src/get-route-map.tsx`)

The `/offers` tree is reshaped. **`:id` changes meaning from offer-id to
product-id** (the detail is product-shaped) — a breaking change to any
saved `/offers/<offerId>` deep link; call it out in the PR.

```
/offers                                   → product-endpoint list
/offers/create                            → create wizard (host unchanged)
/offers/:id                               → product-shaped offer detail
                                            (:id = product_id; loader hits
                                             sdk.vendor.products.$id + withOffers)
  ├── edit-price                          → RouteFocusModal (bulk price DataGrid)
  ├── edit-stock                          → RouteFocusModal (bulk stock DataGrid)
  └── variants/:offer_id                  → Offer Variant detail (NEW page)
        ├── edit                          → RouteDrawer "Edit Offer Variant" (SKU only)
        ├── shipping                      → RouteDrawer "Edit Shipping Configuration"
        ├── pricing                       → RouteFocusModal "Edit Prices"
        └── inventory                     → RouteFocusModal "Manage Inventory Items"
```

The sub-route is keyed by **`:offer_id`**, not variant id — a seller may
hold multiple offers on one variant (distinct SKUs), so the offer is the
unit (see §"Multiple offers per variant"). The current children (`edit` /
`pricing` / `inventory` hung off `/offers/:id`) move **down** to
`/offers/:id/variants/:offer_id/*`, because in B2C those edits are
per-offer, not per-offer-page.

### Hooks & query fields (`packages/vendor/src/hooks/api/`, `pages/offers/common/constants.ts`)

- **Reuse `useProducts(query)` / `useProduct(id, query)`** for the list
  and detail reads. Add offer-aware field constants in
  `pages/offers/common/constants.ts`:
  - `OFFER_PRODUCT_LIST_FIELDS` — `id,title,thumbnail,status,*categories,
    *collection,variants.id,variants.title,variants.offers.id` (the wrap
    fills `variants.offers`; the list only needs offer presence for the
    count).
  - `OFFER_PRODUCT_DETAIL_FIELDS` — the above plus product Details
    (`description,subtitle,handle,discountable`), `*images`, and the
    per-variant offer payload the Variants table + variant detail need
    (`variants.offers.sku,variants.offers.shipping_profile.*,
    variants.offers.prices.*,variants.offers.inventory_items.*,
    variants.options.*`).
- **Keep the `offers.tsx` mutation hooks** unchanged: `useCreateOffer`,
  `useBulkCreateOffers`, `useUpdateOffer`, `useBatchOfferInventoryItems`,
  `useDeleteOffer`, `useBulkDeleteOffers`. The variant detail's four edit
  surfaces all resolve to one of these (no new endpoints).
- After any offer mutation, invalidate **both** the offers query keys
  **and** the products query keys (`productsQueryKeys.lists()` /
  `.detail(productId)`) so the product-backed read refreshes.

### List page (`pages/offers/offer-list-page.tsx` + `_components/`)

- Swap the data source in `use-offer-table-query.tsx` /
  `offer-list-data-table.tsx` from `useOffers` to `useProducts` with
  `OFFER_PRODUCT_LIST_FIELDS`. Page size stays 10. **The product query
  must be scoped to products this seller has an offer on** — the bare
  vendor-products endpoint returns the master-catalogue union (every
  published product + the seller's own), so pass the seller-offered
  filter described in §"Implementation … step 4" (`?has_offer=true` /
  `applySellerOfferedProductsFilter`, scoping products by the seller's
  offered variant ids).
  Without it the list shows the whole catalogue, not the seller's offers.
- `use-offer-table-columns.tsx` → **Product** (thumbnail + product
  title) / **Category** / **Collection** / **Variants**
  (`row.variants.filter(v => v.offers?.length).length` + " variants") /
  **Status** / row kebab. **No `select` column** — remove the leading
  checkbox column and the `enableRowSelection` / bulk-delete command
  wiring from `offer-list-data-table.tsx` (B2C has no bulk select; see
  `40016480:616844`). Also drop the shipped `sku` + `shipping_profile`
  columns. `navigateTo={(row) => row.id}` (product id).
- `use-offer-table-filters.tsx` → replace the shipped filters with the 7
  confirmed in `40016482:525329`: **Category** (`categories.id`) /
  **Collection** (`collection_id`) / **Type** (`type_id`) / **Tag**
  (`tags.id`) / **Status** (`status`) / **Created** (`created_at`) /
  **Updated** (`updated_at`). Drop `shipping_profile_id` + `sku`.
- **Sort** (`40016482:527505`): Title / Created / Updated + Asc/Desc.
- **Row kebab** (`offer-actions.tsx`) → the 3 actions from
  `40016482:529681`: **Edit prices** (→ `edit-price` modal) / **Edit
  stock levels** (→ `edit-stock` modal) / **Delete** (own group, via
  `use-delete-offer-action`, removing the seller's offers on that
  product). Replaces the shipped Edit / Manage prices / Manage inventory
  / Delete menu.
- Search row + empty state reuse the shipped chrome.

### Offer detail page (`pages/offers/[id]/offer-detail-page.tsx`)

Rebuild as a `TwoColumnPage<VendorProduct>` cloning the
`ProductDetailPage` spine:

- **Main**: `OfferDetailGeneralSection` (clone `ProductGeneralSection`;
  Details rows Description/Subtitle/Handle/Discountable + Published
  badge; kebab = **Delete** only) → `ProductMediaSection` (reused as-is)
  → **`OfferVariantsSection`** (clone `ProductVariantSection` but flatten
  to **one row per offer**:
  `product.variants.flatMap(v => v.offers.map(o => ({ variant: v, offer: o })))`
  — a variant with multiple offers yields multiple rows; columns **Title
  / SKU / one column per product option (Size, Color, …) / Inventory**
  (kit glyph + red-when-zero) / row kebab — verified against
  `40016500:747473`; header `ActionMenu` adds **Edit Price** →
  `edit-price` and **Edit Stock Levels** → `edit-stock`; row →
  `variants/:offer_id`).
- **Sidebar**: **`OfferAssociatedProductSection`** — single Pattern-A
  card (lift the shipped master-variant card markup) linking to
  `/products/:product_id`.
- Compound-export every slot (`Object.assign(Root, { … })`) per the
  page-authoring checklist.

### Offer Variant detail page (`pages/offers/[id]/variants/[offer_id]/`) — NEW

`TwoColumnPage`, resolving the offer off the same product query by
`offer_id` (`product.variants.flatMap(v => v.offers).find(o => o.id ===
offer_id)`, and its parent variant for the option/media context) — keyed
by **offer**, since a variant may carry several:

- **Main**: `OfferVariantGeneralSection` (heading = variant title,
  sub-label "Offer Variant", kebab → **Edit Details** — SKU only, no
  Manage-inventory/Allow-backorders toggles; rows SKU + one
  per option) → Media → **Inventory items** (lift the shipped
  `offer-inventory-section.tsx` almost verbatim; header kebab → **Manage
  Inventory Items**).
- **Sidebar**: **Shipping Configuration** card (kebab → Edit Shipping
  Configuration) + **Price** card (lift the shipped
  `offer-pricing-section.tsx` collapsible currency list; kebab → Edit
  Price).

### Edit surfaces

| Surface | Host | Reuse | Submits via |
| --- | --- | --- | --- |
| Edit Price (bulk, detail) | `RouteFocusModal` + `DataGrid` over offered variants' prices | `createDataGridPriceColumns` | per-offer `useUpdateOffer({ prices })` (or a bulk variant) |
| Edit Stock Levels (bulk, detail) | `RouteFocusModal` + `DataGrid` | `createDataGridLocationStockColumns` | `useBatchOfferInventoryItems` per offer |
| Edit Offer Variant (drawer) | `RouteDrawer` | shipped `edit-offer-form` shape | `useUpdateOffer({ sku })` — **SKU only; do NOT ship the Manage-inventory / Allow-backorders toggles** |
| Edit Shipping Configuration (drawer) | `RouteDrawer` | `Select` of shipping profiles | `useUpdateOffer({ shipping_profile_id })` |
| Manage Inventory Items (modal) | `RouteFocusModal` kit builder (Item `Select` + Quantity + Add) | admin variant "manage items" flow | `useBatchOfferInventoryItems` |

All gate behind `ready = !isPending && !!data`, use `KeyboundForm`,
toast on success, and `handleSuccess()` to close + refetch.

### Create wizard (`pages/offers/create/`)

Mostly retained from the shipped 2-tab wizard; deltas only:

- Rename tab 1 label `offers.create.tabs.catalogue` → "Products" (and
  the tab id) to match Figma; **switch its grain from per-variant to
  per-product** rows (Product/Category/Collection/Variants/Status), with
  selection expanding to the product's variants for tab 2.
- Tab 2 (`create-offer-stock-levels-and-prices.tsx`): add the
  **product-group separator rows** the design shows; keep the existing
  per-row SKU / Shipping Profile / per-location stock / per-currency
  price columns and the `useBulkCreateOffers` publish.

### Folder layout — target

```
pages/offers/
  offer-list-page.tsx                       # now product-backed
  common/constants.ts                        # + OFFER_PRODUCT_*_FIELDS
  common/hooks/use-delete-offer-action.tsx   # reused
  _components/                               # list columns/filters/query → products
  [id]/
    offer-detail-page.tsx                    # product-shaped (clone ProductDetailPage)
    loader.ts                                # sdk.vendor.products.$id + withOffers
    _components/
      offer-detail-general-section.tsx       # clone ProductGeneralSection (Delete-only)
      offer-variants-section.tsx             # clone ProductVariantSection (one row per offer)
      offer-associated-product-section.tsx   # Pattern-A sidebar card
    edit-price/                              # RouteFocusModal bulk price DataGrid
    edit-stock/                              # RouteFocusModal bulk stock DataGrid
    variants/[offer_id]/                     # NEW Offer Variant detail (keyed by offer id)
      offer-variant-detail-page.tsx
      _components/{general,inventory,shipping-card,price-card}-section.tsx
      edit/        shipping/        pricing/        inventory/   # the four edit surfaces
  create/                                     # 2-tab wizard (label + grain deltas)
```

### Migration order (frontend slices)

1. **Backend first** — the `withOffers` wrap + the seller-offered
   product filter (the backend approach above); without the wrap the
   reads return nothing useful. **No migration, no unique constraint, no
   new column** — the only backend code is the wrap helper + the list
   filter, both with integration coverage (see below).
2. **List** → product-backed (`useProducts`, new columns).
3. **Offer detail** (product-shaped) — clone the product detail spine,
   add the offered-variants filter + Associated-product card.
4. **Offer Variant detail** + its four edit surfaces.
5. **Bulk Edit Price / Edit Stock Levels** modals on the detail page.
6. **Create wizard** label + grain deltas.

Each slice builds and ships independently behind the new routes; the old
offer-id deep links 404 after slice 3 (documented breaking change).

### Integration tests — `wrapProductVariantsWithOffers` + seller-offered filter

The backend slice (slice 1) is the one piece with real branching logic,
so it carries dedicated integration coverage. Add a new vendor suite
**`integration-tests/http/product/vendor/offer-products.spec.ts`** (and
extend `integration-tests/http/offer/vendor/offer.spec.ts` where noted),
seeding via the existing helpers (`createSellerUser`,
`seedSellerOfferDeps`, the `/vendor/offers` + `/vendor/offers/batch`
POSTs already used in `offer.spec.ts`). Cases:

1. **Wrap attaches the seller's offers** — seller A creates an offer on
   variant V of product P; `GET /vendor/products/:P?fields=…,variants.offers.*`
   returns P with the matching variant's `offers` array containing A's
   offer (id + sku + prices), and **every other variant** of P returns
   `offers: []`.
2. **Seller isolation (the load-bearing case)** — sellers A and B both
   offer the **same shared variant** V (distinct SKUs). A's
   `GET /vendor/products/:P` shows only A's offer under V (not B's), and
   B's shows only B's. Asserts the wrap's `seller_id` filter; a
   competitor's offer never leaks.
3. **Multiple offers per variant** — seller A creates **two** offers on
   variant V with distinct SKUs (allowed — no unique constraint). The
   wrapped variant's `offers` array has **length 2**, both A's, so the
   detail Variants table would render 2 rows. (Extends the existing
   *"multiple offers on the same variant with distinct sku"* test with a
   read-side assertion.)
4. **`withOffers` off** — `GET /vendor/products/:P` **without**
   `variants.offers.*` in `fields` returns variants with no `offers` key
   (the flag/strip path is inert; no wrap runs).
5. **Wrap on both routes** — cases 1–3 run against **both**
   `GET /vendor/products` (list) and `GET /vendor/products/:id` (detail),
   since the wrap is wired on both handlers.
6. **Seller-offered product filter** — seed seller A with offers on
   products P1, P2 (out of a larger published catalogue including P3, P4
   with no A-offer). `GET /vendor/products?has_offer=true` (the
   `applySellerOfferedProductsFilter` path) returns **exactly {P1, P2}**,
   excluding P3/P4 — proving the list is scoped to the seller's offered
   products, not the master-catalogue union.
7. **Filter + isolation compose** — with sellers A and B offering
   disjoint product sets, A's `?has_offer=true` list never contains B's
   products.

These run under `medusaIntegrationTestRunner` and gate slice 1; the UI
slices (2–6) lean on them rather than re-asserting the wrap.

### Figma verification (2026-06-11)

The approach was re-checked frame-by-frame against
`figma.com/design/sYJoh84Owr5tomRjpxG0no` (page `40016404:290481`).

**Confirmed by the design:**
- Offer detail is **product-shaped** — Details (Description / Subtitle /
  Handle / Discountable) + Media + Variants table + an **Associated
  product** sidebar card that links to the product (`/tech-tshirt`,
  node `40016500:747559`). The card linking *out* to the product
  confirms the offer detail is an offer-scoped view keyed by product,
  distinct from the full product page — consistent with `:id =
  product_id` + the `withOffers` wrap.
- Offer **Variant** detail = General (SKU + per-option rows) + Media +
  Inventory items + sidebar Shipping Configuration card + Price card.
- List columns Product / Category / Collection / Variants / Status; the
  create wizard's tab 1 is product-grained ("Master Catalogue"); the
  five edit surfaces (Edit Price, Edit Stock Levels, Edit Offer Variant
  with Manage-inventory/Allow-backorders, Edit Shipping Configuration,
  Manage Inventory Items kit builder) all match.

**Corrections applied from this pass:**
- The offer-detail **Variants table** columns are **Title / SKU / one
  column per product option (Size, Color) / Inventory / kebab**
  (`40016500:747473`) — the SKU column and the per-option columns were
  missing from the first draft and have been added. Inventory shows a
  kit glyph for inventory-kit offers and red text at zero.
- ⚠️ **Product-set scoping** — `GET /vendor/products` returns the
  **master-catalogue union** (every published product + the seller's
  own), not "products the seller offers." The Offers list therefore
  needs an explicit seller-offered filter — resolve the seller's offered
  variant ids and constrain the product query to
  `variants.id IN [...]` (`?has_offer=true` /
  `applySellerOfferedProductsFilter`). This is the one place the bare
  product endpoint is insufficient; it needs no offer-table column.

**Not provable from the mock (flagged, not blocking):**
- The Variants table in the mock renders all 8 variants; "show only
  variants with an attached offer" is product direction implemented via
  `v.offers?.length`, which the mock neither proves nor contradicts.
- The list "8 variants" / detail counts are mock data; the
  offered-variant-count derivation is our interpretation of the B2C
  model, not a literal Figma value.

## User-Visible Behavior

A vendor opens **Offers** (under Products) and sees a list of **product
offers** — one row per product they list, showing category, collection,
variant count, and publish status. Opening one lands on a
**product-shaped offer detail**: product details, media, and a
**variants table**. Selecting a variant opens an **Offer Variant**
sub-page showing that variant's SKU, options, media, inventory items,
price, and shipping configuration, each editable from its own
drawer/modal (Edit Details — SKU only; Edit Shipping Configuration; Edit
Price; Manage Inventory Items). The offer detail also offers **bulk Edit
Price** and **Edit Stock Levels** grids spanning all variants. Creating an offer is a two-tab wizard
(**Products** → **Stock Levels & Prices**) that multi-selects products,
then sets per-variant SKU / shipping profile / stock / price before
**Publish**.

## Verification

> Cannot be executed until the screens are built. When implementing,
> verify each screen against its Figma frame and record evidence below.

1. **Seller-offered product scoping** — `GET /vendor/products` with the
   offers list filter (`?has_offer=true` / `applySellerOfferedProductsFilter`)
   returns **only products the active seller has an offer on** (not the
   master-catalogue union), by constraining `variants.id IN` the seller's
   offered variant ids. Covered under
   `integration-tests/http/product/vendor/` (seller with offers on a
   subset of catalogue products gets exactly that subset).
2. **Product endpoint offer wrap** — both `GET /vendor/products` **and**
   `GET /vendor/products/:id` with `variants.offers.*` requested return
   each variant with `offers[]` populated **only from the active seller**
   (a second seller's offer on the same shared variant does not leak);
   variants the seller has no offer on come back with `offers: []`. The
   detail page's Variants section therefore renders one row per offer on
   the offered variants. Covered by integration cases under
   `integration-tests/http/product/vendor/` (see §"Integration tests —
   `wrapProductVariantsWithOffers`"): two sellers / one shared variant
   for isolation; a variant with two distinct-SKU offers asserting
   `offers.length === 2` (multiple offers per variant are allowed — no
   unique constraint); and the seller-offered filter returning only the
   seller's offered products.
3. **List** — `/offers` renders Product / Category / Collection /
   Variants (offered count) / Status columns off the product endpoint;
   row click opens the product-shaped detail;
   filter/search/sort/delete/pagination behave per `40016480:616844`.
3. **Create wizard** — tab 1 "Products" multi-selects at the product
   grain; tab 2 "Stock Levels & Prices" groups rows by product; Publish
   fans out and toasts; matches `40016485:395969` / `528987`.
4. **Offer detail** — Details / Media / Variants sections + Associated
   product sidebar render per `40016489:637892`; the Variants row links
   to the variant sub-page; Edit Price / Edit Stock Levels bulk grids
   open and save.
5. **Offer Variant detail** — `/offers/:id/variants/:offer_id` renders
   General (SKU + option rows) / Media / Inventory items + Shipping
   Configuration + Price sidebar cards per `40016491:703365`; the **Edit
   Details** drawer exposes **SKU only** (no Manage-inventory /
   Allow-backorders toggles); all four edit surfaces (Details, Shipping,
   Price, Manage Inventory Items) open, validate, save, and toast.
6. **Build** — `bun run lint` and `bun run build` pass.
7. **Tests** — backend changes (the wrap + the seller-offered filter)
   carry integration coverage under `integration-tests/http/product/vendor/`;
   UI gated flows carry the relevant assertions.

## Evidence

### Slice 1 — backend wrap + seller-offered filter ✅ PASSING (2026-06-12)

Implemented:
- `packages/core/src/api/vendor/products/helpers.ts` — new
  `wrapProductVariantsWithOffers(scope, sellerId, products)` (bounded
  offer query by `seller_id` + `variant_id IN`, keyed onto variants;
  `offers: []` when none).
- `packages/core/src/api/vendor/products/route.ts` &
  `[id]/route.ts` — `withOffers` strip-then-wrap flag on both GET
  handlers, beside `enrichProductAttributes`.
- `packages/core/src/api/vendor/products/validators.ts` — `has_offer`
  pseudo-filter param.
- `packages/core/src/api/vendor/products/middlewares.ts` — new
  `applySellerOfferedProductsFilter` (resolves the seller's offered
  variant ids, constrains products to `variants.id IN [...]`; consumes +
  deletes `has_offer`), wired into the `GET /vendor/products` chain.
- `integration-tests/http/product/vendor/offer-products.spec.ts` — 6
  cases.

Verification (worktree `peaceful-ritchie-c0ba98`):
- `bun run build` → **9/9 successful** (`@mercurjs/core` tsc + codegen
  clean).
- `oxlint` on all changed files → clean.
- `bun run test:integration:http offer-products` → **Test Suites: 1
  passed; Tests: 6 passed / 6 total** (24.4s): wrap attaches seller's
  offer; no competitor leak on a shared variant; multiple offers per
  variant kept (`offers.length === 2`); wrap inert without
  `variants.offers`; `?has_offer=true` returns only offered products;
  per-seller scoping.

### Slice 2 — Offers list → product endpoint ✅ PASSING (2026-06-12)

Implemented (`packages/vendor/src/pages/offers/`):
- `common/constants.ts` — `OFFER_PRODUCT_LIST_FIELDS` (incl.
  `variants.offers.id` to trigger the wrap; paired with `has_offer`).
- `_components/use-offer-table-query.tsx` — product-backed query parsing
  (category/collection/type/tag/status/created/updated), pins
  `has_offer: "true"` + the offer fields.
- `_components/use-offer-table-filters.tsx` — reuses
  `useProductTableFilters()` (Category/Collection/Type/Tag/Status/
  Created/Updated — the 7 from Figma `40016482:525329`).
- `_components/use-offer-table-columns.tsx` — Product / Category /
  Collection / Variants (offered count) / Status / kebab. **No select
  column.**
- `_components/offer-actions.tsx` — 3-action kebab (Edit prices / Edit
  stock levels / Delete) per `40016482:529681`; Delete bulk-deletes the
  seller's offers collected off the product row.
- `_components/offer-list-data-table.tsx` — `useProducts(searchParams)`,
  no row selection / bulk-delete command; sort Title/Created/Updated.
- i18n `en.json` + `$schema.json` — `offers.actions.edit_prices` /
  `edit_stock_levels`.

Verification:
- `turbo build --filter=@mercurjs/vendor` → **2/2 successful** (tsup ESM
  + DTS type-check clean).
- `oxlint` on changed offers files → clean.
- i18n parity: my two keys are present in both en + schema (no "extra"
  reported). The suite's single failure (`store.validation.nameTooLong`
  missing in en.json) is **pre-existing** (last touched by `64766cb0`,
  unrelated to this work).

### Slice 3 — product-shaped offer detail ✅ PASSING (2026-06-12)

Implemented (`packages/vendor/src/pages/offers/[id]/`):
- `common/constants.ts` — `OFFER_PRODUCT_DETAIL_FIELDS`.
- `loader.ts` — reads `/vendor/products/:id` with the offer fields
  (`:id` = product id; `variants.offers.*` triggers the wrap).
- `breadcrumb.tsx` — product title.
- `offer-detail-page.tsx` — `TwoColumnPage`: General + Media + Variants
  (main) + Associated product (sidebar); compound-exported.
- `_components/offer-detail-general-section.tsx` — Details rows
  (Description/Subtitle/Handle/Discountable) + Published badge +
  Delete-only kebab (bulk-deletes the seller's offers on the product).
- `_components/offer-media-section.tsx` — read-only product media grid.
- `_components/offer-variants-section.tsx` — **one row per offer**
  (`variants.flatMap(v => v.offers)`), navigates to
  `variants/:offer_id`; empty-state via `NoRecords`.
- `_components/offer-associated-product-section.tsx` — Pattern-A sidebar
  card linking to `/products/:id`.
- i18n `offers.detail.associatedProduct` (en + schema).

Verification: `turbo build --filter=@mercurjs/vendor --force` → **2/2
successful** (ESM + DTS type-check clean); oxlint clean; i18n JSON valid.

_Note: the old `/offers/:id/{edit,pricing,inventory}` child routes + old
detail sections (`offer-general/inventory/pricing/variant-section`)
remain — repurposed in slices 4–5 (variant detail lifts the inventory +
pricing sections). The Variants rows link to `variants/:offer_id`
(slice 4)._

### Slice 4 — Offer Variant detail page ✅ PASSING (2026-06-12)

Implemented (`packages/vendor/src/pages/offers/[id]/variants/[offer_id]/`):
- `common/constants.ts` — `OFFER_VARIANT_DETAIL_FIELDS` (offer + variant
  option values).
- `loader.ts` / `breadcrumb.tsx` — keyed by **offer id** (`:offer_id`);
  loads the offer; breadcrumb shows the variant title.
- `offer-variant-detail-page.tsx` — `TwoColumnPage`: General + Media +
  Inventory items (main) + Shipping Configuration + Price (sidebar).
  **Reuses** the existing `OfferInventorySection`, `OfferPricingSection`,
  and `OfferMediaSection`.
- `_components/offer-variant-general-section.tsx` — variant title +
  "Offer Variant" sub-label + Edit Details kebab (SKU + per-option rows;
  no manage-inventory/allow-backorder toggles).
- `_components/offer-variant-shipping-section.tsx` — Shipping
  Configuration sidebar card + Edit kebab.
- `get-route-map.tsx` — `/offers/:id/variants/:offer_id` route (loader +
  breadcrumb + page).
- i18n `offers.detail.offerVariant` + `offers.detail.shippingConfiguration`
  (en + schema).

Verification: `turbo build --filter=@mercurjs/vendor --force` → **2/2
successful** (ESM + DTS type-check clean); oxlint clean; i18n JSON valid.

_Note: the variant detail's edit sub-routes (`edit` / `shipping` /
`pricing` / `inventory`) are wired by the kebabs but their pages land in
slice 5._

### Slice 5a — Offer Variant edit surfaces ✅ PASSING (2026-06-12)

Implemented (`packages/vendor/src/pages/offers/[id]/variants/[offer_id]/`):
- `edit/index.tsx` — **Edit Offer Variant** `RouteDrawer`, **SKU only**
  (no manage-inventory/allow-backorder toggles); `useUpdateOffer({ sku })`.
- `shipping/index.tsx` — **Edit Shipping Configuration** `RouteDrawer`
  (shipping-profile select); `useUpdateOffer({ shipping_profile_id })`.
- `pricing/index.tsx` — **Edit Price** `RouteFocusModal`, **reuses** the
  existing `PricingForm` keyed by `offer_id`.
- `inventory/index.tsx` — **Manage Inventory Items** `RouteFocusModal`,
  **reuses** the existing `InventoryBatchForm` keyed by `offer_id`.
- `get-route-map.tsx` — `edit` / `shipping` / `pricing` / `inventory`
  children under `variants/:offer_id` (rendered via the page's outlet).
- No new i18n keys — drawer titles compose `actions.edit` +
  `offers.detail.{offerVariant,shippingConfiguration}`.

Verification: `turbo build --filter=@mercurjs/vendor --force` → **2/2
successful**; oxlint clean.

### Slice 5b — bulk Edit Price grid ✅ PASSING (build) (2026-06-12)

Implemented:
- `[id]/edit-price/index.tsx` — `RouteFocusModal` + `DataGrid` over the
  product's offers (one row per offer), Title + per-currency price
  columns (reuses `createDataGridPriceColumns`), seeded from existing
  offer prices; submit fans out `sdk.vendor.offers.$id.mutate({ prices })`
  per offer + invalidates offer/product keys.
- `[id]/_components/offer-variants-section.tsx` — Variants-section header
  **Edit Price** action → `edit-price`.
- `get-route-map.tsx` — `edit-price` child under the detail page;
  removed the now-dead old `edit`/`pricing`/`inventory` children (those
  edits moved to `variants/:offer_id/*` in slice 5a).

Verification: `turbo build --filter=@mercurjs/vendor --force` → **2/2
successful**; oxlint clean. ⚠️ **Type-checked only** — DataGrid editing
interactions and the price seed/submit round-trip need manual runtime QA
(not runtime-testable in the headless loop).

### Slice 5c — bulk Edit Stock Levels grid ✅ PASSING (build) (2026-06-12)

Implemented:
- `packages/core/src/api/vendor/products/helpers.ts` —
  `OFFER_WRAP_FIELDS` extended with the offer's
  `inventory_item_link.inventory_item.location_levels.*` (same alias the
  offer detail uses), so the wrap returns per-location stock to seed the
  grid. Verified by a new `offer-products` case (**7/7**).
- `[id]/edit-stock/index.tsx` — `RouteFocusModal` + `DataGrid` over the
  product's offers, Title / SKU / per-location stock columns (reuses
  `createDataGridLocationStockColumns`), seeded from each offer's
  inventory location levels; submit builds a
  `useBatchInventoryItemsLocationLevels` create/update/delete payload
  across all offers.
- `get-route-map.tsx` — `edit-stock` child under the detail page.
- Re-added the **Edit stock levels** action to the list row kebab + the
  detail Variants-section header (both now have Edit Price + Edit Stock
  Levels).

### Slice 6 — create-wizard delta ✅ PASSING (2026-06-12)

- Tab-1 label **"Catalogue" → "Products"**.
- **Per-product grain (delivered in the post-review pass, see below):**
  tab-1 selects whole **products** (`selected_product_ids`); the form
  fans each selected product out to one row per variant in tab-2, which
  renders **product-group separator rows** above each product's variants.
  _(This supersedes the earlier "per-variant deviation" note.)_

### Final consolidation ✅ (2026-06-12)

- **`bun run build`** (all 9 packages) → **9/9 successful**.
- **`bun run test:integration:http vendor/offer`** → **2 suites, 24
  tests passed** (existing vendor offer suite + 7 `offer-products`
  wrap/filter/inventory-link tests). No regression to offer CRUD.

### Post-review & design-feedback fixes ✅ (2026-06-12)

Changes after PR [mercurjs#977](https://github.com/mercurjs/mercur/pull/977)
opened, from review comments + designer feedback. Each verified with the
vendor build (2/2); backend changes re-checked against the 24 integration
tests.

**PR review (`090674e7`):**
- `has_offer` uses Medusa `booleanString()` in the validator; middleware
  checks a real boolean.
- Loaders use the typed `sdk` (`sdk.vendor.products/offers.$id.query`)
  instead of raw `fetchQuery`.
- Reuse over copies: `ProductStatusCell`/`StatusBadge` for the status,
  `ProductMediaSection` for media; canonical DTO types
  (`OfferProduct`/`OfferProductVariant` = `HttpTypes.AdminProduct/Variant`
  + `OfferDTO`) across the detail, list, variants section, cards, and
  bulk grids.

**Cache invalidation (`ce9939c6`):** every offer mutation hook
(`useCreateOffer` / `useBulkCreateOffers` / `useUpdateOffer` /
`useBatchOfferInventoryItems` / `useDeleteOffer` / `useBulkDeleteOffers`)
now also invalidates `productsQueryKeys.all`, so the product-backed list
+ detail refresh after create / update / delete.

**Detail-page polish (`52fbc554`, `f305e58b`):**
- General-section status badge matches the product detail
  (`productStatusColor` exported + reused with `StatusBadge`).
- **Variants table rebuilt on the shared `DataTable`** to match the
  product detail's variants table: Title / SKU / one column per product
  option / Inventory ("N available at M locations"), with search, sort,
  and Created/Updated date filters — offer-scoped (one row per offer →
  `variants/:offer_id`).
- "Shipping Configuration" sidebar card mirrors the "Associated product"
  card's Pattern-A structure/size.

**Read-only media + create wizard + polish (`806fba9a`, `f750ba5c`):**
- Offer-detail **Media is read-only** via a new `readOnly` prop on
  `ProductMediaSection` (no edit kebab, selection, image links, or
  delete) — also fixes the earlier broken media-edit link / product
  mutation on the offer surface.
- **Create wizard → per-product grain** (Slice 6 above):
  `selected_variant_ids` → `selected_product_ids`; catalogue lists
  products; form hydrates variants per selected product; tab-2 shows
  **product-group separator rows** (interleaved read-only group rows;
  each variant grid row carries its `__formIndex` so field paths bind
  past the group rows).
- Tab-2 shipping column → singular **"Shipping Profile"** with an empty
  select placeholder.
- Create success toast → "Offer was successfully published. Only offers
  with stock levels and prices set will be visible on the storefront."

**Copy fixes (`8afe3104`):**
- Deleting a product listing reads **"1 offer"** (the listing) in the
  prompt + toast, not the count of its underlying per-variant offers.
- Catalogue helper text renders a bold **"Tip:"** label (Figma
  `40016485:453778`).

### Status: implemented

All SPEC-009 surfaces are implemented and type-check/build clean, with
backend behavior covered by integration tests, plus the post-review and
design-feedback fixes above. The two bulk DataGrid editors (Edit Price,
Edit Stock Levels) and the create wizard's grouped grid are
**type-checked**; their in-grid editing / seed-submit round-trips should
get a manual runtime QA pass (not exercisable headlessly). **No
remaining intentional deviations** — the per-variant create-grain
deviation was resolved.

### Known open item

**Bulk Edit Price is single-currency + replace-semantics** — saving the
bulk Edit Price grid submits only the seller's primary currency with
`useUpdateOffer({ prices })` (replace), so an offer's prices in *other*
currencies would be wiped. Fix = discover the full currency set (union of
every currency on the offers' existing prices + the seller's) and submit
all. (The per-variant Edit Price, which reuses `PricingForm`, is not
affected.)

## Notes

- The B2C design and the shipped B2B offer UI (SPEC-003) are **two
  different Figma files** with **different information architectures**.
  Do not treat this as a CSS-level refresh; the offer-grain change is the
  load-bearing decision and everything else follows from it.
- Re-using shipped primitives wherever the shape already matches keeps
  the blast radius down: the Inventory-items table, the Price sidebar
  card, the create-wizard grid columns, and the delete flow are all
  close to the design already.
- With option 1 chosen, this spec is mostly a read-layer + routing
  exercise: the `wrapProductVariantsWithOffers` helper + the
  seller-offered product filter (both on the vendor product endpoint),
  then the frontend page rebuilds. **No offer-table migration, no unique
  constraint, no new column** — `Offer` stays 1:1 with a variant and a
  seller may hold multiple offers per variant (distinct SKUs). The wrap +
  filter is the only backend slice and unblocks the list and the
  product-shaped detail page.
- **No `manage_inventory` / `allow_backorder` work** — the design's two
  toggles in the Edit Offer Variant drawer are **not shipped** (product
  direction); those fields stay removed (SPEC-002) and are not
  re-introduced. The Edit Details drawer ships with SKU only. Everything
  else is additive to the existing per-variant offer.
