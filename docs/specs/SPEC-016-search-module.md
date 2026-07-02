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

- **Index sync** (`reindexAll`, invoked programmatically) calls
  `search.index(docs)` / `search.remove(ids)`. (Event subscribers doing the same
  per-change are a deferred follow-up — see "Deferred — event subscribers".)
- **The store route** calls `search.search(query)` (returns hit docs + facets)
  then projects each doc's `prices[context.region_id]` for display — identical for
  every provider, no `query.graph` hydration.
- **Boot reindex** is the provider's own concern: the `search-orama` provider
  ships a Medusa provider *loader* that rebuilds the index from Postgres on init.
  Persistent providers ship no such loader. Core doesn't poll a flag for it.

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
> (see Notes). Recompute happens on the next full reindex (boot loader / admin
> `syncSearchWorkflow`); the region-keyed snapshot is the tradeoff for skipping
> hydration (see the staleness caveat in Notes). (Per-change recompute via event
> subscribers is deferred — see "Deferred — event subscribers".)

```ts
// packages/types/src/search/index.ts
export interface SearchDoc {
  id: string
  type: "product" | "offer"
  title: string
  description?: string
  handle?: string
  thumbnail?: string
  seller_handle?: string
  seller_status?: string       // route forces "open"
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
marketplace search provider honours `filters.seller_status` (the route forces it
to `"open"` — a security invariant, see the store route), since `seller_status`
is a documented `SearchDoc` field. Everything else is the provider's to define
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
  `FileProviderService`), forward `index`/`remove`/`search`.
- `services/search-module-service.ts`: inject `searchProviderService`, delegate
  the three verbs. This is what subscribers and routes resolve
  (`container.resolve(MercurModules.SEARCH)`).

(No `bootstrap.ts` in the module — boot reindex belongs to whichever provider
needs it, shipped as that provider's own loader. See `search-orama` below.)

Register the module in `withMercur()` with a **default provider fallback**: if
the consuming app passes no `search.provider`, default to `search-orama` (mirror
how Medusa apps default file to `file-local`).

## The Default Provider — `search-orama`

Packaged like Medusa's `file-local`. Location:
`packages/core/src/modules/search/providers/orama/` (bundled with core; a
standalone `@mercurjs/search-orama` package can be extracted later).

- `index.ts`: `ModuleProvider(MercurModules.SEARCH, { services:
  [OramaSearchProvider], loaders: [oramaBootReindex] })` — note the **provider
  loader** carrying the in-memory-specific boot rebuild.
- `service.ts`: `class OramaSearchProvider extends AbstractSearchProvider
  implements SearchProvider<OramaSearchQuery> { static identifier = "search-orama"; … }`.
  This is where the concrete filter shape lives (NOT in `@mercurjs/types`):

  ```ts
  // packages/core/src/modules/search/providers/orama/types.ts
  export interface OramaSearchQuery extends SearchQueryBase {
    filters?: {
      type?: "product" | "offer"
      collection_ids?: string[]   // OR within, AND across
      category_ids?: string[]
      seller_handle?: string
      seller_status?: string      // route forces "open"
      // attribute_handle -> selected value ids. OR within a handle, AND across
      // handles. Expanded to attr:<handle>:<value_id> tokens vs attribute_tokens.
      attributes?: Record<string, string[]>
    }
  }
  // exported alongside a zod validator the store route imports (see store route)
  ```
  - Constructor `(container, options)` builds the Orama schema lazily. The
    schema includes `attribute_tokens: "enum[]"` (facetable + filterable);
    `attributes` and `prices` stay out of the schema (stored only).
  - `index()` → `removeMultiple` + `insertMultiple`; `remove()` →
    `removeMultiple`; `search()` → Orama `search()` → `{ hits, count, facets }`.
    When `filters.attributes` is present, expand each `{ handle: [ids] }` into
    `attr:<handle>:<id>` token sets and apply OR-within-handle / AND-across-handle;
    recompute the attribute facet with the attribute filters removed (same rule
    as collections/categories). Facet on `attribute_tokens` and return the raw
    token→count map for the route to group.
- `loaders/boot-reindex.ts`: the provider's own loader (see below).
- `@orama/orama` added as a dependency of `@mercurjs/core`.

A reference persistent provider (Algolia/Meili) is **out of scope** here — the
existing registry blocks can be refactored into this contract in a follow-up.

### Boot reindex — async, non-blocking (the first sync on startup)

The reference implementation the storefront team supplied is an offline script
that, per region, fetches products with `calculated_price` and builds a
`variant → region → price` map. In-process we produce the same shape using
Medusa patterns and **reuse the existing buybox helpers** — no cheapest-offer
math is reimplemented. The closest in-tree precedent for a provider loader with a
bundled-default fallback is Mercur's own **payout module**
(`packages/core/src/modules/payout/loaders/provider.ts` +
`services/provider-service.ts`) — it already defaults to a bundled provider
(`SystemPayoutProvider`) when options carry none. Mirror it for `search-orama`.

- **Loader signature & lifecycle.** Medusa runs provider `loaders` once at module
  init (`runLoaders` in `@medusajs/framework/modules-sdk`); the loader receives
  `{ container, logger, options }` (`ProviderLoaderOptions`).
- **Non-blocking.** The loader does **not** await the full reindex — it kicks it
  off in the background so the API accepts traffic immediately:
  `void reindexAll(container).catch((e) => logger.error(…))`. There is a brief
  window after boot where the in-memory index is empty; acceptable per the chosen
  tradeoff. (Blocking-until-synced was considered and rejected: slow boot on
  large catalogs.)
- **`reindexAll(container)`** — the shared sync core, also called by the admin
  reindex workflow and reused (single-entity) by the subscribers:
  1. `query.graph({ entity: "region", fields: ["id", "currency_code"] })` once.
  2. Paginate product ids (page size 100, like the Meili sync step), filtered to
     published + open seller.
  3. Per page, build docs via `buildProductDocs` / `buildOfferDocs` and call
     `search.index(docs)` (`container.resolve(MercurModules.SEARCH)`).
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

The index is populated by `reindexAll(container)` (see "Boot reindex" above),
called from two places in this first cut: the `search-orama` boot loader
(async/non-blocking at init) and the `syncSearchWorkflow` full reindex.
Both go through the **same `buildProductDocs` / `buildOfferDocs` core** — one
implementation, two callers. Those builders resolve all store regions once and,
per region, run the existing helpers via the faked-`req` (`{ scope,
pricingContext, taxContext }`):

- **Product buybox per region:** `wrapProductVariantsWithOfferPrice` (from
  `packages/core/src/api/utils/offers.ts`) → take the cheapest variant's
  tax-inclusive `calculated_price` → `prices[region_id]`.
- **Offer price per region:** `wrapOffersWithCalculatedPrices` (from
  `packages/core/src/api/store/offers/helpers.ts`) → `prices[region_id]`.

So the stored numbers match `/store/products` and `/store/offers` at region
granularity. Prices live only in the stored `prices` map — nothing price-related
enters the Orama searchable schema.

Transform helpers live in `packages/core/src/subscribers/utils/search-*.ts`
(`filterProductsByStatus`, `buildProductDocs`, `buildOfferDocs`) — each builds
the region-keyed `prices` map. Only published + open-seller content is indexed
(`filterProductsByStatus`).

Building `attribute_tokens` + `attributes` (index time): `buildProductDocs`
extends its product `query.graph` with the selected-value relation path
(`product_attribute_values.id`, `.name`, `.attribute.{id,handle,name,type,is_filterable}`
— the path proven in `packages/core/src/api/vendor/products/query-config.ts`;
use a curated field list, never `+`-prefixed fields on a default product list —
see `vendor-products-default-fields-500`). Keep only values whose
`attribute.is_filterable === true`, emit `attr:<handle>:<value_id>` tokens, and
group selected values into the stored `attributes` label array. `buildOfferDocs`
reuses the parent product's computed tokens/labels so offers inherit them.

## Deferred — event subscribers

Live, per-event reindexing is **out of scope for this first cut**. The index
stays fresh via the `syncSearchWorkflow` full reindex (invoked programmatically);
new/changed content becomes searchable after the next full reindex, not within
one event cycle. The following subscribers are a planned follow-up (they
reuse the same `buildProductDocs` / `buildOfferDocs` core, adding single-entity
and per-seller callers alongside `reindexAll`):

- `search-product-events-bridge.ts` — the 6 Medusa product events
  (`product.created/updated/deleted` + `product.product.*`) → transform →
  `search.index(...)` / `search.remove(...)`.
- `search-offer-events.ts` — `OfferWorkflowEvents.CREATED/UPDATED/DELETED`;
  reindexes both the offer doc and its parent product's buybox.
- `search-seller-suspended.ts` / `search-seller-unsuspended.ts` — reindex the
  seller's products + offers so suspended sellers drop out.
- `search-attribute-events.ts` — reindex on attribute-value pivot link changes
  and `is_filterable` toggles.

## Endpoint Contracts

- `POST /store/search`
  - Body (base): `{ query: string, page?=1, hitsPerPage?=12 (max 100),
    context?: { region_id?, country_code?, province? }, filters?: {…} }`.
    `context` holds the **inputs** for the pricing/tax context — the authoritative
    context is built in middleware (see below), not trusted from the raw body.
    **`filters` shape is defined by the active provider, not the route** — the
    route imports the provider's exported zod validator (for `search-orama`:
    `type`, `collection_ids`, `category_ids`, `seller_handle`, `attributes`).
    Because exactly one provider is active, there's exactly one validator to
    import. Unknown filter keys are a validation error. `attributes` keys/values
    are validated against `^[a-zA-Z0-9_-]+$` (the Meili-block injection-safety
    pattern).
  - Behavior: the route is **thin** — force `filters.seller_status = "open"`
    (security invariant), then `search.search(query)` and return the provider's
    `hits` + `facets` verbatim. The **provider** projects each hit's
    `calculated_price` from `prices[context.region_id]` (null when the region has
    no stored entry) and builds the labelled facets. No `query.graph` hydration;
    hit order is preserved by the provider.
  - Response: `{ hits, count, page, hitsPerPage, query,
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
- **Reindex trigger** → `syncSearchWorkflow`, whose step calls the shared
  `reindexAll(container)` (full reindex from Postgres via `search.index`). This
  first cut ships **no admin HTTP routes** for search — the workflow is invoked
  programmatically (e.g. `medusaExec`, a seed script, or the future boot /
  subscriber triggers). Admin management endpoints (provider identifier, reindex
  button) are deferred.

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
- New published products and new/updated offers appear after the next
  `syncSearchWorkflow` reindex; deleted/unpublished content disappears on the
  same. (Per-event freshness is a deferred follow-up.)
- Swapping the provider (e.g. to Algolia) changes nothing user-visible except
  latency/scale characteristics — no storefront or API changes.

## Implementation Plan

_Incremental scope for this first cut: build the module, provider, index-sync
core, and read paths. **Event subscribers are deferred** — the index is kept
fresh by the `syncSearchWorkflow` reindex (invoked programmatically) for
now. Live per-event reindexing (product/offer/seller/attribute subscribers) is a
follow-up (see "Deferred — event subscribers")._

1. Provider contract in `@mercurjs/types` (`SearchProvider`, DTOs) +
   `AbstractSearchProvider` re-exported from `@mercurjs/core`.
2. Search module (`index.ts`, `types.ts`, `loaders/providers.ts`,
   `services/search-provider-service.ts`, `services/search-module-service.ts`)
   — copy the `file` module structure.
3. Default `search-orama` provider (service + its own `boot-reindex` loader) +
   `@orama/orama` dependency; wire the default-provider fallback into `withMercur()`.
4. Shared `reindexAll(container)` + `buildProductDocs`/`buildOfferDocs` (faked-`req`
   per-region buybox, tax-inclusive; incl. `is_filterable` attribute tokenization,
   offers inherit product tokens). `reindexAll` calls `search.index` directly and
   is exported from `@mercurjs/core/modules/search`; it is invoked programmatically
   (no workflow wrapper, no admin HTTP route in this cut).
5. Thin store `/store/search` route (enforce `seller_status="open"`, return the
   provider's `hits` + `facets` verbatim) + `setSearchPricingContext` middleware
   (builds the pricing/tax context, `/store/products`-inspired) + validators
   (incl. `filters.attributes`). The provider owns `calculated_price` projection
   and labelled facet building.
6. Storefront data fn + `NEXT_PUBLIC_SEARCH_PROVIDER` branch + offer-hit rendering.
7. Integration tests under `integration-tests/http/search/store/`.

## Verification

1. `bun run lint` clean on touched files; `tsc --noEmit` on `@mercurjs/core`
   and `@mercurjs/types` exits 0; route map regenerated under
   `packages/core/.mercur/_generated/` with `store.search`.
2. Integration tests (mirror offer / product-attribute suites), all against the
   default `search-orama` provider:
   All state changes below are asserted **after an explicit `reindexAll`** (call
   it directly — the boot loader fires async, so tests must not race it; live
   per-event reindexing is deferred):
   - published product searchable after `reindexAll`;
   - a region's `prices` entry is tax-inclusive when the region has automatic
     taxes, pre-tax when it doesn't;
   - an offer yields a `type:"offer"` hit with a `prices` entry per region;
   - an updated offer price is reflected in its own doc AND its product's buybox
     in the affected region's `prices` entry after reindex;
   - a deleted offer / unpublished product is absent after reindex;
   - a suspended seller's content is absent after reindex; unsuspended restores it;
   - `seller_status="open"` enforced even with no client filter;
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
4. Manual: `MEDUSA_WORKER_MODE=shared`, storefront flag on — run `reindexAll`
   (e.g. via `medusaExec` / a seed script), then `POST /store/search` returns
   results; create an offer in the vendor panel, run `reindexAll` again, and
   confirm the new offer appears.

## Evidence

Session 2026-07-02 (branch `feat/search-module`, off `canary`). Backend vertical
implemented; storefront branch (plan item 6) still outstanding.

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
  so the store route is thin. `types.ts` (`OramaSearchQuery`), `validators.ts`
  (exported zod `OramaSearchFiltersSchema` the store route imports), `index.ts`
  (`ModuleProvider`). `@orama/orama` added to core deps.
- Shared index-sync core (`modules/search/lib/`): `build-docs.ts`
  (`buildProductDocs`/`buildOfferDocs`/`filterOpenSellerProducts`, faked-`req`
  per-region buybox via `wrapProductVariantsWithOfferPrice` /
  `wrapOffersWithCalculatedPrices` + tax, `is_filterable` attribute tokenization,
  offers inherit parent tokens) and `reindex.ts` (`reindexAll` + `indexProductPage`,
  page size 100, published + open-seller only, calls `search.index` directly).
  `reindexAll` re-exported from `@mercurjs/core/modules/search`.
- Thin store `POST /store/search` (`api/store/search/`): forces
  `seller_status="open"`, calls `search.search`, returns the provider's `hits` +
  `facets` verbatim. `setSearchPricingContext` middleware builds the pricing/tax
  context (`/store/products`-inspired: refetches the region, customer groups from
  auth, tax from `automatic_taxes` + address); `authenticate("customer", …,
  { allowUnauthenticated: true })` + `validateAndTransformBody`. Registered in
  `store/middlewares.ts`.
- **No search workflows and no admin HTTP routes** in this cut (both removed at
  the user's direction). Reindex = call `reindexAll(container)` directly
  (programmatic / seed / future boot + subscriber triggers).
- Integration test `integration-tests/http/search/store/search.spec.ts` (product +
  offer hit priced per region after `reindexAll`; drafts excluded;
  `seller_status=open` enforced on suspend). Not run in-worktree (see
  `worktree-integration-test-env`); relies on CI.

**Verification run:**

- `packages/types` build: clean.
- `packages/core` `tsc --noEmit`: **0 errors**. Full `bun run build` (codegen +
  `tsc --declaration`): passes.
- Route map regenerated: `.mercur/routes.d.ts` carries `store.search` only (no
  `admin.search`).
- Integration typecheck of the new spec: clean. Lint: only the repo-standard
  `no-underscore-dangle` / `no-await-in-loop` warnings, no errors.

**Deviation from the plan — boot reindex trigger.** The plan called for the
`search-orama` provider to ship its own boot-reindex loader. Two findings forced
a change: (1) `moduleProviderLoader` registers only provider *services*, not
provider `loaders`, and the payout-style fallback path bypasses it entirely; and
(2) a module service's constructor/`__hooks` receives the **module** container
(`__pg_connection__`, `logger`) — not the app container — so it cannot run the
cross-module `query.graph` the buybox needs (custom-fields confirms this by
opening its own ORM connection at load). So `reindexAll(container)` requires the
app container and is invoked programmatically (exported from
`@mercurjs/core/modules/search`; no workflow wrapper and no admin HTTP route in
this cut). **Automatic boot-time population is deferred** alongside the event
subscribers (both need the app-container/event machinery). The `SearchProvider`
contract stays at three verbs.

## Notes

- **In-memory caveat is now provider-local.** The single-process /
  `MEDUSA_WORKER_MODE=shared` / rebuild-on-boot constraints apply **only** to the
  default `search-orama` provider, because its index lives in the API process's
  RAM (writers and the reader must be the same process; every replica has its own
  copy; restart is empty → boot reindex). A persistent provider (Algolia, Meili,
  or an Orama build using `@orama/plugin-data-persistence` to Redis) drops all of
  these constraints. The seam is Medusa's per-provider **loader**: `search-orama`
  ships a boot-reindex loader; providers that don't need it ship none. No flag,
  no core polling — the constraint stays inside the one provider that has it.
- **Single active provider is a hard design constraint (file pattern), not
  multi (notification pattern):** the marketplace runs exactly one search
  backend at a time. `search-provider-service.ts` asserts exactly one registered
  provider and throws otherwise, and the module options expose a singular
  `provider` (never a `providers[]` array). The `notification`
  one-provider-per-channel machinery (a DB table + channel routing) is
  deliberately excluded.
- **Filters are provider-owned, not part of the shared contract.** Only
  `SearchQueryBase` (`q`/`limit`/`offset`/open `filters`) lives in
  `@mercurjs/types`; each provider declares its concrete `filters` shape + zod
  validator and implements `SearchProvider<ItsQuery>`. Consequence: the accepted
  filter set is a property of the *active* provider — swapping providers can add
  or drop filters, and the store route/storefront validate against whatever the
  active provider exports. The single cross-provider guarantee is
  `filters.seller_status` (route-forced to `"open"`), because `seller_status` is a
  documented `SearchDoc` field every marketplace provider must index. This is the
  one place the store route is *not* fully backend-agnostic — an intentional
  trade for letting each backend expose its native filtering (Algolia facets vs
  Meili filter strings vs Orama `where`).
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
