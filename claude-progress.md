# Claude Progress -- Mercur.js

## Current Verified State

- **Repository root**: `/Users/viktorholik/Desktop/mercur`
- **Current branch**: `canary` (up to date with `origin/canary`)
- **Current version**: `2.1.2-canary.5`
- **Standard startup path**: `bun install && bun run dev`
- **Standard verification path**: `bun run build`, `bun run lint` (oxlint), `bun run test:integration:http -- <pattern>`
- **Current blocker**: none
- **Active spec**: SPEC-002 (offer management) -- foundation landed 2026-05-20 (Session 5). Session 6 (2026-05-20) added the F2 create workflow, soft-delete + offer-row update workflows, the vendor + admin offer API routes, and the first vendor integration test. Cart override and inventory-lifecycle slices still pending.

## Session Log

### Session 1: 2026-05-11 -- i18n coverage and onboarding extensibility (#919)

**Goal**: Close i18n gaps in admin + vendor, and make seller onboarding extensible.

#### Completed

- Expanded vendor `pl.json` (+425 lines) and `en.json` translation catalogs; updated translation `$schema.json`.
- Added i18n for order fulfillment, payment, summary sections, payouts, and product create/edit flows in `packages/vendor`.
- Made onboarding wizard extensible via `useOnboarding` hook and new dashboard-sdk types/plugin hook.
- Tightened admin + vendor seller validators (`packages/core/src/api/admin/sellers/validators.ts`, `packages/core/src/api/vendor/sellers/validators.ts`).
- Adjusted shared dashboard components: `country-select`, `data-grid-toggleable-number-cell`, payout columns/filters.
- Bumped dashboard-sdk, dashboard-shared, payout-stripe-connect, types, vendor packages.
- 69 files changed, +1673 / -277.

#### Verification

- Merged via PR #919 onto `canary` (commit `a15dc78f`).

### Session 2: 2026-05-12 -- canary patch fixes (canary.1 -> canary.5)

**Goal**: Ship a series of small fixes on top of the i18n PR for the canary.2 -> canary.5 releases.

#### Completed

- `b77c9ce9` fix(vendor): improve PL translations for order statuses and columns.
- `e886d5bd` fix(vendor): correct thumbnail size in order summary.
- `89370c1f` fix(admin): improve PL translations for order statuses and columns.
- `c4912156` fix(vendor): translate commission label in order summary.
- `3c4e9ac5` fix(dashboard-sdk): dedupe `i18next` and `react` in vite `resolve` to fix duplicate-instance hook errors.
- Cut version bumps: `2.1.2-canary.1` -> `2.1.2-canary.5` (chore commits `bfac174c`, `b93fa95c`, `706321fc`, `a005f1c2`, `19779278`).

#### Verification

- Each fix shipped as its own commit on `canary`. No regression report from downstream consumers as of 2026-05-15.

#### Known risks

- The dashboard-sdk dedupe fix changes Vite resolve config -- consumers with custom `vite.config` may need to merge the new resolve aliases when upgrading.

### Session 3: 2026-05-15 (in progress) -- Tooling + repo cleanup

**Goal**: Replace ESLint with oxlint, drop unused tooling/docs/tests, and rewrite CLAUDE.md as a quick-reference doc.

#### Completed (uncommitted)

