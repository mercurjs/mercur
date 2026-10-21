# Performance techniques from Medusa core, and how Mercur should apply them

Catalog of the optimization techniques used inside Medusa 2.x (read from the
`develop` branch, 2.21.0, which matches the pins in this repo). Every item names
where the technique lives in the Medusa source, what it does, and the rule Mercur
should follow. Paths are relative to the Medusa monorepo `packages/` directory.

## 1. Workflows

### 1.1 Keep hot-path workflows non-stored
- `orchestration/src/transaction/distributed-transaction.ts:514`,
  `transaction-orchestrator.ts:1514-1523`
- A workflow writes a checkpoint to Redis/DB at every step boundary only if it
  has `retentionTime`, `idempotent`, `timeout`, `retryInterval`, `store`, or an
  `async` step. Medusa's cart workflows have none of these, so they run fully in
  memory. `completeCartWorkflow` is the deliberate exception
  (`store: true, retentionTime: 3 days`), and gets idempotency from the
  `order_cart` link check plus a lock, not from `idempotent: true`.
- **Mercur rule:** never add those options to cart, offer, pricing, or listing
  workflows. Get completion idempotency from a domain check (does the link
  exist?). Do not pass deterministic `transactionId`s on high-frequency routes
  (Medusa removed them in commit `990691e78a`).

### 1.2 `parallelize()` independent steps
- 94 call sites in `core/core-flows`. `complete-cart.ts:648` runs link
  creation, `completed_at`, inventory reservation, promotion usage, and the
  `order.placed` event together. `create-carts.ts:204` runs sales channel,
  region and customer lookups together.
- **Mercur rule:** seller lookup, commission rule resolution, and payout reads
  that do not depend on each other go in one `parallelize`.

### 1.3 `when()` guards and "skip if unchanged"
- `refresh-cart-items.ts:158,202,251`: full repricing only on `force_refresh`,
  which `update-cart.ts:390` sets only when region, locale, or tax-relevant
  address changed. Otherwise only the touched line items get tax lines.
- `refresh-payment-collection.ts:124`: skips when amount and currency match.
  `refresh-cart-shipping-methods.ts:64`: skips when the cart has no methods.
- `complete-cart.ts:409`: the whole order branch is `when(!orderId)`.
- **Mercur rule:** gate commission recompute, split-order creation, and seller
  notifications on what actually changed. Every step returns early on empty
  input (30+ examples in `cart/steps`).

### 1.4 Nested locks are skipped
- `locking/steps/acquire-lock.ts:69`: inside a sub-workflow the step returns
  `StepResponse.skip()` unless `executeOnSubWorkflow` is set. Cart workflows use
  `timeout: 2, ttl: 10`; `completeCart` uses `timeout: 30, ttl: 120`.
- **Mercur rule:** use `acquireLockStep` on `cart_id` in split-order completion
  with the same values. Lock inventory per inventory item
  (`reserve-inventory.ts:88`), never per seller or globally.

### 1.5 Pass loaded data into sub-workflows
- Refresh sub-workflows accept `cart?` and fetch only `when(!input.cart)`.
  Purpose-built field constants live in `cart/utils/fields.ts`
  (`completeCartFields`, `cartFieldsForPricingContext`, ...).
- `get-variants-and-items-with-prices.ts` indexes variants in a `Map` (commit
  `5cc7fdef18`) so per-item lookup is O(1).
- **Mercur rule:** define per-purpose field constants, accept a preloaded entity
  in sub-workflows, use `Map` lookups in `transform`, and return several fields
  from one `transform` since results are memoized per transaction.

### 1.6 One bulk read, one bulk write
- `get-line-item-actions.ts:61`: one `listLineItems` with an `id` array, split
  into create/update sets. `update-line-items.ts:55`: one list (as the
  compensation snapshot) and one `updateLineItems(items)`.
- `get-variant-price-sets.ts:117`: prices grouped by context, one
  `calculatePrices` per distinct context, not per item.
- **Mercur rule:** pass `{ id, ...data }[]` to module update methods. Never
  selector-per-row.

