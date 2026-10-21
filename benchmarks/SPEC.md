---
status: in_progress
canonical: true
priority: 2
area: "performance"
created: 2026-10-21
last_updated: 2026-10-21
---

# SPEC-002 k6 load benchmark for the marketplace hot paths

Repeatable Grafana k6 benchmark for Mercur, modelled on Medusa's
`scripts/load/mid-sized-dtc-checkout.js` (medusajs/medusa @ `623ee92f`), but
exercising what Medusa's script cannot: offers, sellers, multi-seller carts,
order groups, split orders, commission lines, and seller-scoped vendor lists.
The output is a baseline table in `docs/PERFORMANCE.md` that every later
perf PR compares against.

## Why Medusa's script is not enough

Medusa's script adds `variant_id` to carts, reads one `shipping_options`
array, completes into a single order, and never touches a seller. In Mercur
the store line-item route takes `offer_id`
(`packages/core/src/api/store/carts/[id]/line-items/validators.ts`), shipping
options come back grouped per seller
(`StoreSellerShippingOptionsResponse.shipping_options: Record<sellerId, ShippingOptionDTO[]>`),
the cart needs one shipping method per seller, and completion returns
`{ type: "order_group", order_group }` with `seller_count` child orders.
Those are the paths that cost extra on top of Medusa, so they are the paths
this benchmark isolates.

## Deliverables

```
benchmarks/
  README.md                       how to seed, run, and read results
  k6/
    config.js                     env, headers, think-time helpers, responseCallback
    data.js                       SharedArray loaders for the JSON produced by the seed
    flows/
      browse.js                   catalog + seller + offer reads
      cart.js                     createCart / addOffer / viewCart / applyPromo
      checkout.js                 shipping per seller, payment, complete, verify group
      vendor.js                   authenticated seller-scoped reads
    scenarios.js                  scenario → exec map + thresholds
    main.js                       entry: `k6 run benchmarks/k6/main.js` (closed model, Medusa parity)
    burst.js                      entry: arrival-rate baseline + flash-sale burst
    race/
      hot-offer.js                N carts race on one offer with stock S
      same-cart.js                one cart completed N times in parallel
      multi-seller-stockout.js    multi-seller cart where one seller's offer runs out
      duplicate-session.js        parallel payment sessions / completes on one collection
  oracle/
    reconcile.sql                 read-only Postgres checks run after every run
    reconcile.ts                  runs the SQL, prints JSON, exits non-zero on any violation
  docker/
    Dockerfile                    image = published @mercurjs/* at MERCUR_VERSION, `medusa build`
    api/                          minimal consumer project (medusa-config.ts, package.json)
      src/scripts/seed-benchmark.ts
                                  deterministic dataset + writes benchmarks/data/*.json
  infra/                          Pulumi program: VPC, ALB, ECS Fargate (server x N + worker + ops task),
                                  RDS pg16 single-AZ, ElastiCache, optional EC2 k6 generator
    Pulumi.bench-small.yaml / Pulumi.bench-mid.yaml
    scripts/run-task.ts           `bun run task migrate|seed <tier>` via the ops task
```

`benchmarks/` is outside the Bun workspace globs; `benchmarks/infra` has its
own `bun install`.

k6 scripts are plain ES modules (k6 runtime), not part of any workspace
build. They are not linted by `bun run lint` and must not import from
`packages/*`.

## Dataset (benchmarks/docker/api/src/scripts/seed-benchmark.ts)

