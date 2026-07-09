---
status: passing
canonical: false
priority: 25
area: core/api/products
created: 2026-07-09
last_updated: 2026-07-09
---

# SPEC-025 Migrate Product List Filtering to the Medusa Index Module

Replace the hand-rolled seller/link filtering on the three product list surfaces
(`vendor`, `store`, `admin`) with Medusa's **Index Module** (`query.index`).

Today each surface scopes products by mutating `req.filterableFields` in
middleware and then calling `query.graph`. Seller scoping is expressed either via
Medusa's `maybeApplyLinkFilter` helper (store) or via bespoke async middleware
that pre-resolves product-id sets (vendor). The Index Module lets the route
express the same scoping declaratively against indexed relations:

```ts
const { data, metadata } = await query.index({
  entity: "product",
  fields: ["*", "seller.*"],
  filters: { seller: { id: sellerIds } },
  pagination: req.queryConfig.pagination,
})
```

This is a **contract-preserving refactor**: the HTTP response shape, pagination
metadata, and visibility rules for each surface must not change. The value is
removing custom filter plumbing, getting denormalized-index query performance,
and a single declarative filtering model across surfaces.

## Background — current state

Verified against the repo on 2026-07-09.

### Where filtering lives today

- **store** — `packages/core/src/api/store/products/middlewares.ts`
  - `applyVisibleSellerIdsFilter` sets `req.filterableFields.seller_id` to the
    set of *visible* sellers (`SellerStatus.OPEN`, within `closed_from`/`closed_to`
    windows) via `resolveVisibleSellerIds(req.scope)`.
  - `maybeApplyLinkFilter({ entryPoint: "product_seller", resourceId: "product_id", filterableField: "seller_id" })`
    converts that `seller_id` filter into a `product_seller` link query.
  - Applied to **both** `GET /store/products` and `GET /store/products/:id`.
  - `route.ts` strips `region_id` / `currency_code` (pricing context) before
    calling `query.graph`.
- **vendor** — `packages/core/src/api/vendor/products/middlewares.ts`
  - `applySellerProductLinkFilter` (async) resolves two id sets for the
    authenticated `req.seller_context.seller_id`:
    - `getSellerOwnedProductIds` — products the seller authored, derived from
      `product_change_action` rows with action `PRODUCT_ADD`.
    - `getProductIdsRestrictedFromSeller` — products whose `product_seller`
      rows belong to *other* sellers.
  - Appends to `req.filterableFields.$and`:
    `{ $or: [ { id: ownProductIds }, { status: PUBLISHED, id: { $nin: restrictedFromSellerIds } } ] }`.
  - Applied to `GET /vendor/products` (list) only.
- **admin** — `packages/core/src/api/admin/products/middlewares.ts`
  - **No seller filtering.** Only `applyOfferedProductsFilter` (optional
    `has_offer` query param). Admin sees all products.

### Link definition

`packages/core/src/links/product-seller-link.ts` — many-to-many
`product` ⇄ `seller`, table `product_seller`.

### Index Module availability

- Framework version: `@medusajs/framework` **2.17.2** (root + `apps/api`).
- The index module ships with this version but is **not enabled**:
  `apps/api/medusa-config.ts` has no `index_engine` feature flag and does not
  register `@medusajs/medusa/index-module`.
- No `query.index` usage exists in the codebase yet.
- Feature flag name: `index_engine`. Enabled via `featureFlags.index_engine: true`
  (or `ENABLE_INDEX_MODULE=true`) **and** registering the module:
  ```ts
  modules: [
    // ...
    { resolve: "@medusajs/medusa/index-module" },
  ]
  ```
- `query.index({ entity, fields, filters, pagination, context })` returns
  `{ data, metadata: { skip, take, estimate_count } }`.

## Key constraint — the index only sees what is registered

`query.index` does **not** query live module tables the way `query.graph` does.
It queries a denormalized catalog populated from module index/`Searchable`
config. Consequences that drive the phased plan below:

1. The `seller` relation and the `product_seller` link must be registered as
   **indexable**, or `filters: { seller: { id } }` cannot resolve.
2. `query.index` filters only on **indexed** paths. Anything derived from a
   non-indexed table (see vendor authorship, below) cannot be expressed directly.
3. Enabling the module requires an **initial `sync`** to backfill the index, plus
   ongoing event-driven upserts. Boot/backfill and staleness are new operational
   concerns this spec must not silently introduce.

## Phasing (do NOT do all three at once)

The three surfaces have very different difficulty. Ship them independently.

### Phase 0 — Enable the index module (prerequisite for all phases)

- Add `featureFlags.index_engine` and register `@medusajs/medusa/index-module`
  in `apps/api/medusa-config.ts`.
- Register `product`, the `seller` relation, and the `product_seller` link as
  indexable so `filters.seller.id` resolves.
- Confirm an initial `sync` backfills the index and that product/seller/link
  mutations keep it current.
