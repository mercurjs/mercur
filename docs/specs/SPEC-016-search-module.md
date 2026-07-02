---
status: not_started
canonical: true
priority: 16
area: core/search
created: 2026-07-02
last_updated: 2026-07-02
---

# SPEC-016 Provider-Agnostic Search Module

Add a **provider-agnostic Search module** to `@mercurjs/core`, modeled on
Medusa's own "module with pluggable providers" pattern (`file`, `notification`).
The module defines a stable provider contract; concrete search backends are
swappable providers registered via module options. **Exactly one provider is
active at a time** — the module has no multi-provider machinery; swapping
backends means changing the single configured provider. Mercur ships **one
default provider — `search-orama`** — an in-process, in-memory [Orama](https://docs.orama.com)
index that requires zero external infrastructure. Operators can replace it with
a persistent provider (Algolia, Meilisearch, or their own) by implementing the
same contract, without touching subscribers, the store route, or the storefront.

Products **and offers** are searchable. Offers are indexed as **per-offer
documents** (one hit per vendor offer), carrying the offer's `offer_id`-scoped
calculated price so results price identically to `GET /store/offers`.

## Design Goal — Provider Agnosticism (the whole point of this rewrite)

Everything above the provider is provider-agnostic:

- **Subscribers** call `searchModuleService.index(docs)` / `.delete(ids)`.
- **The store route** calls `searchModuleService.search(term, opts)` (returns
  ids + meta) then hydrates via `query.graph` — identical for every provider.
- **Boot reindex** is orchestrated by core reading Postgres and calling
  `index()`; whether a boot reindex is *needed* is a provider capability flag.

Only the provider knows how/where documents are stored. The default
`search-orama` provider keeps them in RAM (needs a boot reindex); an
Algolia/Meili provider keeps them in the external service (no boot reindex).
This is exactly how `Modules.FILE` delegates `upload`/`delete` to whichever file
provider is registered.

## Reference — Medusa's provider-module pattern

Studied in `/Users/viktorholik/Desktop/medusa`. We mirror the **`file` module**
(exactly-one-active-provider semantics; search wants a single active backend, not
one-per-channel like `notification`). Key reference files:

- Provider interface: `packages/core/types/src/file/provider.ts` (`interface IFileProvider`).
- Abstract base: `packages/core/utils/src/file/abstract-file-provider.ts`
  (`AbstractFileProviderService` — `static identifier`, `static validateOptions`,
  methods that throw until overridden).
- Module options: `packages/modules/file/src/types/index.ts`
  (`FileModuleOptions = { provider?: { resolve, id, options } }`,
  `FileProviderRegistrationPrefix = "fs_"`).
- Providers loader: `packages/modules/file/src/loaders/providers.ts`
  (`moduleProviderLoader` + `registrationFn` registering under
  `<prefix><identifier>_<id>` via `asFunction((cradle) => new klass(cradle, options))`).
- Provider service (delegation): `packages/modules/file/src/services/file-provider-service.ts`
  (scans container keys by prefix, asserts exactly one, forwards calls).
- Module service: `packages/modules/file/src/services/file-module-service.ts`
  (injects `fileProviderService`, delegates public API).
- Module def: `packages/modules/file/src/index.ts`
  (`Module(Modules.FILE, { service, loaders: [loadProviders] })`).
- `ModuleProvider` helper: `packages/core/utils/src/modules-sdk/module-provider.ts`
  (`ModuleProvider(name, { services, loaders }) → { module, services, loaders }`).
- Concrete default provider package: `packages/modules/providers/file-local/`
  (`src/index.ts` → `ModuleProvider(Modules.FILE, { services: [LocalFileService] })`;
  `src/services/local-file.ts` → `class LocalFileService extends
  AbstractFileProviderService { static identifier = "localfs"; constructor(_, options) { super(); … } }`).

Mercur cannot extend Medusa's `Modules` enum, so the module uses a Mercur module
name constant (`MercurModules.SEARCH = "search"`), exactly as the offer module
uses `MercurModules.OFFER`.

## The Provider Contract

Interface + DTOs in `@mercurjs/types` (`packages/types/src/search/`), abstract
base re-exported from `@mercurjs/core` so provider authors extend it.

### Document schema — two tiers (from the reference Orama worker)

A working Orama handler informed two decisions about how documents are shaped:

1. **Narrow *indexed* schema vs. full *stored* payload.** The provider indexes
   only a small set of fields (what gets tokenized, `where`-filtered, and
   faceted); everything else (`type`, labels, thumbnail) rides along in the
   stored document and is returned verbatim in the hit. For Orama this is
   literally the difference between the `create({ schema })` shape and the object
   handed to `insertMultiple` — Orama stores the whole object but only indexes
   the declared `schema` keys.
2. **Store both the filter/facet key and its label.** The worker stores
   `collection_id` + `collection` and `category_ids[]` + `categories[]` so the
   route can render faceted filters (id for filtering, label for display) without
   a second lookup.

> **Correction to the worker's price model — Mercur has NO variant prices.**
> The reference worker stored `variants[].prices` keyed by region. That does not
> apply here: in Mercur, prices live on **offers**, not variants. A product's
> displayed price is the **buybox** — the *cheapest offer* — computed by the
> pricing engine (`packages/core/src/api/utils/offers.ts` →
> `wrapProductVariantsWithOfferPrice`: all of a variant's offers share the
> variant price set, so `calculatePrices({ id: priceSetIds }, { context: {
> offer_id: offerIds } })` returns the lowest matching price per variant, and the
> winning `offer_id` is recovered from the result). The storefront then picks the
> cheapest variant for the product "from" price
> (`get-product-price.ts` → `cheapestVariant()`).
>
> Because the buybox depends on request context (region, currency, tax), it is
> **not** a static snapshot the way region-keyed variant prices would be.
> Therefore:
> - The index stores only a **numeric buybox snapshot** (`price`, default region
>   / base currency) — used **solely for price-range filtering and sort**, never
>   for display.
> - The **display price is always hydrated** at request time by reusing the
>   existing `wrapProductVariantsWithOfferPrice` (products) and
>   `wrapOffersWithCalculatedPrices` (offers) helpers — so search shows exactly
>   what `/store/products` and `/store/offers` show for the caller's region.
>
> This drops the earlier "products project prices straight from the index"
> optimization: both products and offers hydrate, because both prices are
> offer-derived and context-dependent.

```ts
// packages/types/src/search/provider.ts (sketch)

// Tier 1 — INDEXED fields the provider tokenizes / filters / facets on.
// (For the Orama provider these become the `create({ schema })` keys:
//  string | string[] | number only.)
export interface SearchIndexedFields {
  id: string
  type: "product" | "offer"
  title?: string
  description?: string
  handle?: string
  seller_handle?: string
  seller_status?: string           // route enforces "open"
  collection_id?: string           // facet/filter key ...
  category_ids?: string[]          // ... paired with human labels below
  tag_ids?: string[]
  sku?: string                     // offers
  product_id?: string              // offers → parent product
  variant_id?: string              // offers
  // Buybox SNAPSHOT (default region / base currency): cheapest offer for the
  // product (min across variants) or the offer's own price. Range-filter + sort
  // ONLY — never displayed; display price is hydrated (see store route).
  price?: number
}

// Tier 2 — STORED payload returned verbatim in hits, NOT indexed.
export interface SearchStoredPayload {
  thumbnail?: string
  collection?: string              // label for collection_id
  categories?: string[]            // labels for category_ids
  tags?: string[]
  type?: { id: string; value: string } | null
  // The winning offer of the buybox snapshot (for debugging / cache-busting).
  // The authoritative offer is re-resolved at request time during hydration.
  buybox_offer_id?: string | null  // products
}

export type SearchDocument = SearchIndexedFields & SearchStoredPayload

export interface SearchQueryOptions {
  page?: number
  hitsPerPage?: number
  filters?: {
    type?: "product" | "offer"
    collection_ids?: string[]      // OR within a type, AND across types
    category_ids?: string[]
    price_min?: number
    price_max?: number
    seller_handle?: string
    seller_status?: string         // route always sets "open"
  }
  // facet keys to compute distributions for (e.g. ["collection_id","category_ids"])
  facets?: string[]
}

export interface SearchResult {
  // Full stored documents in hit order (title/labels/thumbnail for the card).
  // The DISPLAY price is not taken from here — the route hydrates it (buybox for
  // products, offer calculated_price for offers) using the ids below.
  hits: SearchDocument[]
  ids: string[]                    // hit ids in order — drive hydration
  totalHits: number
  page: number
  totalPages: number
  processingTimeMs?: number
  // per facet key: { valueId: count } — recomputed per SearchQueryOptions.facets
  facetDistribution?: Record<string, Record<string, number>>
}

export interface ISearchProvider {
  index(documents: SearchDocument[]): Promise<void>
  delete(ids: string[]): Promise<void>
  search(term: string, options: SearchQueryOptions): Promise<SearchResult>
  getStatus(): Promise<{ documentCount: number; isHealthy: boolean }>
  ensureSetup?(): Promise<void>                 // create index / apply settings
  requiresBootstrapReindex?(): boolean          // true = core reindexes on boot
}
```

**Faceting semantics (also from the worker):** facet counts are **OR within a
filter type, AND across types** — each facet distribution is recomputed with its
*own* filter removed but the other filters still applied (so selecting one
category still shows the other categories' live counts). The store route returns
`{ id, label, count }` triples by joining `facetDistribution` keys against the
stored label fields (`collection`, `categories`). This is a store-route concern
built on top of the provider's raw `facetDistribution`; providers only return
raw counts.

```ts
// abstract base (mirrors AbstractFileProviderService)
export class AbstractSearchProviderService implements ISearchProvider {
  static identifier: string
  static validateOptions(options: Record<string, unknown>): void | never {}
  getIdentifier() { return (this.constructor as typeof AbstractSearchProviderService).identifier }
  async index(_: SearchDocument[]): Promise<void> { throw new Error("index must be overridden") }
  async delete(_: string[]): Promise<void> { throw new Error("delete must be overridden") }
  async search(): Promise<SearchResult> { throw new Error("search must be overridden") }
  async getStatus() { throw new Error("getStatus must be overridden") }
  requiresBootstrapReindex() { return false }
}
```

## The Search Module

`packages/core/src/modules/search/`

- `index.ts`: `MercurModules.SEARCH = "search"` +
  `Module(MercurModules.SEARCH, { service: SearchModuleService, loaders: [loadProviders] })`.
- `types.ts`: `SearchProviderRegistrationPrefix = "search_"`,
  `SearchProviderIdentifierRegistrationName = "search_providers_identifier"`,
  `SearchModuleOptions = Partial<ModuleServiceInitializeOptions> & { provider?:
  { resolve: string | ModuleProviderExports; id: string; options?: Record<string, unknown> } }`.
- `loaders/providers.ts`: `registrationFn` registering the provider under
  `SearchProviderRegistrationPrefix + <identifier>_<id>` via
  `asFunction((cradle) => new klass(cradle, options))`, calling the shared
  `moduleProviderLoader`. Mirror `file/src/loaders/providers.ts` verbatim.
- `services/search-provider-service.ts`: resolve the single provider by
  scanning container keys for the prefix (assert exactly one, like
  `FileProviderService`), forward `index`/`delete`/`search`/`getStatus`/
  `ensureSetup`/`requiresBootstrapReindex`.
- `services/search-module-service.ts`: inject `searchProviderService`, delegate
  the public API. This is what subscribers, routes, and the boot loader resolve
  (`container.resolve(MercurModules.SEARCH)`).
- `loaders/bootstrap.ts`: on init, if the active provider's
  `requiresBootstrapReindex()` is true, run the reindex (paginate published
  products + their offers → `index()`). This is what makes the in-memory Orama
  provider survive restarts; persistent providers skip it.

Register the module in `withMercur()` with a **default provider fallback**: if
the consuming app passes no `search.provider`, default to `search-orama` (mirror
how Medusa apps default file to `file-local`). Emit a startup warning when the
active provider `requiresBootstrapReindex()` **and** `MEDUSA_WORKER_MODE !==
"shared"` (in-memory index is per-process — see Notes).

## The Default Provider — `search-orama`

Packaged like Medusa's `file-local`. Location:
`packages/core/src/modules/search/providers/orama/` (bundled with core; a
standalone `@mercurjs/search-orama` package can be extracted later).

- `index.ts`: `ModuleProvider(MercurModules.SEARCH, { services: [OramaSearchProviderService] })`.
- `service.ts`: `class OramaSearchProviderService extends
  AbstractSearchProviderService { static identifier = "search-orama"; … }`.
  - Constructor `(container, options)` builds the Orama schema lazily.
  - `index()` → `removeMultiple` + `insertMultiple`; `delete()` →
    `removeMultiple`; `search()` → Orama `search()` returning ids + meta;
    `getStatus()` → doc count from the live db.
  - `requiresBootstrapReindex()` → `true` (in-memory).
- `@orama/orama` added as a dependency of `@mercurjs/core`.

A reference persistent provider (Algolia/Meili) is **out of scope** here — the
existing registry blocks can be refactored into this contract in a follow-up.

## Subscribers (provider-agnostic)

`packages/core/src/subscribers/` — follow the core convention
(`export default async fn({ event, container })` + `export const config`). All
resolve `container.resolve(MercurModules.SEARCH)` and call the module service;
none know which provider is active.

- `search-product-events-bridge.ts` — the 6 Medusa product events
  (`product.created/updated/deleted` + `product.product.*`) → transform →
  `search.index(...)` / `search.delete(...)`. Enforce seller-status like the
  Meili block bridge.
- `search-offer-events.ts` — `OfferWorkflowEvents.CREATED/UPDATED/DELETED`
  (`packages/core/src/workflows/events.ts`). Re-fetch the offer **with its
  calculated price** by reusing `wrapOffersWithCalculatedPrices` /
  `splitComputedOfferFields` from `packages/core/src/api/store/offers/helpers.ts`
  so the indexed `price` matches `GET /store/offers`; index one document per
  offer (`type: "offer"`).
- `search-seller-suspended.ts` / `search-seller-unsuspended.ts` — reindex the
  seller's products + offers so suspended sellers drop out.

Transform helpers live in `packages/core/src/subscribers/utils/search-*.ts`
(`filterProductsByStatus`, `findAndTransformProducts`, `findAndTransformOffers`,
`reindexSellerContent`).

## Endpoint Contracts

- `POST /store/search`
  - Body: `{ query: string, page?=1, hitsPerPage?=12 (max 100),
    filters?: { type?, collection_ids?, category_ids?, price_min?, price_max?,
    seller_handle? }, currency_code?, region_id?, customer_id?, customer_group_id? }`.
  - Behavior: `search.search(query, opts)` with `filters.seller_status` forced
    to `"open"` server-side. Two projection paths from the returned hits:
    - **Products** — project straight from the stored document, selecting each
      variant's price via `prices[region_id]` (no hydration). This is the fast
      path enabled by the two-tier document above.
    - **Offers** — re-hydrate via `query.graph` with pricing/tax context so the
      `offer_id`-scoped `calculated_price` reflects the caller's region/tax
      (mirror the Meili block route), preserving hit order.
  - Facets: recompute each requested facet with its own filter removed
    (OR-within/AND-across), then join counts to labels → `{ id, label, count }`.
  - Response: `{ hits, totalHits, page, totalPages, hitsPerPage, query,
    processingTimeMs, facets: { collections: FacetValue[], categories: FacetValue[] } }`.
  - Middleware: `authenticate("customer", …, { allowUnauthenticated: true })`
    + Medusa `setPricingContext` / `setTaxContext` scoped to `calculated_price`
    (mirror `store/offers/middlewares.ts`).
- `GET /admin/search` → active provider `getStatus()` → `{ documentCount,
  isHealthy, provider: <identifier> }`.
- `POST /admin/search` → run `syncSearchWorkflow` (full reindex from Postgres
  via `search.index`).

## Storefront — `apps/storefront`

Reuse the existing search plumbing (`searchProducts()` in
`src/lib/data/products.ts` → `NavbarSearch` → `?query=` → `/categories` server
page → client listing component). Because the store route is provider-agnostic,
the storefront never needs to know which backend is active.

1. `src/lib/data/search.ts`: `searchCatalog()` POSTing to `/store/search` (via
   `sdk.client.fetch`, or the typed `mercur` client once `store.search` is in
   the generated `Routes`).
2. `NEXT_PUBLIC_SEARCH_PROVIDER=mercur` flag: branch the listing page
   (`categories/page.tsx`, `collections/[handle]/page.tsx`) to a Mercur-search
   listing component alongside the existing Algolia one.
3. Render offer hits with the existing `get-offer-price.ts` → `getPricesForVariant`.

## User-Visible Behavior

- Searching from the navbar returns relevance-ranked products and per-offer
  hits when the Mercur search provider is selected.
- Suspended-seller content never appears (server-enforced `seller_status = "open"`).
- Offer hits price identically to the product page / `GET /store/offers`.
- New published products and new/updated offers appear within one event cycle;
  deleted/unpublished content disappears.
- Swapping the provider (e.g. to Algolia) changes nothing user-visible except
  latency/scale characteristics — no storefront or API changes.
- Admin: `GET /admin/search` reports the active provider + doc count;
  `POST /admin/search` forces a reindex.

## Implementation Plan

1. Provider contract in `@mercurjs/types` (`ISearchProvider`, DTOs) +
   `AbstractSearchProviderService` re-exported from `@mercurjs/core`.
2. Search module (`index.ts`, `types.ts`, `loaders/providers.ts`,
   `services/search-provider-service.ts`, `services/search-module-service.ts`,
   `loaders/bootstrap.ts`) — copy the `file` module structure.
3. Default `search-orama` provider + `@orama/orama` dependency; wire the
   default-provider fallback into `withMercur()`.
4. Subscribers (product bridge, offer events, seller suspend/unsuspend) +
   transform utils.
5. Store `/store/search` route (id-then-hydrate, enforce `seller_status="open"`)
   + validators + middleware registration.
6. Admin `/admin/search` route + `syncSearchWorkflow`.
7. Storefront data fn + `NEXT_PUBLIC_SEARCH_PROVIDER` branch + offer-hit rendering.
8. Integration tests under `integration-tests/http/search/store/`.

## Verification

1. `bun run lint` clean on touched files; `tsc --noEmit` on `@mercurjs/core`
   and `@mercurjs/types` exits 0; route map regenerated under
   `packages/core/.mercur/_generated/` with `store.search` and `admin.search`.
2. Integration tests (mirror offer / product-attribute suites), all against the
   default `search-orama` provider:
   - published product searchable after boot reindex;
   - creating an offer yields a `type:"offer"` hit with non-null `price`;
   - updating an offer's price updates the indexed `price`;
   - deleting an offer / unpublishing a product removes the hit;
   - suspending a seller removes their content; unsuspending restores it;
   - `seller_status="open"` enforced even with no client filter;
   - hydrated offer `calculated_price` equals `GET /store/offers` for that offer.
3. Provider-swap test: register a trivial in-test fake provider via module
   options and assert subscribers + `/store/search` call it — proving the
   pipeline is provider-agnostic and the module resolves the configured provider.
4. Manual: `MEDUSA_WORKER_MODE=shared`, storefront flag on — restart the API,
   confirm search returns results immediately (boot reindex), create an offer in
   the vendor panel, confirm it appears in storefront search within one cycle.

## Evidence

_(to be filled in by the implementing session)_

## Notes

- **In-memory caveat is now provider-local.** The single-process /
  `MEDUSA_WORKER_MODE=shared` / rebuild-on-boot constraints apply **only** to the
  default `search-orama` provider, because its index lives in the API process's
  RAM (writers and the reader must be the same process; every replica has its own
  copy; restart is empty → boot reindex). A persistent provider (Algolia, Meili,
  or an Orama build using `@orama/plugin-data-persistence` to Redis) drops all of
  these constraints. `requiresBootstrapReindex()` is the seam: core reindexes on
  boot only when the active provider asks for it.
- **Single active provider is a hard design constraint (file pattern), not
  multi (notification pattern):** the marketplace runs exactly one search
  backend at a time. `search-provider-service.ts` asserts exactly one registered
  provider and throws otherwise, and the module options expose a singular
  `provider` (never a `providers[]` array). The `notification`
  one-provider-per-channel machinery (a DB table + channel routing) is
  deliberately excluded.
- **Migrating the existing registry blocks:** the Algolia/Meilisearch blocks in
  `packages/registry` can later be refactored to implement `ISearchProvider` and
  register through this module, unifying three code paths into one contract.
- **Pricing snapshot caveat** (from SPEC-007): indexed offer `price` is a
  snapshot for ranking/filtering; the authoritative price is always the hydrated
  `calculated_price` computed at request time with the caller's pricing context.
- **Do not** override product default `fields` with `+field` on vendor product
  lists (`vendor-products-default-fields-500` memory); reindex/hydrate queries
  must use curated field lists.