### 1.7 Cheap compensation
- `getSelectsAndRelationsFromObjectArray(data)` (51 files) snapshots only the
  columns being changed. Deletes are soft in the forward step and restored by
  ID in compensation. Read-only steps have no compensate function.
- Payment is authorized last in `completeCart` (`complete-cart.ts:684`) so the
  rollback window is small.

### 1.8 Chunking and async steps for long work
- Import: 1000 CSV rows per chunk (`normalize-products-to-chunks.ts:93`),
  processed by an `async: true` step that frees memory between chunks.
  Export: batch size 50. Translations: 100.
- `async: true, backgroundExecution: true` on export, import, and reindex
  workflows. The HTTP request returns at once.
- **Mercur rule:** vendor CSV import/export, payout batches, and reindex use
  async background steps with 50 to 1000 item chunks. Never on cart paths.

### 1.9 Query cache inside workflows
- `useQueryGraphStep` with `options.cache.enable: true` for reference data
  (region, shipping options, promotion codes, customer). Variant queries use
  `computeAutomaticTags: true` plus explicit link-table tags in
  `cart/utils/fields.ts:212`.
- **Mercur rule:** Mercur link tables (seller-product, seller-order, offer
  links) need explicit `Link<Name>:list:*` tags or cached results go stale.

## 2. Query and data layer

### 2.1 How `query.graph` avoids N+1
- `core/query/src/joiner/remote-joiner.ts`, `execute.ts:386-516`. The query is
  compiled into stages by depth and service; IDs are unioned and deduplicated so
  each relation level costs one `list({ [fk]: ids })` per module. Sibling stages
  run in parallel. ID sets over 4000 are chunked with concurrency 10
  (`module-data-fetcher.ts:14`).
- Nested relations are fetched without a limit (`module-data-fetcher.ts:263`).
- A count query runs only when `skip` or `cursor` is set; `take` alone does not.
- **Mercur rule:** one `query.graph` with explicit `fields`, never a loop over
  sellers calling services. Each link hop adds one sequential stage. Do not
  expand unbounded one-to-many links (seller to products) in list views. Pass
  only `take` for internal lookups to avoid the COUNT.

### 2.2 Cross-module filters stay in SQL only under conditions
- `core/query/src/joiner/cross-module-joins/index.ts`,
  `utils/src/dal/mikro-orm/cross-module-query/augment-find-options.ts`.
  Filters and sorts on linked entities are rewritten into `EXISTS` subqueries
  if every hop is a link module or DML relation, all modules share the same
  database connection, and the field is a persisted, non-computed DML column.
  Otherwise the filter becomes "residual": the whole root set is loaded and
  filtered in memory, and pagination is re-applied afterwards
  (`execute.ts:61-149`).
- **Mercur rule:** keep every Mercur module on the shared connection (no
  `database.clientUrl`), use `model.define`, and filter only on persisted
  columns. This is the biggest cliff: filtering products by a seller field with
  pagination otherwise falls into memory.

### 2.3 MikroORM settings
- `mikro-orm-create-connection.ts:103`: `useBatchInserts`, `useBatchUpdates`,
  `batchSize: 100`, `implicitTransactions: false`,
  `autoJoinRefsForFilters: false`, metadata cache on.
- Default load strategy is `BALANCED` with forced LEFT JOIN populates
  (`mikro-orm-repository.ts:1535-1620`). Override per call with
  `config.options.strategy: "select-in"` for wide one-to-many populates.
- Each `@InjectManager` call forks the entity manager, so the identity map is
  per call. Transactions are reused only when `sharedContext` is threaded.
- `upsertWithReplace` does one SELECT, one bulk INSERT, then chunked
  `nativeUpdateMany` in parallel (`mikro-orm-repository.ts:1294`).
- Product repository splits deep populates into one `populate` call per
  relation to dodge a MikroORM slow path (`product/src/repositories/product.ts:76`).
- Inventory quantities are computed with raw knex sums
  (`inventory/src/repositories/inventory-level.ts:13`).