Deterministic from a fixed seed so every run and branch sees identical
data. Two tiers selected by argument: `small` for laptops and PR sanity,
`mid` for the published baseline (the one comparable to Medusa's numbers).

| Entity | small | mid | Purpose |
|---|---|---|---|
| Regions | 4 (2 with tax) | 4 (2 with tax) | pricing + tax context, same as Medusa |
| Sales channel | 1 + publishable key | 1 + publishable key | store auth |
| Sellers, `open`, all regions assigned | 20 | 200 | seller-product links, seller filters |
| Shipping options per seller | 1 | 1 to 3 | per-seller option grouping |
| Categories / collections | 20 / 10 | 50 / 20 | catalog filters |
| Global attributes, filterable, 2 of them variant axes | 5 | 10 | attribute filter path |
| Master products, `published` | 500 | 5,000 | same count Medusa used at `mid` |
| Variants per product | 4 to 10 | 4 to 10 | ~6k / ~35k variants |
| Offers per product (distinct sellers) | 2 to 5 | 5 to 20 | ~1.5k / ~50k offers |
| Prices per offer | 4 currencies | 4 currencies | offer-scoped `offer_id` price rules |
| Inventory level per offer | 1, 2 stock locations | same | reservations and item locks |
| Commission | global % + 20 rules | global % + 100 rules across product / category / seller | rule resolution on every split order |
| Promotion `10OFF` | 1, all sellers | 1, all sellers | promo path |
| Customers with address | 200 | 2,000 | logged-in carts later; not used in v1 |
| Historical orders (pre-seeded via complete-cart) | 1,000 | 50,000 | realistic vendor/admin list tables |

The seed writes `benchmarks/data/<tier>.json`:

```json
{
  "publishable_key": "pk_...",
  "regions": [{ "id": "reg_...", "country_code": "us" }],
  "categories": ["pcat_..."],
  "attribute_filters": [{ "handle": "color", "values": ["red", "blue"] }],
  "products": ["prod_..."],
  "sellers": [{ "id": "sel_...", "handle": "...", "token": "<vendor JWT>" }],
  "offers_by_seller": { "sel_...": ["offer_..."] },
  "offers": [{ "id": "offer_...", "seller_id": "sel_...", "product_id": "prod_..." }]
}
```

Vendor JWTs are minted at seed time so the vendor scenario never hits the
auth routes during a run. k6 loads the file with `SharedArray` so the data is
read once per process, not once per VU.

## Scenarios

Same executor shape as Medusa: `ramping-vus`, 2m up, 6m hold, 2m down,
`gracefulRampDown: 30s`. Each scenario tags every request with
`scenario` and a `name` pattern (never a raw URL with ids) so p95 is
reported per scenario and cardinality stays low. Think times match
Medusa's (2 to 5 s between steps, 0 to 3 s inside checkout).

| Scenario | VUs (mid) | Flow |
|---|---|---|
| `browseCatalog` | 300 | batch GET `/store/regions`, `/store/product-categories`, `/store/sellers?limit=20` → GET `/store/products?region_id&limit=20&fields=*variants.calculated_price` → GET `/store/products/:id?region_id` → GET `/store/offers?product_id=:id&region_id` |
| `browseFiltered` | 60 | GET `/store/products?category_id=…&region_id` → GET `/store/products?attributes[<handle>]=<v>&region_id` → GET `/store/products?offset=400&limit=20&region_id` (deep page) → GET `/store/sellers/:id` → GET `/store/offers?seller_id=:id&region_id` |
| `singleSellerComplete` | 30 | create cart → add 1 to 3 offers from one seller (qty 1 to 3) → view cart → 10 % apply `10OFF` → checkout |
| `singleSellerAbandon` | 30 | same, no checkout |
| `multiSellerComplete` | 30 | create cart → add 3 to 5 offers from 3 to 5 distinct sellers → view cart → 10 % promo → checkout |
| `multiSellerAbandon` | 30 | same, no checkout |
| `vendorReads` | 20 | bearer JWT for a random seller: GET `/vendor/orders?limit=20` → GET `/vendor/orders?offset=200&limit=20` → GET `/vendor/offers?limit=20` → GET `/vendor/products?limit=20` (curated fields, see memory `vendor-products-default-fields-500`) → GET `/vendor/orders/:id` |

Total 500 VUs at `mid`. `small` runs the same scenarios at one fifth.

### Checkout sub-flow (shared by the two `*Complete` scenarios)

1. batch GET `/store/carts/:id`, GET `/store/payment-providers?region_id`,
   GET `/store/shipping-options?cart_id`
2. POST `/store/carts/:id` with a fixed address + `john.doe@example.com`
3. POST `/store/carts/:id/shipping-methods` with an **array**: the first
   option from every seller key in `shipping_options`. Check: the cart now has
   as many `shipping_methods` as sellers in the cart.
4. POST `/store/payment-collections` `{ cart_id }`, then
   POST `/store/payment-collections/:id/payment-sessions` with `pp_system_default`
5. POST `/store/carts/:id/complete`. Check: `type === "order_group"` and
   `order_group.orders.length === <distinct sellers in cart>`.
6. GET `/store/order-groups/:id`

Any `type: "cart"` response from complete is a failed check, not an HTTP
failure, and is counted on the custom `checkout_failed` counter.

### Logged-in variant

`singleSellerComplete` and `multiSellerComplete` each run 20 % of their
iterations as an authenticated customer (token minted at seed time, customer
in a group with a group-scoped price list). Session lookup and customer-group
pricing are separate paths from the anonymous flow and are tagged
`auth=customer` so their p95 is reported on its own.

### Burst profile (`burst.js`)

Closed-model VUs self-throttle when the server slows down, which hides the
knee. `burst.js` uses `ramping-arrival-rate` with `preAllocatedVUs` sized for
the peak so shoppers arrive on schedule regardless of response time.

| Scenario | Executor | Shape |
|---|---|---|
| `baselineBrowse` | `constant-arrival-rate` | 100 iterations/s of the `browseCatalog` flow for the whole run |
| `baselineCheckout` | `constant-arrival-rate` | 5 iterations/s of `multiSellerComplete` for the whole run |
| `flashSale` | `ramping-arrival-rate` | starts at 3 min: 0 → 40 checkouts/s over 10 s, hold 30 s, down over 10 s; every cart buys the same `hot_offer` with stock 500 |
| `cacheBust` | `constant-arrival-rate` | 10 iterations/s of `browseCatalog` with a random `fields` suffix so every request misses the cache |

`dropped_iterations` must be 0 or the run is invalid. The run also feeds the
oracle (below) so the flash sale doubles as an oversell test at realistic
background load.

## Correctness under load (`race/`)

Latency numbers are worthless if the orders behind them are wrong. These
scripts use `shared-iterations` with no think time, run against the `small`
tier, and fail on custom metrics rather than on latency. They are separate
entries so they can run in CI on every core PR in under two minutes.

| Script | Setup | Fire | Expected |
|---|---|---|---|
| `hot-offer.js` | one offer, stock S=5; N=20 carts each holding qty 1, address, shipping, payment session already set | N parallel `POST /store/carts/:id/complete` | exactly S responses `type: "order_group"`, N−S responses `type: "cart"` with the stock error; oracle: S child orders, reserved = ordered, available = 0 |
| `hot-offer.js` extra cases | S=1/N=2, S=0/N=5, mixed quantities `[3,1,1,1,1]` | same | ordered ≤ S, reserved = ordered, every refused cart's qty > final available |
| `same-cart.js` | one prepared multi-seller cart | 10 parallel completes of the same cart | every 200 returns the same `order_group.id`; oracle: 1 order group, `seller_count` child orders, 1 captured payment per child order |
| `multi-seller-stockout.js` | cart with offers from 3 sellers; seller B's offer has stock 1; a second cart holds the same seller B offer | complete both carts in parallel | one cart wins; the loser gets `type: "cart"` with no partial order group, no orphan child orders, no commission lines, no reservations left behind |
| `duplicate-session.js` | one cart, one payment collection | 5 parallel `POST /store/payment-collections/:id/payment-sessions` then 5 parallel completes | one order group; oracle: payment splits sum to cart total exactly once |

Custom metrics, all thresholds `== 0`: `oversold_units`,
`duplicate_order_groups`, `orphan_child_orders`,
`orphan_commission_lines`, `dangling_reservations`,
`payment_split_mismatch`. Any 5xx or socket error is a product bug and is
counted on `server_errors`, threshold `== 0`.

### Oracle (`oracle/reconcile.ts`)

Read-only queries run after every load run and every race script, scoped by
a run prefix on cart metadata so concurrent runs do not collide. Violations
are printed as JSON and exported as k6 metrics via `handleSummary` or asserted
by the race scripts in `teardown()`.

1. `count(order)` = `sum(order_group.seller_count)` for groups created in the run
2. every order has exactly one order-group link
3. every commission line references an order that exists and is not canceled
4. per order group: `sum(child payment amounts)` = captured amount on the group's payment collection, in minor units, no rounding drift
5. per offer touched in the run: `reserved_quantity` = `sum(ordered qty)` of non-canceled orders, `available ≥ 0`
6. no cart in the run has both an order-group link and no completed_at
7. no `workflow_execution` rows left in `invoking` or `not_started` older than 60 s

## Metrics

Built-in, reported per scenario tag:

- `http_req_duration` p50 / p95 / p99
- `http_reqs` avg and peak per second
- `http_req_failed` rate (responseCallback: 200 to 399 expected; 401 expected
  only on `/store/customers/me`)
- `checks` pass rate
- `dropped_iterations` must be 0, otherwise the run is invalid (load generator bound)

Custom, latency:

- `cart_to_order_ms` Trend: createCart → complete, tagged `sellers=<n>` and `auth=<anon|customer>`
- `complete_ms` Trend: the complete call alone, tagged `sellers=<n>`
- `child_orders_per_group` Trend (sanity: equals seller count)

Custom, funnel (reported per minute; the headline readiness number is
`order_groups_completed` per minute inside the latency and error budget, not
RPS):

- `carts_created`, `items_added`, `checkouts_started`, `order_groups_completed`, `child_orders_created`, `checkout_failed` Counters
- conversion ratios derived in `handleSummary`: added/created, completed/started

Custom, correctness (from the oracle, thresholds `== 0`): see
"Correctness under load".

Report p95 **per stage**, never blended. Browse requests outnumber completes
roughly 50:1, so a single `http_req_duration` p95 is just the browse number.

Server side, scraped during the run and kept with the result:

- Postgres: active connections vs `pool.max`, `pg_stat_statements` top 20 by
  total time, `seq_scan` deltas on `offer`, `price_rule`, `order`,
  `commission_line`, and all Mercur link tables, lock wait time
- Redis: cache hit ratio (`MEDUSA_FF_CACHING` on vs off), event bus queue depth
- Node: CPU, heap, event loop lag per process (server and worker separately)

## Thresholds (initial, mid tier, cache on)

| Metric | Threshold |
|---|---|
| `browseCatalog` p95 | < 400 ms (Medusa parity) |
| `browseFiltered` p95 | < 600 ms |
| `*Abandon` p95 | < 700 ms |
| `singleSellerComplete` p95 | < 1200 ms |
| `multiSellerComplete` p95 | < 2000 ms |
| `vendorReads` p95 | < 500 ms |
| `http_req_failed` | < 1 % |
| `checks` | > 99 % |
| `complete_ms{sellers:5}` / `complete_ms{sellers:1}` | < 3× (split cost must be sub-linear) |
| `cacheBust` p95 vs `baselineBrowse` p95 | recorded, no threshold; the gap is the cache's contribution |
| `flashSale` `oversold_units`, `server_errors` | == 0 |
| every `race/*` correctness metric | == 0 |
| `dropped_iterations`, all entries | == 0 |

Thresholds are starting points. The first baseline run may miss them; record
the real numbers and then tighten or loosen with a reason in Notes.

## Runs that must be recorded

1. `mid`, cache off, 10 min, 500 VUs (raw baseline)
2. `mid`, cache on, same (the Medusa A/B)
3. Step test: 100 → 200 → 400 → 800 VUs, 3 min each, to find the knee
4. 60 min soak at 60 % of the knee: heap and queue depth must be flat
5. `small` tier, cache on, 500 VUs: isolates concurrency from data volume
6. `burst.js` on `mid`, cache on, 10 min: flash-sale p95, orders per minute during the burst, oversell count
7. `race/*` on `small`, 3 trials each, oracle clean (also the CI gate)
8. Run 2 repeated with the oracle after it: a load run whose oracle fails is reported as failed regardless of p95

## Target version

The benchmark runs against Mercur `v2.3.8-canary.4` or newer, on the
`@medusajs/framework` version that release pins (`2.21.2` today). Every
recorded run must state the exact `@mercurjs/core` version and git SHA of
the API image, because the perf work on `main` (e.g. #1678, vendor list
scoping pushed into SQL) moves the numbers between canaries.

Before the first recorded run:

1. Upgrade the benchmark API to `v2.3.8-canary.4` (or the latest canary at
   the time). In this monorepo that means building the image from a commit
   at or after the `v2.3.8-canary.4` tag; for a template-based deployment it
   means bumping every `@mercurjs/*` dependency to that version and
   re-running `medusa db:migrate`.
2. Re-run `seed-benchmark.ts` on the upgraded schema; do not reuse a snapshot
   seeded on an older canary.
3. Record the version in the result filename:
   `benchmarks/results/<date>-<tier>-<cache>-<core-version>.json`.

Later canaries are re-benchmarked only on runs 2, 6 and 7 (cache-on
baseline, burst, race suite) unless a release touches cart, order split,
commission, pricing, or listing code, in which case the full set is repeated.

## Environment

- k6 runs on the stack's EC2 generator (`c7g.xlarge`, same VPC, reached via
  SSM) or on Grafana Cloud k6 with the `amazon:eu:frankfurt` zone; never on
  the API tasks
