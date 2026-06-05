# Meilisearch Block — Testing Guide

## Overview

The Meilisearch block provides full-text product search for multi-vendor Mercur marketplaces. This document covers the test suite architecture, how to run tests, and how to extend coverage.

## Test Architecture

Tests are organized into two tiers:

### Unit Tests (`packages/registry/src/meilisearch/__tests__/`)

Unit tests run in isolation with mocked dependencies. No Meilisearch instance or database required.

| File | Coverage |
|------|----------|
| `service.unit.spec.ts` | `MeilisearchModuleService` — constructor validation, `batchUpsert`, `batchDelete`, `search`, `getStatus`, `ensureSettings` |
| `meilisearch-product.unit.spec.ts` | `filterProductsByStatus` — published/draft/deleted splitting; `findAndTransformMeilisearchProducts` — N+1 prevention (single `query.graph` call), seller field inclusion, Zod validation, options flattening |
| `store-route.unit.spec.ts` | `POST /store/meilisearch/products/search` route handler — **FR-003** seller status filter enforcement, all filter types, response shape, pagination, relevance ordering |
| `subscribers.unit.spec.ts` | All 5 subscribers — event routing, error handling (FR-012), seller suspension/unsuspension product re-indexing, chunking for >100 products |

### Integration Tests (`integration-tests/http/meilisearch/`)

Integration tests use `medusaIntegrationTestRunner` from `@medusajs/test-utils` to spin up a full Medusa server with a real database. The `meilisearch` npm package is mocked via `jest.mock()` so no running Meilisearch instance is needed.

| File | Coverage |
|------|----------|
| `store/meilisearch.spec.ts` | End-to-end store search — product hydration from DB, seller status filtering, category/price/seller filters, validation errors, publishable API key requirement |
| `admin/meilisearch.spec.ts` | Admin endpoints — `GET /admin/meilisearch` status, `POST /admin/meilisearch` sync trigger, authentication enforcement |

## Prerequisites

### Unit Tests

```bash
cd packages/registry
bun install   # installs jest, @swc/jest, meilisearch
```

### Integration Tests

```bash
cd integration-tests
bun install   # installs meilisearch + test-utils

# Requires a running PostgreSQL database
# DATABASE_URL must be set (see integration-tests/.env or .env.test)
```

## Running Tests

### Unit Tests

```bash
# Run all meilisearch unit tests
cd packages/registry
bun test

# Run a specific test file
bun test -- --testPathPattern=service

# Run with verbose output
bun test -- --verbose
```

### Integration Tests

```bash
cd integration-tests

# Run only meilisearch integration tests (sets env vars automatically)
bun run test:integration:meilisearch

# Or manually:
TEST_TYPE=integration:http \
  MEILISEARCH_HOST=http://localhost:7700 \
  MEILISEARCH_API_KEY=masterKey \
  bun jest --runInBand --forceExit --testPathPattern=meilisearch
```

The `MEILISEARCH_HOST` env var activates the meilisearch module in `medusa-config.ts`. No real Meilisearch instance is needed since the client is mocked.

## Integration Test Infrastructure

The integration tests simulate the block being "installed" in a Medusa project via pass-through files:

```
integration-tests/
  src/
    api/
      middlewares.ts                                  # registers body validation
      store/meilisearch/products/search/route.ts      # re-exports POST handler
      admin/meilisearch/route.ts                      # re-exports GET + POST handlers
  medusa-config.ts                                    # conditionally loads meilisearch module
```

These pass-through files import directly from `packages/registry/src/meilisearch/` using relative paths. This approach avoids duplicating code while simulating a real installation.

## Critical Test Scenarios

### FR-003: Suspended Seller Exclusion

The store search route **always** prepends `seller.status = "active"` to the Meilisearch filter string. This is the single enforcement point that prevents suspended-seller products from appearing in search results.

Tested in:
- `store-route.unit.spec.ts` — verifies the filter string construction directly
- `store/meilisearch.spec.ts` — verifies via HTTP integration with real middleware

### FR-012: Error Handling

All 5 subscriber handlers wrap their bodies in `try/catch`, log errors with `logger.error` including relevant entity IDs, and re-throw. Every handler has a dedicated `(FR-012)` test.

### N+1 Prevention

`findAndTransformMeilisearchProducts` includes `seller.id`, `seller.handle`, `seller.name`, `seller.status` in its initial `query.graph` call. Tested with a `toHaveBeenCalledTimes(1)` assertion to guarantee no secondary per-product seller query.

## Mocking Strategy

### Unit Tests

- **`meilisearch` npm package**: Mocked via `jest.mock('meilisearch')` at module level. Returns a mock `MeiliSearch` class whose `.index()` method returns mock `addDocuments`, `deleteDocuments`, `search`, `getStats`, `updateSettings` functions.
- **Medusa container**: Constructed via `makeContainer()` factories that return mock `resolve()` functions mapping service keys to mock objects.
- **`meilisearch-product` utilities**: Mocked in `subscribers.unit.spec.ts` to isolate subscriber logic from transformer logic.