- **Mercur rule:** thread `@MedusaContext() sharedContext` through every nested
  service call. Use bulk `create`/`update` arrays and `upsertWithReplace` for
  vendor imports. Raw knex is acceptable for aggregates.

### 2.4 Indexes
- DML indexes are partial on `deleted_at IS NULL` by default
  (`dml/helpers/entity-builder/build-indexes.ts:17`). Every `belongsTo` FK and
  every `deleted_at` column is indexed automatically. Link tables get FK and
  `deleted_at` indexes (`link-modules/src/utils/generate-entity.ts:104`), but
  `extraColumns` are not indexed.
- Composite example `pricing/src/models/price-rule.ts:15`:
  `["price_id","attribute","operator"]` unique and `["attribute","value","price_id"]`.
  GIN on jsonb: `price-list-rule.ts:22` (`type: "gin"`).
- **Mercur rule:** declare composite indexes for every filter combination used
  on list routes (`seller_id + status`, `seller_id + created_at`, offer
  `seller_id + sku`). Any raw SQL must include `deleted_at IS NULL` or the
  partial indexes are skipped. Add migrations for link `extraColumns` you
  filter on.

### 2.5 Pricing
- `pricing/src/repositories/pricing.ts:66-315`: candidate prices come from one
  knex query. Price-list rule matching uses a derived table with
  `COUNT(*) FILTER (...) = rules_count` and jsonb `@>`; price rules use a
  `LATERAL` subquery. Denormalized `rules_count` columns avoid counting at
  query time. Contexts with more than 10 keys are pruned against a cached
  distinct-attribute set.
- **Mercur rule:** offer-scoped prices as `offer_id` price rules already use
  this single-query path. Pass the pricing context through
  `QueryContext(req.pricingContext)` on `variants.calculated_price`. Never call
  `calculatePrices` per variant. Keep the context under 10 keys.

### 2.6 Index engine
- `modules/index`: denormalized `index_data` (jsonb, GIN `jsonb_path_ops`,
  partitioned per entity) and `index_relation` tables. Synced by events in
  batches of 100 IDs, with full resync by keyset cursor under a lock. Listing
  runs `SELECT DISTINCT root.id` with jsonb containment filters, then hydrates
  via `query.graph`. Count is `count_estimate()` from EXPLAIN, only when `skip`
  is set. Sync and listeners run only in worker/shared mode.
- **Mercur rule:** mark the seller-product link `filterable` so Seller is
  ingested and seller filtering stays inside the index. Accept estimated
  counts. Entity IDs must be ULIDs for keyset sync.

### 2.7 Pool, transactions, replicas
- One shared knex pool for all internal modules. `pool.min` defaults to 2,
  `pool.max` has no Medusa default (knex uses 10). Config via
  `databaseDriverOptions.pool`. Parallel joiner stages can use up to 10
  connections per request.
- No read replica support anywhere in core.
- **Mercur rule:** set `pool: { min: 2, max: 20 }` per process and size
  `(servers + workers) * max` within Postgres or PgBouncer limits.

### 2.8 Events
- Bulk service methods emit one message with `data.id` as an array
  (`event-builder-factory.ts:28`). Workflows group events by `eventGroupId`
  and release them only after commit (`workflow-export.ts:636`), staged in
  Redis with a 600 s TTL. Only events with subscribers are enqueued, via one
  `addBulk`.
- **Mercur rule:** subscribers must handle `id: string[]`. Emit from workflows
  with `emitEventStep` so events are dropped on rollback. Emit arrays in one
  call.

## 3. HTTP layer, caching, runtime

### 3.1 There is no HTTP response cache
Caching is at the data layer only: the `cache` option on `query.graph` and
`query.index`, active only when `MEDUSA_FF_CACHING=true` and the Caching Module
with a provider is registered. Medusa Cloud's published gains
(`www/apps/cloud/app/cache/page.mdx`):