- Root `package.json`: replaced `eslint` script with `oxlint`; replaced `turbo run test:integration:http` wrapper with a direct call into `integration-tests`; added `oxlint ^1.64.0`; dropped `format` and `check-types` root scripts.
- Added `.oxlintrc.json` at repo root with `typescript`, `react`, `import`, `jsx-a11y` plugins and `correctness=error / suspicious=warn / perf=warn` categories. Disabled `react/react-in-jsx-scope` (obsolete under React 17+ automatic JSX runtime).
- Switched `packages/admin/package.json` and `apps/admin-test/package.json` `lint` scripts from `eslint` to `oxlint`.
- `turbo.json`: `build` outputs now `dist/**` and `.medusa/**` (was `.next/**`); `dev` now depends on `^build`.
- Deleted unused docs: `docs/seller.md`, `docs/seller-members.md`, `docs/subscriptions.md`.
- Deleted unused tooling: `tools/template-sync/check.ts`, `tools/template-sync/config.ts`.
- Removed dead integration tests + middleware: `integration-tests/src/api/admin/meilisearch/route.ts`, `integration-tests/src/api/store/meilisearch/products/search/route.ts`, `integration-tests/src/api/middlewares.ts`; removed `test:integration:meilisearch` script from `integration-tests/package.json`.
- Deleted `AGENTS.md`.
- Rewrote `CLAUDE.md` (~284 -> ~101 lines) as a quick-reference for Claude Code with build/run commands, project structure, working rules, and the standard startup/verification path.
- Added new docs: `docs/ARCHITECTURE.md` (system + layer diagram of the Mercur plugin on top of Medusa), `docs/PRODUCT.md` (product description + audiences + feature list), `packages/core/ARCHITECTURE.md` (core plugin internals).
- `bun.lock` updated to reflect oxlint addition and eslint drop.

#### Verification run

- `bunx oxlint --quiet` (2026-05-15): **0 errors, 1190 warnings** across 4390 files (152 rules, 961ms).
- Still outstanding before this session can be considered done:
  - `bun install` after the lockfile change.
  - `bun run build` across all packages -- confirm the `turbo.json` output path change does not break caching.
  - `bun run test:integration:http -- <pattern>` on at least one suite to confirm the meilisearch test removal did not leave dangling references.
  - Triage the 1190 warnings (`suspicious` + `perf` + style) -- decide which to fix vs. silence in `.oxlintrc.json`.

#### Evidence recorded

- `git status` shows: 17 modified/deleted files + 4 new files (`.oxlintrc.json`, `docs/ARCHITECTURE.md`, `docs/PRODUCT.md`, `packages/core/ARCHITECTURE.md`).
- `git diff --stat HEAD`: 19 files changed, +138 / -1040.

#### Known risks

- **Lint coverage gap**: oxlint does not implement every ESLint rule. Some violations previously caught (e.g. custom plugin rules) may silently pass now. Spot-check the diff against prior `eslint --max-warnings 0` baseline.
- **Turbo cache invalidation**: changing `build.outputs` from `.next/**` to `dist/**, .medusa/**` will invalidate every package's build cache on first run after merge -- expect a slow first CI build.
- **`dev` now depends on `^build`**: this means `bun run dev` will block on upstream builds. Acceptable for the dashboard-sdk dedupe fix to work, but watch DX impact.
- **Removed docs are not yet replaced**: the seller/seller-members/subscriptions pages were deleted but no replacement entry was added to the docs index -- confirm `apps/docs` navigation no longer references them before publishing.

#### Next best action

1. `bun install` to refresh the lockfile cleanly.
2. Triage the 1190 oxlint warnings -- decide bulk-fix (`bunx oxlint --fix`) vs. silencing categories in `.oxlintrc.json`.
3. `bun run build` end-to-end.
4. Run one integration-test suite (e.g. `bun run test:integration:http -- product`) to confirm Jest config still resolves after the meilisearch deletions.
5. Verify `apps/docs/docs.json` does not reference the three deleted markdown files.
6. Once green, commit as one logical change set (suggested: `chore(repo): migrate from eslint to oxlint and drop unused tooling`) plus a separate docs commit for the new ARCHITECTURE/PRODUCT pages.

### Session 4: 2026-05-15 -- drop fulfillment global unique indexes (feature_list#drop-medusa-global-unique-constraints)

**Goal**: Ship the migration script that removes the three Medusa fulfillment indexes blocking multi-vendor seller onboarding.

#### Completed

