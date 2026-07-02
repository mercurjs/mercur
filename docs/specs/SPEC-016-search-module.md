---
status: in_progress
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

- **Subscribers** call `search.index(docs)` / `search.remove(ids)` (via the
  `lib/sync` helpers) on product / offer / seller events — see "Subscribers".
- **The store route** calls `search.search(query)` (returns hit docs + facets);
  the provider projects each doc's `prices[context.region_id]` onto
  `calculated_price` — identical for every provider, no `query.graph` hydration.
- **Boot reindex** is event-driven: the module service's `onApplicationStart`
  hook (worker mode only) emits `search.reindex`, and the `search-reindex`
  subscriber runs `reindexAll` with the real request-scoped container. In-memory
  providers rebuild on boot this way; a persistent provider can ignore the event.

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

### Document + provider types (kept flat, like the reference worker)

Keep the type surface as small as the reference worker. One flat `SearchDoc`, a
minimal `SearchQueryBase` (universal bits only — providers extend it with their
own `filters`), one `SearchResults`, one provider interface with three verbs
(`index` / `remove` / `search`). No `Indexed`/`Stored` split, no DTO ceremony —
the "narrow indexed schema" is just the Orama `create({ schema })` const inside
the provider; the document type stays whole (exactly how the worker has a small
`schema` and a full `StoredProduct`).

Store both the filter/facet **id and its label** (`collection_id` + `collection`,
`category_ids[]` + `categories[]`) so the route renders facets without a second
lookup — the one document-shape idea worth taking from the worker.

**Attribute facets/filters** follow the same store-id-and-label idea, but the
attribute set is *dynamic* (handles are data, not fixed columns) while Orama's
`create({ schema })` needs static keys. So attributes ride as **one flat
facetable `enum[]` token field** — `attribute_tokens`, values of the form
`attr:<attribute_handle>:<value_id>` — plus a **stored (non-indexed) label map**
(`attributes`) that the route joins to render grouped facets. This is the only
attribute field in the Orama schema; it keeps the "one flat `SearchDoc`" rule
intact. Only attributes flagged `is_filterable` on the `product-attribute`
module are tokenized (the existing admin flag — no new flag, no migration).
**Offers inherit their parent product's attribute tokens/labels**, so attribute
filters narrow product and offer hits identically.