- **Evidence gate:** a throwaway route (or test) proves
  `query.index({ entity: "product", fields: ["*","seller.*"], filters: { seller: { id: [...] } } })`
  returns the same product set as the equivalent `query.graph` + link filter.

### Phase 1 — store (highest value, lowest risk)

- Replace `applyVisibleSellerIdsFilter` + `maybeApplyLinkFilter` with a
  `query.index` call filtered by `seller: { id: resolveVisibleSellerIds(...) }`.
- Preserve the `region_id` / `currency_code` stripping and the existing
  `queryConfig.fields` (including offer pricing hydration). Pricing/calculated
  price must remain identical — hydrate via the existing path if the index does
  not carry offer-scoped prices.
- Apply to both list and `:id` retrieve.

### Phase 2 — admin (opt-in, low urgency)

- Admin has no seller scoping, so this is purely swapping the list query engine
  for pagination/perf parity. Keep `applyOfferedProductsFilter` behavior.
- Only pursue if it demonstrably helps; otherwise document as deferred.

### Phase 3 — vendor (hard case — may need index model work)

- The `$or` of *authored* vs *published-and-not-restricted* cannot be expressed
  as a single link filter today, because the authored half derives from
  `product_change_action` (PRODUCT_ADD), which is **not** an indexed relation.
- Options (decide during implementation, record the choice):
  1. Index the authorship signal (e.g. a `created_by_seller` / owner link) so the
     `$or` becomes `{ seller: { id }, ... }` expressible on indexed paths.
  2. Keep resolving `ownProductIds` in middleware and pass it into `query.index`
     as an `id` filter (hybrid — still removes `maybeApplyLinkFilter` but not the
     id pre-resolution).
- Do not force a lossy migration. If parity can't be proven, leave vendor on the
  current middleware and mark Phase 3 `blocked` with the reason.

## User-Visible Behavior

No user-visible change. For each migrated surface:

- **store** — anonymous shoppers see products only from visible (open,
  non-closed) sellers; same set, order, pagination, and pricing as before.
- **vendor** — an authenticated seller sees exactly the products they authored
  plus published products not restricted to other sellers — byte-identical to
  the current `$or` result.
- **admin** — operators see all products; `has_offer` filtering unchanged.

## Verification

Existing coverage (verified 2026-07-09) — these suites must stay **green
unchanged** after migration; they already encode the exact behavior being
refactored, so they are the primary parity gate:

- **store** — `integration-tests/http/product/store/product.spec.ts`
  - `GET /store/products`: 400 without publishable key; lists published from
    approved sellers; excludes drafts; **excludes suspended sellers**;
    **excludes sellers within the closure window**; filter by `id`; filter by
    `category_id`; excludes inactive-category products; `limit`/`offset`
    pagination.
  - `GET /store/products/:id`: retrieves a single published product; surfaces
    linked `attributes`; 404 for non-existent; 404 for draft.
  - `integration-tests/http/product/store/offer-product-price.spec.ts` — guards
    the offer-scoped pricing that must survive Phase 1.
- **vendor** — `integration-tests/http/product/vendor/product.spec.ts`,
  `describe("Vendor - product list scoping")`:
  - scopes the list to the seller's own proposed products **plus** published;
  - hides a restricted (`product_seller`) published product from sellers it is
    not assigned to.
  - hides another seller's unpublished product from everyone but its author
    (added for SPEC-025).
  - (Plus attribute-batch and image suites in the same file — must stay green.)
- **admin** — `integration-tests/http/product/admin/product.spec.ts`,
  `describe("Admin - product list")` (added for SPEC-025):
  - lists products of every status, unscoped by seller (admin sees restricted +
    global + draft);
  - returns pagination metadata and honors `limit`/`offset`;
  - filters to products with an offer when `has_offer=true`.
  - (Plus the pre-existing attribute batch/create suite — must stay green.)

Run the surface's suite via
`bun run test:integration:http -- product/<surface>/product.spec.ts`.

For every migrated surface, prove **parity**:

1. Enable the index module and run its initial `sync`.
2. The existing suites above pass unchanged (no assertion edits — if a test
   needs changing, the migration is not contract-preserving; stop and justify).
3. The parity gate above is now filled across all three surfaces (admin list
   scoping/pagination/`has_offer` and the extra vendor authorship case were
   added and verified green on pre-migration code — see Evidence). Any further
   parity assertions should extend these same domain files, not new ones.
4. Confirm index staleness is handled: after creating/updating a product or
   seller, the list reflects the change (event-driven index upsert works) — the
   store closure-window and suspend tests already exercise this indirectly.
5. `bun run build` passes.

## Implementation (2026-07-09)