| Endpoint | Before | After |
|---|---|---|
| GET /store/products | 354 ms | 83 ms |
| GET /store/products/:id | 161 ms | 123 ms |
| POST /store/carts/:id/line-items | 697 ms | 427 ms |
| POST /store/carts/:id/complete | 1357 ms | 1018 ms |
| GET /store/shipping-options | 272 ms | 173 ms |

- Keys hash fields, filters, pagination, pricing context, and locale, so
  entries split per region and customer group. Invalidation is tag-based and
  driven by a `*` event subscriber that parses `<entity>.<op>` events into
  `Entity:id` and `Entity:list:*` tags. In-flight identical gets are coalesced.
  Redis provider gzips payloads over 2 KB and uses pipelines.
- `useCache(cb, { key, tags, ttl })` and the `@Cached` decorator wrap any
  computation, and are no-ops when caching is off.
- **Mercur rule:** pass `{ cache: { enable: true }, locale }` on seller and
  product listing routes, as the core store products route does. Emit Mercur
  module events as `seller.updated`, `commission_rate.updated` with `{ id }`
  so Seller entries invalidate. Always select `id` in cached queries. Wrap
  commission rule resolution and seller shipping aggregation in `useCache`.
  Never mutate cached results in place (memory provider uses `useClones:
  false`). Use a separate `CACHE_REDIS_URL` so cache evictions do not touch
  queues. Core gaps to fix in Mercur copies: `setTaxContext` refetches the
  region without cache, and customer groups in `setPricingContext` are not
  cached.

### 3.2 Worker mode and clustering
- `workerMode`: `shared` (default), `server`, `worker`. In `worker` mode there
  is no Express app. Subscribers load everywhere so servers know which events
  to enqueue, but only workers process them. Scheduled jobs, workflow engine
  retries, index sync, and the cleaner run only in worker/shared.
- `medusa start --cluster N --servers X --workers Y` forks processes and
  re-forks crashed ones.
- **Mercur rule:** production runs N `WORKER_MODE=server` replicas plus one or
  more `worker`. Mercur subscribers and payout jobs then run off the request
  path automatically. Never do heavy work in `onApplicationStart` without
  checking `worker_mode !== "server"`.

### 3.3 Query config and limits
- Store routes get `storeRelationsLimit` 3 (default) or per-route override;
  the products route uses 4. `fields` nested deeper than 2 levels are rejected.
  Default list limit is 50, and there is no maximum `limit` in core.
- **Mercur rule:** `/vendor/*` routes never get `req.storeRelationsLimit`, so
  add a vendor middleware that sets it. Add `.max(100)` to Mercur find-params
  `limit`. Use `allowFields(...)` instead of widening core allowlists. Request
  `inventory_quantity` only when needed. Vendor product lists must use curated
  fields, never the `*`-relation defaults.

### 3.4 Express settings
- Gzip is off by default (`http.compression.enabled`, threshold 1 KB). Enable
  only without a CDN or nginx in front.
- Body parsers are memoized per config; routes can set `bodyParser: false`
  (multer uploads) or `preserveRawBody: true` (Stripe Connect webhooks only).
- Sessions use Redis when `redisUrl` is set; without it every node has its own
  in-memory store and horizontal scaling breaks. Session `resave: true` by
  default; set `false` to cut Redis writes. Bearer JWT for the vendor panel
  skips session lookups entirely.

### 3.5 Redis modules
- Event bus: `removeOnComplete: true`, `attempts: 1`, worker `concurrency: 1`
  on Cloud. Set `workerOptions.concurrency: 5-10` on workers if Mercur
  subscribers are I/O-bound and idempotent. Pass `attempts` and `backoff` per
  emit for notification events.
- Locking: default lease 60 s, auto-renewed every lease/3, wait timeout 5 s,
  retry 20 ms with exponential backoff and jitter. Register `locking-redis` as
  the default provider in multi-instance deployments.
- Workflow engine: three queues (main, jobs, cleaner) with separate
  `workerOptions.concurrency`. The Redis storage writes to Postgres only at
  handover points (commit `bd206cb250`) and uses pipelines with `NX` for
  "already started" detection. Keep `retentionTime` short or unset so
  `workflow_execution` stays small.

