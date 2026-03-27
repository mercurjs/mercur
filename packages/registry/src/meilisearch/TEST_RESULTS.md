# Meilisearch Block — Test Results

**Date:** 2026-03-25
**Environment:** macOS, Meilisearch v1.12, Medusa v2.13.4, bun 1.3.11

---

## Unit Tests

**Command:** `cd packages/registry && npx jest --config jest.config.cjs`
**Result:** 4 suites, 57 tests, all passing

### service.unit.spec.ts (7 tests)

| # | Test | Status |
|---|------|--------|
| 1 | Constructor throws when host is missing | PASS |
| 2 | Constructor throws when apiKey is missing | PASS |
| 3 | Constructor throws listing both when both are missing | PASS |
| 4 | Constructor creates service when both options are provided | PASS |
| 5 | getHost returns the configured host string | PASS |
| 6 | batchUpsert calls addDocuments on the products index | PASS |
| 7 | batchUpsert is a no-op for an empty array | PASS |
| 8 | batchDelete calls deleteDocuments on the products index | PASS |
| 9 | batchDelete is a no-op for an empty array | PASS |
| 10 | search returns structured result from meilisearch hit list | PASS |
| 11 | search falls back to estimatedTotalHits when totalHits is absent | PASS |
| 12 | getStatus returns documentCount and isHealthy:true on success | PASS |
| 13 | getStatus returns isHealthy:false when meilisearch is unreachable | PASS |
| 14 | ensureSettings applies searchable, filterable, and sortable attributes | PASS |

### store-route.unit.spec.ts (10 tests)

| # | Test | Status |
|---|------|--------|
| 1 | Always sends seller.status = "active" in the filter string (FR-003) | PASS |
| 2 | Cannot bypass seller filter even when no other filters are provided | PASS |
| 3 | Appends category filter after the mandatory seller filter | PASS |
| 4 | Appends price_min filter | PASS |
| 5 | Appends price_max filter | PASS |
| 6 | Appends seller_handle filter | PASS |
| 7 | Combines all filters with AND | PASS |
| 8 | Returns empty products array when meilisearch returns no hits | PASS |
| 9 | Hydrates products from DB and returns them in hit order | PASS |
| 10 | Passes pagination params to meilisearch | PASS |
| 11 | Passes attributesToRetrieve: ["id"] to avoid over-fetching | PASS |
| 12 | Does not call query.graph when meilisearch returns empty hits | PASS |

### meilisearch-product.unit.spec.ts (9 tests)

| # | Test | Status |
|---|------|--------|
| 1 | filterProductsByStatus splits ids into published and other (draft) | PASS |
| 2 | filterProductsByStatus puts proposed and rejected in other | PASS |
| 3 | filterProductsByStatus includes missing DB ids in other (soft-deleted) | PASS |
| 4 | filterProductsByStatus returns empty arrays for empty id list | PASS |
| 5 | filterProductsByStatus resolves the QUERY key from the container | PASS |
| 6 | findAndTransformMeilisearchProducts makes exactly ONE query.graph call (no N+1) | PASS |
| 7 | findAndTransformMeilisearchProducts includes seller fields in query.graph | PASS |
| 8 | findAndTransformMeilisearchProducts returns valid MeilisearchProduct-shaped docs | PASS |
| 9 | findAndTransformMeilisearchProducts flattens options into key/value records | PASS |
| 10 | findAndTransformMeilisearchProducts adds variant option key/values onto variant | PASS |
| 11 | findAndTransformMeilisearchProducts throws Zod error when required field missing | PASS |
| 12 | findAndTransformMeilisearchProducts applies status:published filter | PASS |

### subscribers.unit.spec.ts (17 tests)

| # | Test | Status |
|---|------|--------|
| 1 | Bridge emits PRODUCTS_CHANGED for product.created | PASS |
| 2 | Bridge emits PRODUCTS_CHANGED for product.updated | PASS |
| 3 | Bridge emits PRODUCTS_DELETED for product.deleted | PASS |
| 4 | Bridge emits PRODUCTS_CHANGED for product.product.created | PASS |
| 5 | Bridge emits PRODUCTS_CHANGED for product.product.updated | PASS |
| 6 | Bridge emits PRODUCTS_DELETED for product.product.deleted | PASS |
| 7 | Bridge logs error and rethrows when eventBus.emit fails (FR-012) | PASS |
| 8 | ProductsChanged calls batchUpsert for published products | PASS |
| 9 | ProductsChanged calls batchDelete for non-published products | PASS |
| 10 | ProductsChanged logs error and rethrows on failure (FR-012) | PASS |
| 11 | ProductsChanged skips batchUpsert when no published products | PASS |
| 12 | ProductsDeleted calls batchDelete with provided ids | PASS |
| 13 | ProductsDeleted logs error and rethrows on failure (FR-012) | PASS |
| 14 | SellerSuspended queries seller products and emits PRODUCTS_CHANGED | PASS |
| 15 | SellerSuspended emits in chunks of 100 for many products | PASS |
| 16 | SellerSuspended does nothing when seller has no products | PASS |
| 17 | SellerSuspended logs error and rethrows on failure (FR-012) | PASS |
| 18 | SellerUnsuspended emits PRODUCTS_CHANGED for seller products | PASS |
| 19 | SellerUnsuspended logs error and rethrows on failure (FR-012) | PASS |