### Integration Tests

- **`meilisearch` npm package**: Same `jest.mock('meilisearch')` approach. Since jest hoists mock declarations before imports, the mock is in place when `MeilisearchModuleService` is instantiated during Medusa server startup.
- **Database**: Real PostgreSQL via `medusaIntegrationTestRunner`. Products, sellers, and users are created in `beforeEach` hooks.

## File Structure

```
packages/registry/
  jest.config.cjs                           # Jest config for unit tests
  src/meilisearch/
    __tests__/
      service.unit.spec.ts                  # MeilisearchModuleService tests
      meilisearch-product.unit.spec.ts      # Transformer utility tests
      store-route.unit.spec.ts              # Store route handler tests
      subscribers.unit.spec.ts              # All subscriber tests
    modules/meilisearch/
      service.ts                            # MeilisearchModuleService (under test)
      types.ts                              # Types, Zod validators, events enum
      index.ts                              # Module registration
    api/
      admin/meilisearch/route.ts            # Admin GET + POST handlers
      store/meilisearch/products/search/
        route.ts                            # Store POST handler
        validators.ts                       # Zod request schema
        middlewares.ts                       # Body validation middleware
      middlewares.ts                         # Middleware re-export
    subscribers/
      meilisearch-product-events-bridge.ts  # Routes product events to internal events
      meilisearch-products-changed.ts       # Upserts/deletes products on change
      meilisearch-products-deleted.ts       # Deletes products from index
      meilisearch-seller-suspended.ts       # Re-indexes seller's products on suspend
      meilisearch-seller-unsuspended.ts     # Re-indexes seller's products on unsuspend
      utils/meilisearch-product.ts          # Product transformer + status filter
    workflows/meilisearch/
      steps/sync-meilisearch-products.ts    # Full re-index step
      workflows/sync-meilisearch.ts         # Sync workflow composition

integration-tests/
  http/meilisearch/
    store/meilisearch.spec.ts               # Store search integration tests
    admin/meilisearch.spec.ts               # Admin endpoint integration tests
  src/api/                                  # Pass-through route files
  medusa-config.ts                          # Updated with conditional meilisearch module
```

## Adding New Tests

### Adding a Unit Test

1. Create the file in `packages/registry/src/meilisearch/__tests__/` with the `.unit.spec.ts` suffix
2. Mock external dependencies (`meilisearch`, Medusa container) at module level
3. Import the module under test using relative paths
4. Run with `cd packages/registry && bun test`

### Adding an Integration Test

1. Create the file in `integration-tests/http/meilisearch/` matching the `**/http/**/*.spec.ts` pattern
2. Add `jest.mock('meilisearch', ...)` at the top of the file (hoisted before server startup)
3. Use `medusaIntegrationTestRunner` with `{ testSuite: ({ getContainer, api, dbConnection }) => { ... } }`
4. Create test data (sellers, products) in `beforeEach` using the helpers in `integration-tests/helpers/`
5. Run with `cd integration-tests && bun run test:integration:meilisearch`

### If You Add a New Subscriber or Route

- Add the subscriber pass-through file in `integration-tests/src/subscribers/` (re-export from registry)
- Add the route pass-through file in `integration-tests/src/api/` (re-export from registry)
- Ensure corresponding unit tests cover error handling (FR-012)

## CI Integration

Add these jobs to your CI pipeline:

```yaml
# Unit tests (fast, no database)
meilisearch-unit:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: oven-sh/setup-bun@v2
    - run: bun install
    - run: cd packages/registry && bun test

# Integration tests (requires PostgreSQL)
meilisearch-integration:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:16
      env:
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: medusa_test
      ports: ['5432:5432']
  steps:
    - uses: actions/checkout@v4
    - uses: oven-sh/setup-bun@v2
    - run: bun install
    - run: cd integration-tests && bun run test:integration:meilisearch
      env:
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/medusa_test
        MEILISEARCH_HOST: http://localhost:7700
        MEILISEARCH_API_KEY: masterKey
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Cannot find module 'meilisearch'` | Dependencies not installed | Run `bun install` in `packages/registry` |
| `Cannot find module '@medusajs/framework'` | Registry dependencies not linked | Run `bun install` from monorepo root |
| Integration tests hang | Database not available | Ensure PostgreSQL is running and `DATABASE_URL` is set |
| `MEILISEARCH_MODULE not found in container` | Env vars not set for integration tests | Use `bun run test:integration:meilisearch` or set `MEILISEARCH_HOST` manually |
| Tests pass locally but fail in CI | Missing `--forceExit` flag | Use `--runInBand --forceExit` flags |