- New script `packages/core/src/migration-scripts/drop-fulfillment-global-unique-indexes.ts`. Single transaction, three `DROP INDEX IF EXISTS` statements against the PG_CONNECTION knex instance. Targets: `IDX_fulfillment_set_name_unique`, `IDX_shipping_profile_name_unique`, `IDX_service_zone_name_unique`.
- Auto-discovery confirmed: Medusa's `db:migrate:scripts` (medusa/packages/medusa/src/commands/db/run-scripts.ts:52-55) walks `join(plugin.resolve, "migration-scripts")` for every loaded plugin. A plugin's `resolve` is `<pkg>/.medusa/server/src/` (medusa/packages/core/utils/src/common/get-resolved-plugins.ts:86). Run state is tracked in `script_migrations` so each script runs at most once per project; idempotency is still defended at the SQL level via `IF EXISTS`.
- New integration test `integration-tests/http/migrations/drop-fulfillment-global-unique-indexes.spec.ts` covering: index removal, idempotent re-run, two sellers creating same-named shipping profile, two sellers creating same-named fulfillment set + service zone. The test does **not** import the script directly — it instantiates `MigrationScriptsMigrator` from `@medusajs/framework/migrations` and points it at `require.resolve("@mercurjs/core/package.json") → .medusa/server/src/migration-scripts/`, which is the same discovery path Medusa uses in `db:migrate:scripts`. This proves the script is wired in via plugin auto-attach, not via test-only glue.
- Built `packages/core` via `tsc --declaration --outDir .medusa/server`; compiled output at `packages/core/.medusa/server/src/migration-scripts/drop-fulfillment-global-unique-indexes.js` is what Medusa will execute.

#### Known pre-existing build noise

- `packages/core/src/workflows/cart/steps/prepare-adjustments-from-promotion-actions.ts:126` -- `string | undefined` vs `string` mismatch. Unrelated to this feature. Pre-existing on `canary`; do not address in this change set.

#### Verification still owed before commit

- `bun run test:integration:http -- migrations/drop-fulfillment-global-unique-indexes` (needs Postgres + Redis running). Spec asserts: indexes gone, idempotent, two sellers create same-named resources successfully.
- Decide whether to also commit the Session 3 oxlint refactor in the same PR or split.

#### Evidence

- See `feature_list.json` → `drop-medusa-global-unique-constraints.evidence`.

### Session 5: 2026-05-20 -- SPEC-002 offer module foundation

**Goal**: Land the offer module skeleton + cross-module links so future
sessions can build workflows, API routes, cart overrides, and
integration tests on top.

#### Completed (uncommitted)

- `packages/types/src/modules.ts`: added `MercurModules.OFFER = "offer"`.
- New module `packages/core/src/modules/offer/`:
  - `index.ts` — registers `Module(MercurModules.OFFER, { service: OfferModuleService })`.
  - `service.ts` — `MedusaService({ Offer })` with no business methods yet.
  - `models/offer.ts` — `Offer` entity with `seller_id`, `variant_id`,
    `shipping_profile_id`, `price_set_id` text FKs; `sku`, `ean`, `upc`,
    `created_by`, `metadata`; the `(seller_id, sku)` partial unique index
    and all lookup indexes from SPEC-002 §Uniqueness.
  - `migrations/Migration20260520104835.ts` — `offer` table + indexes.
- New links in `packages/core/src/links/`:
  - `offer-variant-link.ts`, `offer-seller-link.ts`,
    `offer-shipping-profile-link.ts`, `offer-price-set-link.ts` —
    all read-only on the corresponding FK column.
  - `offer-inventory-item-link.ts` — writable many-to-many to
    `InventoryModule.linkable.inventoryItem` with
    `database.table = "offer_inventory_item"` and
    `extraColumns.required_quantity` (integer, default `"1"`).
- Spec status moved from `not_started` → `in_progress` and Evidence
  section populated with the file list and the pending-work checklist.

#### Verification

- `packages/types` `bun run build` (tsc) passes.
- `packages/core` `bun run build` (mercur codegen + tsc --declaration)
  passes.