---

## Manual Endpoint Tests

**Server:** `http://localhost:9000` (mercur backend with meilisearch block installed)
**Meilisearch:** `http://localhost:7700` (Docker, 31 indexed products, 13 active sellers)
**All 30 tests passed.**

### Search — Basic

| # | Test | Input | Result | Status |
|---|------|-------|--------|--------|
| 1 | Empty query (browse all) | `query: ""` | 31 totalHits, 3 products (hitsPerPage: 3) | PASS |
| 2 | Keyword search | `query: "glass"` | 1 hit: "Ball Glass" | PASS |
| 3 | Typo tolerance | `query: "glas"` | 1 hit: "Ball Glass" | PASS |
| 28 | Relevance ordering | `query: "jacket"` | 5 hits, jacket titles ranked first | PASS |
| 30 | Query + filter combined | `query: "stag", seller_handle: red` | 2 hits | PASS |

### Pagination

| # | Test | Input | Result | Status |
|---|------|-------|--------|--------|
| 4 | Page 1 | `page: 1, hitsPerPage: 5` | 5 products, page 1 of 7 | PASS |
| 5 | Page 2 | `page: 2, hitsPerPage: 5` | 5 products, page 2 of 7 | PASS |
| 6 | Last page | `page: 7, hitsPerPage: 5` | 1 product, page 7 of 7 | PASS |
| 7 | Beyond last page | `page: 99` | 0 products, page 99 | PASS |
| 24 | Empty body (defaults) | `{}` | 12 products, page 1, hitsPerPage 12 | PASS |
| 29 | Max hitsPerPage (100) | `hitsPerPage: 100` | 31 products, 1 page | PASS |

### Price Range Filters

| # | Test | Input | Result | Status |
|---|------|-------|--------|--------|
| 8 | Min price only | `price_min: 5000` | 15 products | PASS |
| 9 | Max price only | `price_max: 1000` | 0 products | PASS |
| 10 | Min + max price | `price_min: 2000, price_max: 5000` | 15 products | PASS |
| 11 | No results range | `price_min: 999999` | 0 products | PASS |

### Category Filters

| # | Test | Input | Result | Status |
|---|------|-------|--------|--------|
| 14 | Single category | `categories: ["pcat_...Clothing"]` | 9 products | PASS |
| 15 | Non-existent category | `categories: ["pcat_nonexistent"]` | 0 products | PASS |
| 26 | Multiple categories | `categories: ["...Clothing", "...Kitchen & Dining"]` | 13 products (both categories) | PASS |

### Seller Handle Filter

| # | Test | Input | Result | Status |
|---|------|-------|--------|--------|
| 12 | Valid seller | `seller_handle: "red"` | 8 products, all from that seller | PASS |
| 13 | Non-existent seller | `seller_handle: "does-not-exist"` | 0 products | PASS |

### Combined Filters

| # | Test | Input | Result | Status |
|---|------|-------|--------|--------|
| 16 | Category + price range | `categories + price_min + price_max` | 6 products | PASS |
| 17 | Query + seller + price | `query: "jacket", seller + price_max` | 1 product: "Waterproof Jacket" | PASS |
| 18 | All filters at once | `category + price_min + price_max + seller` | 1 product | PASS |

### Validation & Security

| # | Test | Input | Expected | Status |
|---|------|-------|----------|--------|
| 19 | hitsPerPage exceeds max | `hitsPerPage: 9999` | HTTP 400 | PASS |
| 20 | Negative price | `price_min: -5` | HTTP 400 | PASS |
| 21 | Page below min | `page: 0` | HTTP 400 | PASS |
| 22 | Missing publishable API key | No header | HTTP 400 | PASS |
| 23 | Invalid publishable API key | `pk_invalid_key` | HTTP 400 | PASS |

### Product Hydration

| # | Test | Verification | Status |
|---|------|-------------|--------|
| 25 | Seller data present | seller.id, seller.name, seller.handle, seller.status all populated | PASS |
| 25 | Variants with prices | variants array non-empty, prices present | PASS |
| 25 | Categories present | categories array non-empty | PASS |
| 25 | Images present | images array non-empty | PASS |