Shipped as a hybrid (index-with-graph-fallback), decided with the user:
**exact count kept**, **full index migration on all three routes**, graph
fallback only for index-unsupported filters (Medusa's own convention).

- **Enablement** — `withMercur` now sets `featureFlags.index_engine: true` and
  auto-injects `{ resolve: "@medusajs/index" }` (single control point; flips it
  on for the app and the integration test runner). The standalone
  `@medusajs/index` package is not resolvable from app dirs under bun's isolated
  linker, so it was added as a dependency of `apps/api`, `integration-tests`,
  and `templates/basic/packages/api`.
- **Shared helper** — `api/utils/list-products.ts::listProducts()`: uses
  `query.index` when the index module is registered *and* the filters are
  index-supported; otherwise `query.graph`. The index engine only returns
  `estimate_count`, so an exact `count` is read from a `query.graph` count over
  the same filters (`take: 1`, exact `metadata.count`).
- **Engine detection** — gated on the request container
  (`scope.resolve(Modules.INDEX, { allowUnregistered: true })`), NOT
  `FeatureFlag.isFeatureEnabled`. `@mercurjs/core` compiles against a different
  `@medusajs/framework` copy (2.16-options-preview) than the running app
  (2.17.2), so the `FeatureFlag` singleton core sees is not the one the app
  populates — using it would silently force the graph fallback. Verified at
  runtime: 7 index calls / 2 graph-fallback calls in the store suite.
- **Seller scoping** — store list replaced `maybeApplyLinkFilter` with
  `applyVisibleSellerProductScope`, which resolves visible-seller product ids
  and constrains `product.id` (index- *and* graph-native). Vendor/admin
  middlewares already emit index-native `id`/`status`/`variants.id` filters and
  were left unchanged. The store `:id` retrieve stays on `query.graph`.
- **Pricing-context strip** — the store route now strips `region_id`,
  `currency_code`, `country_code`, `province`, `cart_id` before the query. The
  pricing middleware writes these (often `undefined`) into `filterableFields`;
  `query.graph` ignored undefined keys but `query.index` throws
  `Field country_code is not indexed`. (Regression caught by
  `offer-product-price.spec.ts`.)
- **`ProductStatus`** — repointed ~8 core files from the removed
  `@mercurjs/types` re-export to Medusa's runtime enum
  (`@medusajs/framework/utils`), per the note that Mercur's `ProductStatus` is
  identical to Medusa's.

## Evidence

- `bun run build` — 11/11 tasks pass.
- Index path proven live (not a silent fallback): store suite run showed 7
  `query.index` calls and 2 `query.graph` fallbacks (the `categories` tests).
- Integration suites (index engine enabled, run 2026-07-09):
  - `product/store/product.spec.ts` — 14/14 (incl. suspended-seller, closure
    window, `category_id` via graph fallback, id filter, pagination).
  - `product/vendor/product.spec.ts` — 9/9 (own-proposed-plus-published,
    restricted-hidden, author-only unpublished).
  - `product/admin/product.spec.ts` — 24/24 (+4 pre-existing skips) (unscoped
    list, pagination, `has_offer`).
  - `product/store/offer-product-price.spec.ts` — 4/4.
  - Regression sweep green: `offer/admin/grouped-offers` (4/4),
    `product-categories/vendor` (11/11),
    `product-edit/admin/product-publish-approval` (5/5).
- Eventual consistency: the index syncs asynchronously, so parity tests that
  list immediately after create use a new `integration-tests/helpers/wait-for.ts`
  poll (mirrors Medusa's `waitForIndexedEntities`).

## Notes on the delivered approach

- Seller scoping is done by resolving a product-**id** set rather than a
  `filters: { seller: { id } }` link filter. The index schema in this build
  *does* index `Seller`, so a filterable product↔seller link (`{ seller: { id } }`)
  is a viable future simplification, but id-scoping is engine-agnostic and was
  chosen to keep the graph fallback and exact-count paths identical. Trade-off:
  the visible-seller id set can grow large for big catalogs.
- Enabling `index_engine` by default means every downstream Mercur app must have
  `@medusajs/index` installed and an event bus for sync; without the dependency
  the app fails to boot (`Cannot resolve module '@medusajs/index'`). This is now
  wired into the starter template.

## Notes

- This is a refactor, not a feature. Do **not** mark `passing` because
  `query.index` "works" — only when parity is proven for the surfaces claimed.
- Enabling the index module is a global config change with backfill/ops
  implications; call it out in `claude-progress.md` and confirm boot `sync`
  cost is acceptable for `apps/api`.
- The store `region_id`/`currency_code` handling and offer-scoped calculated
  price (see SPEC-016 / store offers) are the most likely parity traps — the
  index may not carry offer-scoped prices, so pricing hydration must be
  preserved.
- Vendor authorship via `product_change_action` (PRODUCT_ADD) is the single
  biggest blocker to a clean vendor migration; resolve it deliberately.
- Relevant files:
  - `packages/core/src/api/store/products/{middlewares,route}.ts`
  - `packages/core/src/api/vendor/products/{middlewares,route}.ts`
  - `packages/core/src/api/admin/products/{middlewares,route}.ts`
  - `packages/core/src/links/product-seller-link.ts`
  - `apps/api/medusa-config.ts`