- Provisioned by `benchmarks/infra` (Pulumi, `eu-central-1`). Stack
  `bench-mid`: 2 Fargate tasks `WORKER_MODE=server` + 1 `worker`, 1 vCPU /
  2 GB each on ARM64 (same sizing as Medusa's post), `DB_POOL_MAX=20`,
  `locking-redis` registered, `MEDUSA_FF_CACHING` toggled with
  `pulumi config set cacheEnabled`. Stack `bench-small` is one server task
  on `db.t4g.medium`.
- RDS PostgreSQL 16 `db.m6g.xlarge` (4 vCPU / 16 GB), single AZ, gp3,
  `pg_stat_statements` + Performance Insights; ElastiCache Redis 7 `cache.m6g.large`
- Output: `--out experimental-prometheus-rw` into Grafana with the k6
  dashboard, plus `--summary-export` JSON committed under `benchmarks/results/<date>-<tier>-<cache>.json`
- Env vars: `K6_ENDPOINT`, `K6_TIER` (`small` | `mid`), `K6_DATA` (path to the seed JSON), `K6_VU_SCALE` (multiplier, default 1)
- Reseed carts, orders, order groups, payment collections between runs; the
  catalog can stay

## User-Visible Behavior

Not user-facing. The visible result is a results table in
`docs/PERFORMANCE.md` and `benchmarks/README.md` that a contributor can
reproduce in one command per step.

## Verification

0. The API under test reports `@mercurjs/core` `2.3.8-canary.4` or newer (check the image's `node_modules/@mercurjs/core/package.json` or the deployed commit against the tag) and `medusa db:migrate` is clean on it
1. `bun run build` passes with `benchmarks/` present (nothing in the workspace imports it)
2. `bun run task seed small` from `benchmarks/infra` (or `npx medusa exec ./src/scripts/seed-benchmark.ts small` inside the image) completes and writes `benchmarks/data/small.json`
3. `k6 run --vus 5 --duration 1m benchmarks/k6/main.js` against a local API: 0 `http_req_failed`, 0 `dropped_iterations`, every check passes, including `order_group.orders.length` equal to the distinct seller count
3a. `k6 run benchmarks/k6/race/hot-offer.js` locally, 3 trials: exit code 0, oracle JSON shows all correctness metrics at 0, and a deliberately broken run (stock check commented out in a scratch branch) exits 99 with `oversold_units > 0`, proving the test can fail
3b. `bun benchmarks/oracle/reconcile.ts --run <prefix>` after step 3 prints zero violations
4. The five runs above are executed on the stated environment and the summary JSONs are committed
5. `docs/PERFORMANCE.md` gets a "Baseline" section with the per-scenario p95 / RPS table for runs 1, 2, and 5, and the knee from run 3
6. Thresholds in `scenarios.js` match the recorded baseline, with any deviation explained in Notes

## Evidence

_(empty until verification runs)_

## Notes

- Multi-seller shipping: `POST /store/carts/:id/shipping-methods` accepts an
  array, and the vendor-grouped `shipping_options` map is the source for one
  option per seller. The script must not pick "the first option" like Medusa's.
- Line items use `offer_id`, and the route resolves `variant_id` itself. Pick
  offers from `offers_by_seller` so single- and multi-seller carts are built
  by construction, not by luck.
- Keep `fields` on product listing to `*variants.calculated_price` as Medusa
  does. Do not widen it; a wider default is a separate finding.
- Vendor product listing must send the curated field list; the default
  `*`-relation fields 500 on `GET /vendor/products`.
- The checklist in `docs/PERFORMANCE.md` section 4 should be worked before
  run 2 is taken as the published baseline, otherwise the numbers measure known
  issues rather than the current branch.
- Model choice: `main.js` stays closed-model so its table is comparable to
  Medusa's post. `burst.js` is open-model because closed-model VUs
  self-throttle and hide the knee (Shopify and the flash-sale playbook both
  layer bursts on a baseline for this reason).
- Correctness beats latency. Oversell, duplicate order groups, and payment
  split drift are worse than a failed request, so they are hard thresholds and
  a run with any of them is a failed run. The Medusa race suite pattern
  (S=5, N=20, Postgres oracle) is the reference; Mercur's offer-scoped
  inventory, order-cart link idempotency, and payment split are the paths it
  does not cover.
- Reporting: completed order groups per minute is the headline, per-stage
  p95 next, RPS last. Fragment and Shopify both report per-operation numbers,
  never a blended p95.
- No marketplace platform has published split-order or multi-vendor checkout
  benchmarks, and neither Saleor nor Vendure publish k6 results. The baseline
  plus the race results would be the first reproducible marketplace benchmark.
- Later extensions, out of scope here: returns and refunds under load, admin
  order-group lists, `query.index` listing on vs off, regional outage
  simulation, waiting-room behaviour above payment capacity.