- `bun run lint` reports the same baseline numbers as Session 3
  (55 errors / 1347 warnings) -- zero new lint hits against the new
  offer module or links.
- Full repo `bun run build` still fails at `@mercurjs/admin#build` on
  `product-variant-detail.tsx`. Last touched by commit `90248d55`,
  unrelated to this change. Tracked as a separate canary fix.

#### Known risks

- Integration tests not yet runnable: no Postgres + Redis driver
  fired in this session. The new migration must be exercised before
  the spec advances.
- Type-coverage for the offer's relations (`offer.variant`,
  `offer.price_set`, `offer.inventory_items[]`) flows through
  Medusa's Query joiner at runtime; static types for those traversals
  are not yet asserted by any test.

#### Next best action

1. Implement the F2 create workflow (the most common path): a
   `createOfferWorkflow` step group that calls
   `pricingModule.createPriceSets`, inserts the offer row with the
   resulting `price_set_id`, links `offer ↔ inventory_item` rows via
   `createLinksWorkflow`, and snapshots `variant.ean` / `variant.upc`
   onto the offer.
2. Wire vendor + admin offer API routes for create/list/retrieve.
3. Start the same-id `addToCartWorkflow` override that resolves
   `offer.price_set_id` and writes `unit_price` + `is_custom_price`.
4. Add the first integration test under
   `integration-tests/http/offer/vendor/offer.spec.ts` covering
   create + sibling-variant collision behaviour.

### Session 6: 2026-05-20 -- SPEC-002 F2 create workflow + offer API routes

**Goal**: Land the F2 create workflow + offer-row CRUD workflows, the
vendor + admin offer API routes, and the first vendor integration test
on top of the Session 5 module/link foundation.

#### Completed (uncommitted)

- `packages/core/src/workflows/offer/`:
  - `steps/create-offers.ts`, `steps/update-offers.ts`,
    `steps/delete-offers.ts` — each with a compensator.
  - `workflows/create-offers.ts` — F2 workflow:
    `useQueryGraphStep` for variant + inventory-item existence (raises
    `MedusaError.Types.NOT_FOUND` on any missing id, raises
    `MedusaError.Types.INVALID_DATA` on empty / duplicate
    `inventory_items`), Medusa's `createPriceSetsStep` for one fresh
    `PriceSet` per offer (seeded with the offer's `Price` rows),
    `createOffersStep` (offer row stamped with `price_set_id`,
    `ean`, `upc`), then `createRemoteLinkStep` writing one
    `OFFER ↔ INVENTORY` link row per attached inventory item carrying
    `required_quantity`. Emits `offer.created`. Exposes `validate` and
    `offersCreated` hooks.
  - `workflows/update-offers.ts` — `updateOffersWorkflow`: offer-row
    fields only (`sku`, `shipping_profile_id`, `metadata`).
    Emits `offer.updated`.
  - `workflows/delete-offers.ts` — `deleteOffersWorkflow`:
    soft-delete via `softDeleteOffers`; restores on compensation;
    leaves `PriceSet` + inventory links intact (per **Mutation
    contract**). Emits `offer.deleted`.
  - `index.ts` re-export.
- `packages/core/src/workflows/events.ts` — `OfferWorkflowEvents` with
  `CREATED` / `UPDATED` / `DELETED`.
- `packages/core/src/workflows/index.ts` — re-exports `./offer`.
- `packages/core/src/api/vendor/offers/`:
  - `route.ts` — `GET` (seller-scoped via
    `applySellerOfferFilter`) + `POST` (pre-checks
    `(seller_id, sku)` duplicate → `DUPLICATE_ERROR` / 409, then
    dispatches `createOffersWorkflow`; returns 201).
  - `[id]/route.ts` — `GET` / `POST` / `DELETE`, each guarded by
    `validateSellerOffer`.
  - `validators.ts`, `query-config.ts`, `middlewares.ts`,
    `helpers.ts`.
- `packages/core/src/api/admin/offers/`:
  - `GET /admin/offers` (filterable by `seller_id`, `variant_id`,
    `sku`, `ean`, `upc`) and `GET /admin/offers/:id`.
  - `validators.ts`, `query-config.ts`, `middlewares.ts`.
- Middleware wiring: `vendorOffersMiddlewares` appended to
  `packages/core/src/api/vendor/middlewares.ts`;
  `adminOffersMiddlewares` appended to the admin counterpart.
- Integration test: `integration-tests/http/offer/vendor/offer.spec.ts`
  — happy-path create, 404 on missing variant, 409 on duplicate
  `(seller_id, sku)`, two sellers share an sku independently, one
  seller creates two offers on the same variant with distinct skus
  + different `required_quantity`, 400 on duplicate
  `inventory_item_id` in the same payload, list returns only the
  caller's seller's offers, 404 cross-seller detail read, soft-delete
  hides the offer from subsequent reads.

#### Verification

- `bunx tsc --noEmit` on `packages/core`: clean.
- `bun run build` on `packages/core` (mercur codegen +
  `tsc --declaration --outDir .medusa/server`): clean.
- `bunx oxlint packages/core/src/{api,workflows}/...offers ...offer`:
  `0 errors / 16 warnings` (`no-shadow` on the standard Medusa
  `transform(input, ({ input }) => …)` idiom — the existing
  `terminate-seller.ts` workflow exhibits the same warning; it is the
  established convention, not new noise from this drop).
- Repo-wide `bun run lint` baseline: `55 errors / 1363 warnings`
  (was `55 errors / 1347 warnings` after Session 5; the +16 are
  entirely the `no-shadow` warnings on the new offer workflows
  described above — zero new errors).

#### Known risks

- Integration test not yet runnable in this session — needs
  Postgres + Redis. The workflow's runtime correctness (PriceSet seed
  + offer row + link rows in one transactional batch with
  compensators) has been type-checked but not exercised against a
  real DB.