### 3.6 Store product listing path (reference for seller-scoped listing)
Middleware chain in `medusa/src/api/store/products/middlewares.ts`:
authenticate (optional) → validate query (limit 50, depth 4) → sales channel
filter from publishable key → `applyMaybeLinkFilterIfNecessary` (skips the link
pre-query when the index engine is on, or when only one sales channel exists)
→ default filters → `normalizeDataForContext` (region from cart or cached store
default) → `setPricingContext` (cached region, uncached customer groups) →
`setTaxContext` → clear context keys. Handler uses `query.index` when the flag
is on and no tag/category/option filters are present, otherwise `query.graph`,
both with `cache: { enable: true }`. Tax prices are wrapped in one batched
`getTaxLines` call after the query.

**Mercur rule:** reuse `normalizeDataForContext`, `setPricingContext`, and
`setTaxContext` from `@medusajs/medusa/api/utils/middlewares`. Copy the
"skip the filter when only one exists" trick for seller filters.

## 4. Applied on `perf/core-hot-path-optimizations`

- Checkout: lock timeout/ttl and `retentionTime` were passed in milliseconds
  (an 8 hour lock wait, 33 hour lock, 8 year retention); now seconds like core.
  The cart lock is also taken when checkout runs nested under
  `processPaymentWorkflow`, which releases its own lock first. Shipping
  options, promotion sellers, seller-customer links and offer inventory are
  read in one `parallelize`; link creation and offer-link mirroring join the
  post-order fan-out.
- Commission: `getCommissionLinesBatch` on the module service and system
  provider loads the rate table once per checkout instead of once per seller
  order. The order fetch is trimmed to the fields the context builder reads.
  Providers may implement the optional batch method; the module falls back to
  per-context calls otherwise.
- Split payments: lock taken on the nested path, two reads parallelized.
- Steps: early returns on empty input for offer create/update and every
  `link-seller-*` step; offer updates pass `{ id, ...data }` so the module does
  one lookup instead of one per selector.
- Vendor product scoping: single-product visibility and ownership checks are
  filtered by `product_id` instead of loading the whole `product_seller`
  table and every product the seller ever created.
- Cache opt-in on reference reads: visible sellers, sales-channel stock
  locations, seller regions and currencies, store product list and detail
  (with locale).
- Order-group list SQL: soft-deleted orders, links and summaries excluded from
  the aggregates and filters.
- Indexes: `order_group` (cart_id, customer_id+created_at, created_at),
  `offer` (seller_id+created_at, product_id+seller_id+created_at), `payout`
  (account_id+created_at, status+created_at), `review`
  (reference+status+created_at), `commission_rule` (reference+reference_id).
  `commission_line` declares the indexes its migration already created.

## 5. Priority checklist for Mercur before load testing

1. Audit every Mercur workflow for `retentionTime`, `idempotent`, `timeout`,
   `retryInterval`, and `async` on hot paths. Remove them.
2. Audit every `query.graph` call for missing `fields`, `*`-relation defaults,
   and expanded unbounded links.
3. Find filters on computed or cross-connection fields that fall into residual
   in-memory filtering, especially product-by-seller listing with pagination.
4. Add composite partial indexes for the seller-scoped list filters on orders,
   offers, product changes, and payouts.
5. Thread `sharedContext` through every nested service call in Mercur modules.
6. Mark the seller-product link `filterable` and move store listing to
   `query.index`.
7. Enable the caching flag plus Redis provider, add link-table tags to Mercur
   cached queries, and emit `<entity>.<op>` events from Mercur modules.
8. Cap `limit`, set the relations limit on `/vendor/*`, and set
   `databaseDriverOptions.pool.max`.
9. Run server/worker split with `locking-redis` registered.
10. Move payout batches, imports, and exports to async background steps.

Useful Medusa commits to read with `git show` in the Medusa checkout:
`2fe68a975b`, `c54c5ed6de`, `990691e78a`, `d1efad9bf0`, `5cc7fdef18`,
`bd206cb250`, `8e5c22a8e8`, `bd571aca82`.