> **Prices are stored per region (worker model), but the number is the buybox.**
> Mercur has no variant prices — prices live on **offers**, and a product's price
> is the **buybox** (cheapest offer), computed by the pricing engine
> (`packages/core/src/api/utils/offers.ts` → `wrapProductVariantsWithOfferPrice`;
> offers share a variant price set, so `calculatePrices` with `offer_id: offerIds`
> returns the lowest per variant). We adopt the worker's shape: store a
> **`prices` map keyed by `region_id`** on the document, computed **at index time**
> across all store regions —
> - for a **product** doc: the buybox amount for that region (cheapest offer,
>   min across variants);
> - for an **offer** doc: that offer's own `calculated_price` for the region.
>
> The store route then selects `prices[region_id]` at read time (exactly the
> worker's `variant.prices[regionId]`) — **no per-request hydration for display**.
> Like the worker, **price is stored, not indexed**: it never enters
> `create({ schema })`, so the base provider does not filter or sort by price
> (see Notes). The region-keyed snapshot is recomputed per-change by the
> subscribers (offer / seller / product events) and rebuilt in full on boot —
> the tradeoff for skipping per-request hydration (see the staleness caveat in
> Notes).

```ts
// packages/types/src/search/index.ts
export interface SearchDoc {
  id: string
  type: "product" | "offer"
  title: string
  description?: string
  handle?: string
  thumbnail?: string
  seller_handle?: string       // offers only — master products carry no seller
  collection_id?: string
  collection?: string          // label
  category_ids?: string[]
  categories?: string[]        // labels
  product_id?: string          // offers
  variant_id?: string          // offers
  sku?: string                 // offers
  // Facetable + filterable. Composite tokens "attr:<attribute_handle>:<value_id>".
  // The ONLY attribute field that enters Orama create({ schema }) (as enum[]).
  // Only values whose attribute.is_filterable === true are tokenized.
  attribute_tokens?: string[]
  // STORED, not indexed — label-join source for grouped attribute facets.
  // Offers inherit their parent product's entries.
  attributes?: Array<{
    id: string                 // attribute id
    handle: string
    name: string               // attribute label
    type: string               // AttributeType
    values: Array<{ id: string; name: string }>  // selected values on this doc
  }>
  // STORED, not indexed (like the worker) — read at request time as prices[region_id].
  // buybox (product) / own price (offer), per region.
  prices?: Record<string, {    // region_id → price
    calculated_amount: number
    original_amount: number
    currency_code: string
  }>
}

// Only the UNIVERSAL query bits are shared. Both `context` and `filters` are left
// OPEN records — the shared contract freezes neither. `context` = WHO/WHAT the
// search is for (region/currency/customer): display/pricing context, not a
// narrowing predicate; the route reads `context.region_id` to project
// `prices[region_id]`, and a provider MAY use it to bias ranking. `filters` =
// narrowing predicates, which vary per backend (Orama `where` ≠ Algolia facets ≠
// Meili filter strings). Each provider narrows both via the generic below.
export interface SearchQueryBase {
  q?: string
  limit?: number
  offset?: number
  context?: Record<string, unknown>   // display/pricing context — not a filter
  // Provider-defined narrowing predicates. (No price_min/price_max here or
  // anywhere — price is stored, not indexed. See Notes.)
  filters?: Record<string, unknown>
}

export interface SearchResults {
  // Full stored docs in order. The provider projects each doc's
  // `calculated_price` from `prices[context.region_id]` before returning.
  hits: SearchDoc[]
  count: number
  // Provider-built, already labelled (the provider owns facet labelling +
  // price projection so the store route stays a thin search() call).
  facets?: {
    collections: SearchFacetValue[]                       // { id, label, count }
    categories: SearchFacetValue[]
    attributes: Array<{ handle: string; label: string; values: SearchFacetValue[] }>
  }
}

// Three verbs, mirroring IFileProvider's small surface. Generic over the query
// so each provider states exactly which filters it accepts (see OramaSearchQuery
// under the default provider). No status/health, no "re-init me" flag.
export interface SearchProvider<TQuery extends SearchQueryBase = SearchQueryBase> {
  index(docs: SearchDoc[]): Promise<void>
  remove(ids: string[]): Promise<void>
  search(query: TQuery): Promise<SearchResults>
}
```

**Filters belong to the provider, not the shared contract.** Different backends
support different filtering, so the rich filter shape (`collection_ids`,
`category_ids`, `attributes`, …) is **not** in `@mercurjs/types`. The shared
`SearchQueryBase.filters` is an open `Record`; the active provider declares a
concrete `filters` type by extending `SearchQueryBase` and implementing
`SearchProvider<ItsOwnQuery>`. The only cross-provider expectation is that a
marketplace search provider indexes offers only for open sellers at index time
(products are master — SPEC-015 — so they carry no seller). Everything else is
the provider's to define
and advertise (a provider may also export its zod validator so the store route
and storefront validate against exactly what it accepts — see the store route).

Two concerns that are NOT interface methods:

- **Boot reindex** (the in-memory Orama case) is the *provider's own* business,
  not something core polls a flag for. Medusa's `ModuleProvider(name, { services,
  loaders })` lets a provider ship its **own loaders**; `search-orama` ships a
  loader that rebuilds the index from Postgres on init. A persistent provider
  simply ships no such loader. Nothing about "needs a rebuild" leaks into the
  shared contract.
- **Provider identifier** for status isn't in the contract; the provider MAY
  expose extra methods for richer status, but the base `SearchProvider` stays at
  the three verbs.

**Facet building lives in the provider, not the route** (revised from the
original route-joins-labels design). The `search-orama` provider uses **plain
Orama** — native `where` filtering + native `facets` — and labels the raw facet
counts itself using id→label maps it maintains at index time (from each doc's
stored `collection` / `categories` / `attributes` fields). It also projects each
hit's `calculated_price` from `prices[context.region_id]`. So the store route is
a thin `search.search(query)` call that returns the provider's `hits` + `facets`
verbatim. Attribute facets are decoded from `attr:<handle>:<value_id>` tokens
into grouped `{ handle, label, values: [{ id, label, count }] }` inside the
provider. **Filter semantics are Orama-native** (`in` / `containsAny`): with
plain usage, facet-with-own-filter-removed and strict OR-within/AND-across-handle
attribute logic are simplified to Orama's `containsAny`; this is a deliberate
first-cut trade for plain provider code.

```ts
// abstract base (mirrors AbstractFileProviderService)
export class AbstractSearchProvider implements SearchProvider {
  static identifier: string
  static validateOptions(options: Record<string, unknown>): void | never {}
  getIdentifier() { return (this.constructor as typeof AbstractSearchProvider).identifier }
  async index(_: SearchDoc[]): Promise<void> { throw new Error("index must be overridden") }
  async remove(_: string[]): Promise<void> { throw new Error("remove must be overridden") }
  async search(_: SearchQueryBase): Promise<SearchResults> { throw new Error("search must be overridden") }
}
```

## The Search Module

`packages/core/src/modules/search/`

- `index.ts`: `Module(MercurModules.SEARCH, { service: SearchModuleService,
  loaders: [loadProviders] })`, and re-exports the public surface consumed
  elsewhere: `AbstractSearchProvider`, `SearchModuleService`, the registration
  constants, `reindexAll` / `indexProductPage` / `SEARCH_REINDEX_EVENT`
  (`lib/reindex`), and the single-entity sync helpers `reindexProductsById` /
  `removeProductAndOffers` / `removeOfferDocs` / `offersForSeller` (`lib/sync`).
- `services/search-provider-service.ts`: also declares the registration
  constants (`SearchProviderRegistrationPrefix = "search_"`,
  `SearchProviderIdentifierRegistrationName`). Resolves the single provider by
  scanning container keys for the prefix (asserts exactly one, like
  `FileProviderService`), forwards `index`/`remove`/`search`.
- `loaders/providers.ts`: `registrationFn` registering the provider under
  `SearchProviderRegistrationPrefix + <identifier>_<id>` via
  `asFunction((cradle) => new klass(cradle, options))`, calling the shared
  `moduleProviderLoader`; falls back to `search-orama` when no `provider` option
  is passed.
- `services/search-module-service.ts`: injects `searchProviderService`, the
  `logger`, and the **event bus**; delegates the three verbs. This is what
  subscribers and routes resolve (`container.resolve(MercurModules.SEARCH)`). It
  also carries the boot-reindex `onApplicationStart` hook — see "Boot reindex".
- `lib/sync.ts`: single-entity sync helpers (`reindexProductsById`,
  `removeProductAndOffers`, `removeOfferDocs`, `offersForSeller`) reused by the
  subscribers.

The module is registered in `withMercur()` (added automatically unless the app
already lists it) with `dependencies: [QUERY, REMOTE_QUERY]` so the module can
resolve those at init. The provider loader defaults to `search-orama` when no
`provider` option is passed — mirroring how Medusa apps default file to
`file-local`.

## The Default Provider — `search-orama`

Packaged like Medusa's `file-local`. Location:
`packages/core/src/modules/search/providers/orama/` (bundled with core; a
standalone `@mercurjs/search-orama` package can be extracted later).

- `index.ts`: `ModuleProvider(MercurModules.SEARCH, { services:
  [OramaSearchProvider] })`.
- `service.ts`: `class OramaSearchProvider extends AbstractSearchProvider
  implements SearchProvider<OramaSearchQuery> { static identifier = "search-orama"; … }`.
  The concrete filter shape lives in `providers/orama/types.ts` (NOT in
  `@mercurjs/types`):

  ```ts
  export interface OramaSearchQuery extends SearchQueryBase {
    filters?: {
      type?: "product" | "offer"
      collection_ids?: string[]
      category_ids?: string[]
      seller_handle?: string      // offers only
      // attribute_handle -> selected value ids, expanded to
      // attr:<handle>:<value_id> tokens vs attribute_tokens.
      attributes?: Record<string, string[]>
    }
  }
  ```
  - Constructor builds the Orama `create({ schema })` in memory. The schema
    includes `attribute_tokens: "enum[]"` (facetable + filterable); `attributes`
    and `prices` stay out of the schema (stored only).
  - `index()` → `removeMultiple` + `insertMultiple` (and records id→label maps);
    `remove()` → `removeMultiple`; `search()` → **plain Orama** `search()` with
    native `where` + `facets`. The provider then labels the raw facet counts from
    its id→label maps and projects each hit's `calculated_price` from
    `prices[context.region_id]`, returning fully-built `SearchResults` (the store
    route returns them verbatim — no route-side facet or price work).
- `@orama/orama` added as a dependency of `@mercurjs/core`.

A reference persistent provider (Algolia/Meili) is **out of scope** here — the
existing registry blocks can be refactored into this contract in a follow-up.

### Boot reindex — event-driven via `onApplicationStart`

A module service is constructed with the awilix **module** cradle, not the app
container, so it cannot run the cross-module reindex itself (the buybox needs
`query.graph`). So the boot reindex is **event-driven**:

- `SearchModuleService.__hooks.onApplicationStart` fires once after boot. In
  **worker mode only** (`moduleDeclaration.worker_mode !== "server"`) it emits
  `SEARCH_REINDEX_EVENT` (`"search.reindex"`) on the event bus — a no-op
  otherwise, and failures are logged, never thrown.
- The `search-reindex` subscriber receives it with the real request-scoped
  container and runs `reindexAll(container)`. Any code path (a seed script, an
  ops task) can trigger a full reindex the same way — emit `search.reindex`.
- There is a brief window after boot where the in-memory index is empty until the
  background reindex finishes; acceptable per the chosen tradeoff. A persistent
  provider can simply ignore the event (its store survives restarts).

- **`reindexAll(container)`** — the shared full-sync core, reused single-entity by
  the subscribers via `lib/sync`:
  1. `loadRegions` — `query.graph({ entity: "region", fields:
     ["id","currency_code","automatic_taxes","countries.iso_2"] })` once.
  2. Paginate products (page size 100), filtered to published (products are
     master; open-seller filtering applies to offers).
  3. Per page, `indexProductPage` builds docs via `buildProductDocs` /
     `buildOfferDocs` and calls `search.index(docs)`.
- **Per-region buybox WITHOUT an HTTP request.** `wrapProductVariantsWithOfferPrice`
  and `wrapOffersWithCalculatedPrices` read only `req.pricingContext` +
  `req.scope` (plus optional `req.taxContext`) — no Express internals. So the doc
  builders construct a **faked request** per region:

  ```ts
  const fakeReq = {
    scope: container,
    pricingContext: { region_id: region.id, currency_code: region.currency_code },
    taxContext: buildRegionTaxContext(container, region), // region-level, see Notes
  }
  await wrapProductVariantsWithOfferPrice(fakeReq, products) // mutates variant.calculated_price + offer_id
  ```

  Take the **cheapest variant's** tax-inclusive `calculated_price` →
  `productDoc.prices[region_id]`; each offer's `calculated_price` →
  `offerDoc.prices[region_id]`. Prices are **tax-inclusive at region level** (see
  the tax caveat in Notes).

## Index Sync — the shared builder core (provider-agnostic)

The index is populated by `reindexAll(container)` (full) and by the single-entity
`lib/sync` helpers (per event) — all sharing the **same `buildProductDocs` /
`buildOfferDocs` core** under `packages/core/src/modules/search/lib/`. Those
builders resolve all store regions once and, per region, run the existing helpers
via the faked-`req` (`{ scope, pricingContext, taxContext }`):

- **Product buybox per region:** `wrapProductVariantsWithOfferPrice` (from
  `packages/core/src/api/utils/offers.ts`) → take the cheapest variant's
  tax-inclusive `calculated_price` → `prices[region_id]`.
- **Offer price per region:** `wrapOffersWithCalculatedPrices` (from
  `packages/core/src/api/store/offers/helpers.ts`) → `prices[region_id]`.

So the stored numbers match `/store/products` and `/store/offers` at region
granularity. Prices live only in the stored `prices` map — nothing price-related
enters the Orama searchable schema.

Doc builders live in `packages/core/src/modules/search/lib/build-docs.ts`
(`buildProductDocs`, `buildOfferDocs`, `searchProductFields`, `searchOfferFields`)
— each builds the region-keyed `prices` map. Published master products are
indexed regardless of seller; offers are indexed only for open sellers.

Building `attribute_tokens` + `attributes` (index time): `buildProductDocs`
extends its product `query.graph` with the selected-value relation path
(`product_attribute_values.id`, `.name`, `.attribute.{id,handle,name,type,is_filterable}`
— the path proven in `packages/core/src/api/vendor/products/query-config.ts`;
use a curated field list, never `+`-prefixed fields on a default product list —
see `vendor-products-default-fields-500`). Keep only values whose
`attribute.is_filterable === true`, emit `attr:<handle>:<value_id>` tokens, and
group selected values into the stored `attributes` label array. `buildOfferDocs`
reuses the parent product's computed tokens/labels so offers inherit them.

## Subscribers (`packages/core/src/subscribers/search-*.ts`)

The index is kept live by event subscribers. Each resolves the search module
via the app container and calls the single-entity `lib/sync` helpers; none knows
which provider is active. All log-and-rethrow on failure.

- `search-product-changed.ts` — `ProductWorkflowEvents.PUBLISHED` / `REJECTED`
  + `product.updated` / `product.product.updated` → `reindexProductsById([id])`.
  `reindexProductsById` re-fetches the product filtered to `status: "published"`;
  a now-unpublished id is treated as stale and removed (product + its offers).
- `search-product-deleted.ts` — `product.deleted` / `product.product.deleted` →
  `removeProductAndOffers([id])` (removes the product doc and its offer docs).
- `search-offer-changed.ts` — `OfferWorkflowEvents.CREATED/UPDATED/DELETED`. On
  DELETED, `removeOfferDocs([id])`; then, whenever the event carries a
  `product_id`, `reindexProductsById([product_id])` so the product's buybox and
  its remaining offer docs are rebuilt. (The offer create/update/delete workflows
  were updated to emit `{ id, product_id }`.)
- `search-seller-changed.ts` — seller lifecycle events
  (`APPROVED`/`UNSUSPENDED`/`UPDATED`/`SUSPENDED`/`TERMINATED`/`UNTERMINATED`/`DELETED`).
  Resolves the seller's offers via `offersForSeller`; on a deactivating event
  (suspend/terminate/unterminate/delete) it `removeOfferDocs(offerIds)`, then
  always `reindexProductsById(productIds)` to refresh those products' buyboxes
  (and re-add offers when a seller becomes open again).
- `search-reindex.ts` — `SEARCH_REINDEX_EVENT` (`"search.reindex"`) →
  `reindexAll(container)`. This is the boot-reindex handler (see "Boot reindex")
  and the single programmatic full-reindex entry point.

## Endpoint Contracts

- `POST /store/search`
  - Body (Medusa-like list params): `{ q?: string, limit?=12 (max 100),
    offset?=0, region_id?, country_code?, province?, filters?: Record<string,
    unknown> }`. `region_id`/`country_code`/`province` are the **inputs** for the
    pricing/tax context — the authoritative context is built in middleware (see
    below), not trusted from the raw body. **`filters` is an open passthrough
    record** — the provider owns its filter shape and interprets the record;
    the route does not validate filter contents (for `search-orama`: `type`,
    `collection_ids`, `category_ids`, `seller_handle`, `attributes`).
  - Behavior: the route is **thin** — `search.search(query)` and return the
    provider's `hits` + `facets` verbatim. The **provider** projects each hit's
    `calculated_price` from `prices[context.region_id]` (null when the region has
    no stored entry) and builds the labelled facets. Suspended/unpublished content
    is excluded **at index time** (`reindexAll` only indexes published,
    open-seller docs) — there is no query-time seller-status force. No
    `query.graph` hydration; hit order is preserved by the provider.
  - Response: `{ hits, count, limit, offset,
    facets: { collections: SearchFacetValue[], categories: SearchFacetValue[],
    attributes: Array<{ handle, label, values: SearchFacetValue[] }> } }`.
  - Middleware: `authenticate("customer", …, { allowUnauthenticated: true })`,
    `validateAndTransformBody(StoreSearchSchema)`, then `setSearchPricingContext`
    — a POST-friendly context builder **inspired by the `/store/products`
    `setPricingContext` + `setTaxContext` chain**: it refetches the region (never
    trusts the body), pulls customer groups from the auth context, and derives the
    tax context from the region's `automatic_taxes` + supplied address. Optional:
    with no `region_id` the search runs context-free and hits carry
    `calculated_price: null`.
- **Full-reindex trigger** → emit `SEARCH_REINDEX_EVENT` (`"search.reindex"`);
  the `search-reindex` subscriber runs `reindexAll(container)`. Fired
  automatically on boot (worker mode) and emittable programmatically (seed script,
  ops task). No admin HTTP route ships in this cut.

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
- Suspended/unpublished content never appears — excluded at index time by
  `reindexAll` (published + open-seller only).
- Offer hits price identically to the product page / `GET /store/offers`.
- New published products and new/updated offers appear within one event cycle
  (subscribers); deleted/unpublished content and a suspended seller's offers
  disappear the same way. A full rebuild runs on boot (worker mode).
- Swapping the provider (e.g. to Algolia) changes nothing user-visible except
  latency/scale characteristics — no storefront or API changes.

## Implementation Plan

1. Provider contract in `@mercurjs/types` (`SearchProvider`, DTOs) +
   `AbstractSearchProvider` re-exported from `@mercurjs/core`.
2. Search module (`index.ts`, `loaders/providers.ts`,
   `services/search-provider-service.ts`, `services/search-module-service.ts`)
   — copy the `file` module structure; register in `withMercur()` with
   `[QUERY, REMOTE_QUERY]` deps.
3. Default `search-orama` provider (plain-Orama service, provider-owned facets +
   price projection) + `@orama/orama` dependency; default-provider fallback in the
   loader.
4. Shared `reindexAll(container)` + `buildProductDocs`/`buildOfferDocs` (faked-`req`
   per-region buybox, tax-inclusive; incl. `is_filterable` attribute tokenization,
   offers inherit product tokens) + single-entity `lib/sync` helpers.
5. Thin store `/store/search` route (Medusa-like `q`/`limit`/`offset`, open
   `filters` passthrough, return the provider's `hits` + `facets` verbatim) +
   `setSearchPricingContext` middleware (builds the pricing/tax context,
   `/store/products`-inspired).
6. Boot reindex via `onApplicationStart` → `SEARCH_REINDEX_EVENT` →
   `search-reindex` subscriber; per-event subscribers
   (`search-product-changed`/`-deleted`, `search-offer-changed`,
   `search-seller-changed`); offer workflows emit `{ id, product_id }`.
7. Storefront data fn + `NEXT_PUBLIC_SEARCH_PROVIDER` branch + offer-hit rendering.
8. Integration tests under `integration-tests/http/search/store/`.

## Verification

1. `bun run lint` clean on touched files; `tsc --noEmit` on `@mercurjs/core`
   and `@mercurjs/types` exits 0; route map regenerated under
   `packages/core/.mercur/_generated/` with `store.search`.
2. Integration tests (mirror offer / product-attribute suites), all against the
   default `search-orama` provider. `store/search.spec.ts` drives state through an
   explicit `reindexAll`; `store/search-sync.spec.ts` drives the single-entity
   `lib/sync` helpers (`reindexProductsById`, `removeProductAndOffers`,
   `removeOfferDocs`, `offersForSeller`) the subscribers call:
   - published product searchable after `reindexAll`;
   - a region's `prices` entry is tax-inclusive when the region has automatic
     taxes, pre-tax when it doesn't;
   - an offer yields a `type:"offer"` hit with a `prices` entry per region;
   - an updated offer price is reflected in its own doc AND its product's buybox
     in the affected region's `prices` entry after reindex;
   - a deleted offer / unpublished product is absent after reindex;
   - a suspended seller's offers are absent after reindex (the master product
     remains); unsuspending restores the offers;
   - suspended/unpublished content excluded after reindex (index-time);
   - projected `prices[region_id]` equals `GET /store/offers` (offers) and
     `/store/products` buybox (products) for that region;
   - a product with an `is_filterable` attribute value exposes an `attributes`
     facet; a non-filterable attribute does not;
   - `filters.attributes: { <handle>: [value_id] }` narrows results to matching
     products AND their offers; two ids under one handle widen (OR), values
     under two handles intersect (AND);
   - toggling an attribute's `is_filterable` off + reindex drops its facet.
3. Provider-swap test: register a trivial in-test fake provider via module
   options and assert `reindexAll` + `/store/search` call it — proving the
   pipeline is provider-agnostic and the module resolves the configured provider.
4. Manual: `MEDUSA_WORKER_MODE=shared`, storefront flag on — restart the API and
   confirm it boots immediately, then within a moment `POST /store/search` returns
   results (background boot reindex via `search.reindex` finished); create /
   suspend in the vendor panel and confirm search reflects it within one event
   cycle.

## Evidence

Session 2026-07-02 (branch `feat/search-module`, off `canary`). Backend +
event-driven sync implemented; storefront branch (plan item 7) still outstanding.

**Landed:**

- Provider contract in `@mercurjs/types` (`packages/types/src/search/common.ts`):
  `SearchDoc`, `SearchDocAttribute`, `SearchDocPrice`, `SearchQueryBase`,
  `SearchResults`, `SearchProvider<TQuery>`, `SearchModuleOptions`. `MercurModules.SEARCH`
  added; re-exported from the types barrel. `AbstractSearchProvider` re-exported
  from `@mercurjs/core` via the search module index.
- Search module (`packages/core/src/modules/search/`): `index.ts`
  (`Module(MercurModules.SEARCH, …)`), `services/search-provider-service.ts`
  (prefix `search_`, asserts exactly one provider), `services/search-module-service.ts`
  (delegates the three verbs), `loaders/providers.ts` (payout-style fallback to
  `search-orama` when no `provider` configured).
- Default `search-orama` provider (`providers/orama/`): in-memory `@orama/orama`
  3.1.18 index; `service.ts` uses **plain Orama** — native `where` (type / seller
  / `collection_id` `in` / `category_ids` + `attribute_tokens` `containsAny`) and
  native `facets` — and **owns facet labelling** (id→label maps maintained at
  index time) **and `calculated_price` projection** from `prices[context.region_id]`,
  so the store route is thin. `types.ts` holds `OramaSearchQuery` (the concrete
  filter shape it interprets from the open passthrough record); `index.ts`
  (`ModuleProvider`). `@orama/orama` added to core deps.
- Shared index-sync core (`modules/search/lib/`): `build-docs.ts`
  (`buildProductDocs`/`buildOfferDocs`, faked-`req` per-region buybox via
  `wrapProductVariantsWithOfferPrice` / `wrapOffersWithCalculatedPrices` + tax,
  `is_filterable` attribute tokenization, offers inherit parent tokens),
  `reindex.ts` (`reindexAll` + `indexProductPage` + `loadRegions` +
  `SEARCH_REINDEX_EVENT`, page size 100, published master products + open-seller
  offers) and `sync.ts` (single-entity `reindexProductsById` /
  `removeProductAndOffers` / `removeOfferDocs` / `offersForSeller`;
  `reindexProductsById` removes now-unpublished products). All re-exported from
  `@mercurjs/core/modules/search`.
- **Event-driven sync** — `SearchModuleService.__hooks.onApplicationStart` emits
  `search.reindex` in worker mode (it holds the module cradle + event bus, not the
  app container); subscribers under `packages/core/src/subscribers/search-*.ts`:
  `search-reindex` (→ `reindexAll`), `search-product-changed`/`-deleted`,
  `search-offer-changed`, `search-seller-changed`. The offer create/update/delete
  workflows were updated to emit `{ id, product_id }` so the offer subscriber can
  rebuild the parent product. Search module registered in `withMercur()` with
  `[QUERY, REMOTE_QUERY]` deps.
- Thin store `POST /store/search` (`api/store/search/`): Medusa-like body
  (`q`/`limit`/`offset` + `region_id`/`country_code`/`province`), open `filters`
  passthrough record (provider owns the shape), calls `search.search`, returns
  the provider's `hits` + `facets` verbatim. `setSearchPricingContext` middleware
  builds the pricing/tax context (`/store/products`-inspired: refetches the
  region, customer groups from auth, tax from `automatic_taxes` + address);
  `authenticate("customer", …, { allowUnauthenticated: true })` +
  `validateAndTransformBody`. Registered in `store/middlewares.ts`. Suspended /
  unpublished content is excluded at index time, not query-time.
- **No search workflows and no admin HTTP routes** in this cut. Full reindex is
  triggered by emitting `search.reindex` (fired on boot in worker mode).
- Integration tests `integration-tests/http/search/store/search.spec.ts`
  (reindex → product + offer priced per region; drafts excluded; suspend drops the
  offer, keeps the master product) and `search-sync.spec.ts` (the single-entity
  `lib/sync` helpers). Not run in-worktree (see `worktree-integration-test-env`);
  rely on CI.

**Verification run:**

- `packages/types` build: clean.
- `packages/core` `tsc --noEmit`: **0 errors**. Full `bun run build` (codegen +
  `tsc --declaration`): passes.
- Route map regenerated: `.mercur/routes.d.ts` carries `store.search` only (no
  `admin.search`).
- Integration typecheck of the new spec: clean. Lint: only the repo-standard
  `no-underscore-dangle` / `no-await-in-loop` warnings, no errors.

**Deviation from the plan — boot reindex is event-driven, not a provider loader.**
The plan called for the `search-orama` provider to ship its own boot-reindex
loader. Two findings ruled that out: (1) `moduleProviderLoader` registers only
provider *services*, not provider `loaders`; and (2) a module service is
constructed with the **module** cradle, not the app container, so it cannot run
the cross-module `query.graph` the buybox needs. The resolution: the module's
`onApplicationStart` hook (worker mode) **emits `search.reindex`**, and the
`search-reindex` subscriber runs `reindexAll` with the real request-scoped
container. This keeps the constraint inside the module, needs no admin route, and
gives any caller a one-line full-reindex trigger. The `SearchProvider` contract
stays at three verbs.

## Notes

- **In-memory caveat is now provider-local.** The single-process /
  `MEDUSA_WORKER_MODE=shared` / rebuild-on-boot constraints apply **only** to the
  default `search-orama` provider, because its index lives in the API process's
  RAM (writers and the reader must be the same process; every replica has its own
  copy; restart is empty → boot reindex). A persistent provider (Algolia, Meili,
  or an Orama build using `@orama/plugin-data-persistence` to Redis) drops all of
  these constraints. The seam is the boot `search.reindex` event: the in-memory
  provider needs it to repopulate on restart; a persistent provider can ignore
  it. No flag, no core polling.
- **Single active provider is a hard design constraint (file pattern), not
  multi (notification pattern):** the marketplace runs exactly one search
  backend at a time. `search-provider-service.ts` asserts exactly one registered
  provider and throws otherwise, and the module options expose a singular
  `provider` (never a `providers[]` array). The `notification`
  one-provider-per-channel machinery (a DB table + channel routing) is
  deliberately excluded.
- **Filters are provider-owned, not part of the shared contract.** Only
  `SearchQueryBase` (`q`/`limit`/`offset`/open `filters`) lives in
  `@mercurjs/types`; each provider declares its concrete `filters` shape and
  implements `SearchProvider<ItsQuery>`. The store route passes `filters` through
  as an **open `Record<string, unknown>`** — it validates nothing beyond
  structure, so the active provider owns interpretation (swapping providers can
  add or drop filters). There is no query-time seller-status filter: products are
  master (SPEC-015) and carry no seller, and providers index offers only for open
  sellers at index time.
- **Migrating the existing registry blocks:** the Algolia/Meilisearch blocks in
  `packages/registry` can later be refactored to implement `SearchProvider` and
  register through this module, unifying three code paths into one contract.
- **Price is stored, not indexed** (matching the worker): the region-keyed
  `prices` map rides along in the stored document and is read at request time
  (`prices[region_id]`). Orama's `create({ schema })` indexes only the searchable
  /filterable/facetable keys (title, handle, description, collection(_id),
  category(_ids), seller_*, sku) — price is never in that schema. Consequence:
  the base provider does **not** filter or sort by price. If that's needed later,
  add a numeric field per region to the Orama schema (e.g. `price_<region>`); it
  is deliberately out of scope for the first cut.
- **Staleness + tax tradeoff** (from SPEC-007): the per-region `prices` are a
  snapshot recomputed by subscribers on offer/price changes and rebuilt on boot.
  They are **tax-inclusive at region level** — the boot/reindex builder feeds the
  helpers a `taxContext` derived from the region's default tax setup
  (`buildRegionTaxContext`, mirroring Medusa's `setTaxContext` middleware). If a
  region has `automatic_taxes` off, the tax wrapper no-ops and that region's
  entry stays pre-tax — same as the store API. Province- or customer-group-level
  tax variance is **not** captured; the buyer sees the region price and the
  authoritative per-context price is resolved at cart/checkout as today.
- **Do not** override product default `fields` with `+field` on vendor product
  lists (`vendor-products-default-fields-500` memory); reindex queries must use
  curated field lists.
- **Attributes reuse the existing `is_filterable` flag** on the
  `product-attribute` module (admin-settable in
  `packages/admin/src/pages/attributes` today) — no new flag, no migration, no
  admin change. Dynamic handles are kept out of the static Orama schema by
  encoding them as `attr:<handle>:<value_id>` tokens in a single facetable
  `enum[]` field; the human labels live in the stored (non-indexed) `attributes`
  map, joined at read time exactly like collection/category labels. Facet counts
  reflect only values present in matching docs (standard facet-distribution
  behavior), not the attribute's full catalog value set.