- `req.filterableFields.seller_id` on `GET /vendor/offers` filters by
  the `offer.seller_id` column directly (no link join). Confirmed
  semantically correct because `seller_id` is a real column on the
  offer table; this matches the campaign/promotion vendor-list
  filters that go through `maybeApplyLinkFilter` only because their
  seller relation lives on a separate join table.

#### Next best action

1. Run `bun run test:integration:http -- offer/vendor/offer` against
   a real PG + Redis and address any DB-only failures (likely
   suspects: the `OFFER` linkable key on `createRemoteLinkStep`'s
   input must match Medusa's resolved link-table key; the
   `inventory_items[].inventory.location_levels.*` query path the
   spec requires for stock filter must traverse cleanly through the
   writable link).
2. Land the batch endpoints
   (`POST /vendor/offers/:id/inventory-items/batch`,
   `POST /vendor/offers/:id/prices/batch`,
   `POST /admin/offers/:id/prices/batch`) so vendors can manage their
   `Price` ladder + inventory-item links without re-creating the
   offer.
3. Start the same-id `addToCartWorkflow` override that resolves
   `offer.price_set_id` and stamps `unit_price` +
   `is_custom_price=true` on every cart line.
4. Add the `cart.LineItem ↔ Offer` link + `linkLineItemToOfferStep` +
   `mirrorLineItemOfferLinksToOrderStep` so cart→order line offer
   identity is preserved through `createOrdersStep`.

## Required Artifacts (status)

- `claude-progress.md` -- this file (updated 2026-05-15, Session 4).
- `feature_list.json` -- present at repo root. Currently tracks one feature; updated this session.
- `session-handoff.md` -- not present; not yet needed.

## Definition Of Done (reminder)

A change is done only when:

- target behavior is implemented
- `bun run build` and `bun run lint` pass
- a relevant integration test was run (for behavior changes)
- evidence is recorded in this file
- the repo remains restartable from `bun install && bun run dev`
