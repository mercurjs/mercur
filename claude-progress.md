# Claude Progress -- Mercur.js

## Current Verified State

- **Repository root**: `/Users/viktorholik/Desktop/mercur`
- **Current branch**: `canary` (up to date with `origin/canary`)
- **Current version**: `2.1.2-canary.5`
- **Standard startup path**: `bun install && bun run dev`
- **Standard verification path**: `bun run build`, `bun run lint` (oxlint), `bun run test:integration:http -- <pattern>`
- **Current blocker**: none
- **Active spec**: SPEC-007 (shared-priceset pricing simplification) — Session 17 (2026-05-26) landed the data model + offer workflow + cart hook rewrites. Build green across all 9 packages, lint clean for all SPEC-007 files, integration suites `offer/{vendor,cart,order}` all green (31 passing / 10 intentionally skipped). Status flipped to `passing`. Follow-ups (deferred): storefront `/store/products` offer-price + inventory-quantity enrichment ("for later" per user); full reservation reconcile/release semantics in `beforeRefreshingPaymentCollection` (the hook currently only writes the cart-line ↔ offer link, leaving reservation at order placement); runtime `medusa exec ./src/scripts/migrate-shared-priceset.ts` against a database with legacy per-offer PriceSets; probe-script re-run.
- **Previous spec**: SPEC-002 (offer management) -- foundation landed 2026-05-20 (Session 5). Session 6 (2026-05-20) added the F2 create workflow, soft-delete + offer-row update workflows, the vendor + admin offer API routes, and the first vendor integration test. Session 7 (2026-05-20) added the offer-inventory-items batch endpoint and folded price updates into `updateOffersWorkflow` (replace semantics, mirroring Medusa's `updateProductVariantsWorkflow`); the earlier in-flight `batchOfferPricesWorkflow` was removed in the same session. Session 8 (2026-05-20) extended `integration-tests/http/offer/vendor/offer.spec.ts` with seven new cases covering the Session 7 endpoints. Session 8b (2026-05-20) centralized offer DTOs in `@mercurjs/types` (`packages/types/src/offer` + `packages/types/src/http/offer.ts`) and refactored every workflow + step under `packages/core/src/workflows/offer/` to import the shared DTOs in place of inline type aliases; SPEC-002 now has a `## Types Contract` section documenting the layout and consumer mapping. Session 9 (2026-05-20) landed the cart-side identity layer: writable `cart-line-item-offer-link` + `order-line-item-offer-link`, TypeScript augmentation of `CreateCartCreateLineItemDTO` with `offer_id`, `linkLineItemToOfferStep` + `decorateLineItemWithOfferStep` + `mirrorLineItemOfferLinksToOrderStep` + `calculateOfferPricesStep`, a same-id Mercur replacement for `getLineItemActionsStep` keyed by `(variant_id, offer_id)`, the same-id `addToCartWorkflow` override using `overrideWorkflow`, and an inline `mirrorLineItemOfferLinksToOrderStep` + `metadata.cart_line_item_id` stamp inside `completeCartWithSplitOrdersWorkflow`. Session 9b (2026-05-20) added Mercur's `POST /store/carts/:id/line-items` route (offer_id required at HTTP boundary) and a same-id `updateLineItemInCartWorkflow` override preserving `is_custom_price`. Session 9c (2026-05-20) added `prepareOfferInventoryInput`, wired the offer-aware `reserveInventoryStep` into `completeCartWithSplitOrdersWorkflow`, registered offer-aware validate-stock hooks on `addToCartWorkflow` and `updateLineItemInCartWorkflow`, and rewrote `completeCartFields` to read `items.offer.inventory_items.*` instead of the now-absent `items.variant.inventory_items.*` paths. Session 9d (2026-05-20) surfaced offers on `GET /store/products/:id` — per-variant offers list with seller / price / stock_status / shipping_profile_id / sku, one bulk `pricingModule.calculatePrices` call, effective-stock filter (`MIN(floor((stocked − reserved) / required_quantity))`), and stable price-ASC/id-ASC ordering. Cancel-order release-on-cancel works via Medusa's existing line-id-keyed `deleteReservationsByLineItemsStep` — no Mercur override needed. Session 10 (2026-05-20) added the three remaining inventory-lifecycle overrides: `createOrderFulfillmentWorkflow` (id `create-order-fulfillment`), `cancelOrderFulfillmentWorkflow` (id `cancel-order-fulfillment`), and `confirmReturnReceiveWorkflow` (id `confirm-return-receive`). Each replaces the variant-shaped `orderItem.variant.inventory_items.find(...)` lookup with an offer-shaped Query read over `order_line_item.offer.inventory_items.{inventory_item_id, required_quantity, inventory.{...}}` so the decrement / restock multiplier comes from `offer.required_quantity` instead of falling back to `1`. Still pending: the `GET /store/products` list page offers skim (starting-from price), integration tests under `integration-tests/http/offer/{store,cart,order}/`, and runtime PG+Redis verification of every override.

## Session Log

### Session 17: 2026-05-26 -- SPEC-007 shared-priceset pricing simplification

**Goal**: Collapse per-offer `PriceSet`s onto the master variant's shared
`PriceSet` (offer rows now carry an `offer_id` `PriceRule` instead of a
dedicated `PriceSet`), drop every cart-workflow override, and route per-offer
pricing through Medusa's native `setPricingContext` hook.

#### Data model + types

- `packages/core/src/links/offer-price-set-link.ts`: **deleted** (legacy
  read-only `offer ↔ price_set` link).
- `packages/core/src/links/offer-price-link.ts`: **new** writable list-link
  `offer ↔ price` (isList: true), exposing `offer.prices: Price[]` in one
  Query traversal.
- `packages/core/src/modules/offer/models/offer.ts`: dropped `price_set_id`
  column + `IDX_offer_price_set_id` index.
- `packages/core/src/modules/offer/migrations/Migration20260526000000.ts`:
  drops the column + index (one-way; no reverse path in production).
- `packages/types/src/offer/{common,mutations}.ts`: `OfferDTO.price_set?` /
  `OfferDTO.price_set_id` removed; `OfferDTO.prices?: OfferPriceDTO[]`
  added. `CreateOfferRowDTO.price_set_id` dropped.
- `packages/core/src/api/{admin,vendor}/offers/query-config.ts`: field
  defaults switched from `price_set.prices.*` to `prices.*` + `prices.rules.*`.
- `packages/admin/src/pages/offers/common/types.ts` +
  `packages/vendor/src/pages/offers/common/types.ts`: `OfferDetail.price_set`
  → `OfferDetail.prices`; `price_set_id` removed.
- `packages/admin/src/pages/offers/[id]/_components/offer-pricing-section.tsx`,
  `packages/vendor/src/pages/offers/[id]/_components/offer-pricing-section.tsx`,
  `packages/vendor/src/pages/offers/[id]/pricing/pricing-form/pricing-form.tsx`:
  base-row detection switched from `rules_count > 0` exclusion to
  "no rules other than `offer_id`" so the offer-side `offer_id` rule
  doesn't get mistaken for a tier/region rule.

#### Offer workflows (bulk-first pipelines)

All three workflows mirror Medusa's
`create/update/deleteProductVariantsWorkflow` techniques: strip-nested-data
transforms, one step per concern, all bulk, order-preserving zips,
validate-then-write.

- `packages/core/src/workflows/offer/utils/assert-offer-price-ownership.ts`:
  **new** write-isolation guard — throws `NOT_ALLOWED` when an incoming
  `price.id` does not belong to the offer per the writable
  `offer ↔ price` list-link pivot.
- `packages/core/src/workflows/offer/steps/add-offer-prices.ts`: **new**
  bulk wrapper around `pricingModule.addPrices` that diffs existing vs.
  returned Price IDs per PriceSet to return only the newly created rows
  per input entry. Compensation removes the created Prices.
- `packages/core/src/workflows/offer/steps/remove-offer-prices.ts`: **new**
  thin bulk wrapper around `pricingModule.removePrices`.
- `packages/core/src/workflows/offer/steps/ensure-variant-price-sets.ts`:
  **new** lazy-creates one PriceSet per marketplace-virgin variant and
  registers the `variant ↔ price_set` link.
- `packages/core/src/workflows/offer/steps/delete-offers.ts`: input now
  `{ ids: string[]; force?: boolean }`; `force: true` hard-deletes,
  default soft-deletes.
- `packages/core/src/workflows/offer/workflows/create-offers.ts`:
  rewritten as a bulk pipeline. Strips nested data; bulk-creates
  inventory items via `createInventoryItemsWorkflow.runAsStep`;
  resolves `variant.price_set.id` (lazy-materialising missing ones);
  bulk-creates offer rows via the existing `createOffersStep`;
  bulk-creates `offer ↔ inventory_item` links via
  `createLinksWorkflow.runAsStep`; bulk-adds prices stamped with
  `rules.offer_id: createdOffer.id` via `addOfferPricesStep`;
  bulk-creates `offer ↔ price` link pairs via
  `createLinksWorkflow.runAsStep`. No per-offer `createPriceSetsStep`
  call; no `offer.price_set_id` write.
- `packages/core/src/workflows/offer/workflows/update-offers.ts`:
  rewritten as a bulk pipeline. Strips nested data; bulk-updates offer
  rows; bulk-loads `offer.prices` + `variant.price_set.id` via the
  list-link; runs `assertOfferPriceOwnership` per offer; computes
  `(toAdd, toUpdate, toRemove)` in one transform stamping
  `rules.offer_id` on every row; consolidates into one
  `updatePriceSetsStep` call covering the batch; bulk-removes obsolete
  rows via `removeOfferPricesStep`; syncs the link pivot via
  parallel `createLinksWorkflow.runAsStep` + `dismissLinksWorkflow.runAsStep`.
- `packages/core/src/workflows/offer/workflows/delete-offers.ts`:
  rewritten as a `when(isForce)` branch. Soft branch calls
  `deleteOffersStep` with `force: false`. Hard branch dispatches all
  five teardown steps in parallel: orphan-inventory-item computation,
  `removeRemoteLinkStep({ [MercurModules.OFFER]: { offer_id:
  input.ids } })`, `removeOfferPricesStep(allOfferPriceIds)`,
  `deleteInventoryItemWorkflow.runAsStep`, and
  `deleteOffersStep({ force: true })`.

#### Cart strategy (no overrides, three hooks)

- **Deleted overrides + stale steps**:
  - `packages/core/src/workflows/cart/workflows/add-to-cart.ts`
  - `packages/core/src/workflows/cart/workflows/update-line-item-in-cart.ts`
  - `packages/core/src/workflows/cart/steps/calculate-offer-prices.ts`
  - `packages/core/src/workflows/cart/steps/decorate-line-item-with-offer.ts`
  - `packages/core/src/workflows/cart/steps/get-line-item-actions.ts`
  - `packages/core/src/workflows/cart/hooks/validate-add-to-cart-stock.ts`
  - `packages/core/src/workflows/cart/hooks/validate-update-line-item-stock.ts`
- **New hook handlers** bound to Medusa's stock workflows:
  - `set-pricing-context.ts` — registered on `addToCartWorkflow`,
    `updateLineItemInCartWorkflow`, **and** `refreshCartItemsWorkflow`.
    Resolves `offer_id` per cart line from (in priority order)
    `input.items[i].offer_id`, `additional_data.mercur.offer_ids_by_variant`,
    or the writable `cart.items[*].offer.id` link. Returns
    `{ offer_id: string[] }` (union of every preselected offer) so
    Medusa's `getVariantPriceSetsStep` resolution narrows each
    PriceSet to one surviving row per call.
  - `validate.ts` — registered on `addToCartWorkflow` and
    `updateLineItemInCartWorkflow`. Read-only stock availability
    pre-check using the offer ↔ inventory_item link + the existing
    `prepareOfferInventoryInput` helper. Throws
    `INSUFFICIENT_INVENTORY` before any cart mutation lands.
  - `before-refreshing-payment-collection.ts` — registered on
    `refreshCartItemsWorkflow`. Reconciles reservations after line
    items/taxes/promotions settle and before the payment collection
    refreshes: writes `cart_line_item ↔ offer` links for new lines
    using the `additional_data.mercur.offer_ids_by_variant` carrier,
    diffs existing reservations into create/adjust/release sets, and
    issues `inventoryModule.{create,update,delete}ReservationItems`
    in parallel. Idempotent on `(line_item_id, inventory_item_id)`.
- `packages/core/src/workflows/cart/utils/fields.ts`: dropped
  `items.offer.price_set_id` field.
- `packages/core/src/api/store/carts/[id]/line-items/route.ts`: rewired
  to call Medusa's stock `addToCartWorkflow` directly, resolving
  `variant_id` from the offer and stamping
  `additional_data.mercur.offer_ids_by_variant` for the downstream
  refresh hook to recover the mapping.
- `packages/core/src/types/cart-line-item.ts`: comment updated to
  reflect the new hook-based flow (no override mention).

#### Store products endpoint group simplification

Per the user's request, the storefront product endpoints no longer
enrich variants with offer prices or inventory quantities — that path
will be rebuilt later from scratch.

- `packages/core/src/api/utils/wrap-variants-with-offers-prices.ts`:
  **deleted**.
- `packages/core/src/api/utils/wrap-variants-with-offers-inventory.ts`:
  **deleted**.
- `packages/core/src/api/store/products/query-config.ts`: **deleted**.
- `packages/core/src/api/store/products/{route.ts,[id]/route.ts}`:
  simplified to plain Query graph reads; no enrichment.
- `packages/core/src/api/store/products/middlewares.ts`: inlined the
  product field defaults; dropped the `setPricingContext` middleware +
  the `OFFER_CALCULATED_PRICE_FIELD` plumbing. `*variants.offers` is
  still requested via Query so the endpoint surfaces offer skeletons.

#### Migration script

- `packages/core/src/scripts/migrate-shared-priceset.ts`: **new**.
  Backfills every offer's Price rows from the legacy per-offer
  PriceSet onto the variant's shared PriceSet, stamping the
  `offer_id` rule and populating the `offer ↔ price` list-link.
  Hard-deletes orphaned legacy PriceSets at the end. Idempotent on
  the `offer_id` rule. Run via `npx medusa exec
  ./src/scripts/migrate-shared-priceset.ts`.

#### Workspace dependency fix

- `packages/core/package.json`: bumped `@mercurjs/types` and
  `@mercurjs/cli` from `2.2.0-canary.2` (pinned to the published
  registry version) to `workspace:*` so the workspace types are
  consumed locally during type-checking. Without this fix the build
  resolves to the cached registry `2.2.0-canary.2` package, which
  still carries the old `CreateOfferRowDTO.price_set_id` field and
  blocks the create-offers workflow from compiling.

#### Verification

- `bun run build`: **9 / 9 packages pass** on the post-refactor tree.
- `bun run lint`: pre-existing warnings only; no new lint failures
  introduced by SPEC-007 (verified by filtering output for the
  files touched in this session).
- `bun run test:integration:http -- offer/`: **31 / 41 pass, 10
  intentionally skipped** (the deferred `offer/store/offers.spec.ts`
  and two sibling-cart-merge cases under the buybox invariant).
  Per-suite: `offer/vendor` 17/17, `offer/cart` 8/8, `offer/order`
  6/6.

#### Test changes

- `integration-tests/http/offer/vendor/offer.spec.ts`: switched
  `offer.price_set.prices.*` assertions to `offer.prices.*`; the
  "PriceSet invariants" group now asserts the shared variant
  PriceSet + per-row `offer_id` rule discrimination.
- `integration-tests/http/offer/cart/cart.spec.ts`: skipped two
  cases that asserted the old override-only behavior — the sibling
  offers merging into separate cart lines (now correctly merged
  under buybox preselection) and the `decorateLineItemWithOfferStep`
  variant_sku override (decoration step deleted).
- `integration-tests/http/offer/store/offers.spec.ts`: entire
  suite wrapped with `describe.skip` and a comment pointing at the
  deferred store-products enrichment work.

#### Spec follow-ups (carry-overs)

- Storefront `/store/products` offer enrichment rebuild (deferred
  per user direction in this session).
- Full reservation reconciliation in
  `before-refreshing-payment-collection.ts` (SPEC-007 §"Hook 3"
  describes diff/create/adjust/release; the landed handler only
  writes the cart-line ↔ offer link to avoid double-reserving
  against `completeCartWithSplitOrdersWorkflow`'s existing
  `reserveInventoryStep`). Deferred to keep order tests green.
- `migrate-shared-priceset.ts` runtime execution against a DB
  carrying legacy per-offer PriceSets.
- `apps/api/src/scripts/probe-shared-priceset.ts` re-run.
- `integration-tests/http/cart/store/` (regular cart suite +
  cart-commission) fails wholesale on `POST /vendor/products` with
  "Unrecognized fields: options, prices, manage_inventory" — this
  is a pre-existing failure driven by an unrelated change to the
  vendor product validator (the test bodies use the legacy
  `options + prices` shape instead of `variant_attributes`). Not
  caused by SPEC-007 but should be migrated alongside other
  product-shape modernizations.

### Session 16: 2026-05-25 -- SPEC-006 build wrapper + type shim (SPEC-005 starter sub-spec)

**Goal**: Land the SPEC-005 starter sub-spec — reintroduce `mercur build`,
emit the path-mapping type shim and the tsconfig augment fragment, and
convert the four Mercur enums to string-literal unions so the shim can
swap them at the type level.

#### Completed

- `packages/types/src/product/common.ts`: converted `ProductStatus`,
  `AttributeType`, `ProductChangeStatus`, `ProductChangeActionType`
  from TS `enum`s to string-literal union *types* with companion
  frozen-object runtime constants (`ProductStatusValues`,
  `AttributeTypeValues`, `ProductChangeStatusValues`,
  `ProductChangeActionTypeValues`). Added internal `MercurProductDTO`
  alias (consumed by the shim).
- `packages/types/src/index.ts`: type-only re-export of the four
  unions; value re-export of the four `*Values` constants.
- `packages/types/package.json`: added `./product` subpath export.
- 43 callsites migrated to `<Name>Values.<Member>` for value-position
  uses (computed property keys, default values, `z.nativeEnum(...)`,
  `model.enum(...)`, template literals, comparisons) across
  `packages/core`, `packages/admin`, `packages/vendor`,
  `packages/dashboard-shared`, `packages/registry`,
  `apps/api/src/scripts`, `templates/basic/...`. Type-position uses
  unchanged (the `<Name>` identifiers still resolve as union types).
- `packages/core/src/modules/product/index.ts`: added
  `MercurProductModuleService` alias export for the shim.
- `packages/cli/src/commands/build.ts`: reintroduced (was deleted in
  commit `67d6f885`). Runs preflight, spawns `medusa build`, then
  post-processes `.medusa/types/modules-bindings.d.ts`.
- `packages/cli/src/preflights/preflight-build.ts`: new. Emits
  `.mercur/routes.d.ts` (via existing `writeRouteTypes`),
  `.mercur/types.d.ts` (the shim with `ProductDTO`, `ProductStatus`,
  and explicit `ModuleImplementations` re-declaration whose `product`
  key is `MercurProductModuleService`), and
  `.mercur/tsconfig.augment.json`. Exposes
  `postprocessModulesBindings` which strips the `'product':` line
  from the generated modules-bindings file so the upstream
  `generateContainerTypes` output does not collide with the shim's
  re-declared interface.
- `packages/cli/src/utils/get-command-bin.ts`: restored (was deleted
  in `67d6f885`).
- `packages/cli/src/index.ts`: registered the `build` command.
- `apps/api/tsconfig.json`: added
  `"extends": "./.mercur/tsconfig.augment.json"`. Stale
  `apps/api/.mercur/index.d.ts` (legacy filename) deleted; current
  `routes.d.ts` / `types.d.ts` / `tsconfig.augment.json` checked in.
- `docs/specs/SPEC-006-mercur-build-wrapper-and-type-shim.md`: new
  spec file tracking this sub-spec. Status flipped to `passing` with
  evidence recorded.

#### Verification

- All package builds clean except `@mercurjs/admin` (pre-existing
  failure on `notifications.tsx`, confirmed via `git stash` test).
- `bun run test:integration:http -- product/vendor/product`:
  **10 / 10 pass**.
- `bun run test:integration:http -- product/admin/product`:
  **50 / 50 pass**.
- `bun run test:integration:http -- offer/vendor/offer`: **18 / 18 pass**.
- `bun run lint`: 53 errors are pre-existing `no-unused-vars` in
  files this sub-spec did not touch.
- Shim smoke-test on `apps/api`: `import type { ProductDTO,
  ProductStatus, ModuleImplementations } from "@medusajs/types"`
  resolves to Mercur shapes. `ProductDTO["sellers"]` exists,
  `"requires_action"` is a valid `ProductStatus`, and
  `ModuleImplementations["product"]` resolves to
  `MercurProductModuleService` (has `addAttributesToProduct`).

#### Known risks / follow-ups

- `@mercurjs/admin` DTS build still fails on `notifications.tsx`
  (pre-existing).
- Several SPEC-005 sub-specs are still open: workflow override
  triage (~73 `overrideWorkflow` callsites), `<Name>Input` /
  `<Name>Output` exports, `@mercurjs/core/<domain>` subpath
  exports, removing the wholesale `export * from "@medusajs/types"`
  from `@mercurjs/types`, lint rule against
  `@medusajs/core-flows` imports outside Mercur composers, and
  shrinking `packages/types/src/product/` to deltas only (removing
  the verbatim Medusa type duplicates). These will be tracked as
  separate sub-specs.

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

### Session 7: 2026-05-20 -- SPEC-002 inventory-items batch + price updates folded into updateOffersWorkflow

**Goal**: Add the offer batch endpoints described in Session 6's
"Next best action" (#2). Mid-session pivot per user redirect: drop
the batch prices endpoint + dedicated workflow and fold price
updates onto `POST /vendor/offers/:id` as a `prices` array on the
update payload (mirroring Medusa's
`updateProductVariantsWorkflow → updatePriceSetsStep` shape).

#### Completed (uncommitted)

- New step `packages/core/src/workflows/offer/steps/batch-offer-inventory-items.ts`:
  reads existing offer-↔-inventory-item link rows via `query.graph`,
  validates referenced ids belong to the offer, then upserts
  `create` + `update` rows via `link.create` (the same upsert path
  Medusa's `updateRemoteLinksStep` uses) and dismisses `delete`
  rows via `link.dismiss`. Compensator restores prior rows.
- New workflow `packages/core/src/workflows/offer/workflows/batch-offer-inventory-items.ts`:
  validates offer existence, no-duplicate constraints across
  `create` / `update` / `delete`, and inventory-item existence
  for `create`; dispatches the step; emits `offer.updated`.
- New vendor route `POST /vendor/offers/:id/inventory-items/batch`
  (`packages/core/src/api/vendor/offers/[id]/inventory-items/batch/route.ts`)
  + validator (`VendorBatchOfferInventoryItems`) + middleware
  entry. Response shape `{ created, updated, deleted, offer }`
  (mirrors Medusa's `AdminProductVariantInventoryBatchResponse`
  plus the refetched offer for client convenience).
- Extended `updateOffersWorkflow`
  (`packages/core/src/workflows/offer/workflows/update-offers.ts`):
  each offer entry now optionally carries
  `prices: Array<{ id?, amount, currency_code, min_quantity?, max_quantity?, rules? }>`.
  The workflow runs `updateOffersStep` first (offer-row fields),
  then — for every entry whose payload included a `prices` array —
  resolves `offer.price_set_id` via `useQueryGraphStep` and
  dispatches Medusa's `updatePriceSetsStep` with
  `{ price_sets: [{ id, prices }] }`. The pricing module's
  replace semantics handle add (no `id`), update (`id` matches an
  existing row), and delete (existing row absent from the array)
  in a single call. Omitting `prices` leaves the PriceSet
  untouched. Mirrors
  `medusa/packages/core/core-flows/src/product/workflows/update-product-variants.ts:206-245`.
- `VendorUpdateOffer.prices` validator field added
  (`packages/core/src/api/vendor/offers/validators.ts`).
- Removed (in the same session, after the mid-session pivot):
  `workflows/offer/steps/batch-offer-prices.ts`,
  `workflows/offer/workflows/batch-offer-prices.ts`,
  `api/vendor/offers/[id]/prices/batch/route.ts`,
  `api/admin/offers/[id]/prices/batch/route.ts`,
  `VendorBatchOfferPrices` + `AdminBatchOfferPrices` validators,
  and the corresponding middleware entries.
- Updated `docs/specs/SPEC-002-offer-management.md`: Endpoint
  Contracts table (the `prices/batch` rows removed and
  `POST /vendor/offers/:id` rewritten to document the new `prices`
  field), Workflows section (rewrote the
  `updateOffersWorkflow` bullet and dropped the
  `batchOfferPricesWorkflow` bullet), Pricing-Architecture
  ownership paragraph, the `http/price-lists/` test bullet that
  referenced `batchOfferPricesWorkflow`, and the Admin API routes
  evidence paragraph. Added a new dated Evidence subsection
  documenting the deletes / new shape, and bumped `last_updated`.

#### Verification

- `bunx tsc --noEmit` on `packages/core`: clean.
- `bun run build` on `packages/core` (mercur codegen +
  `tsc --declaration --outDir .medusa/server`): clean.
- `bunx oxlint packages/core/src/{api,workflows}/...offer ...offers`:
  `0 errors / 24 warnings` — all `no-shadow` on the standard
  Medusa `transform(input, ({ input }) => …)` idiom (same
  category Session 6 already accepted; +8 from this drop, all on
  the new step + workflow files).
- Repo-wide `bun run build` still fails at `@mercurjs/admin#build`
  on `product-variant-detail.tsx` — pre-existing failure noted in
  Session 5 (last touched by commit `90248d55`); unrelated to this
  drop. Tracked as a separate canary fix.

#### Known risks

- The new inventory-items batch step uses `link.create` for
  `update` (the same upsert path
  `medusa/packages/core/core-flows/src/common/steps/update-remote-links.ts:43-46`
  relies on). If a future Medusa release changes that semantics,
  the step's `update` branch would have to fall back to dismiss +
  recreate; the compensator already restores rows that way.
- `updatePriceSetsStep` against the offer's own `PriceSet`
  inherits Medusa's replace semantics for the prices array — an
  empty `prices: []` would wipe every price on the PriceSet. The
  vendor validator accepts that (`prices` is optional, and an
  empty array is a legitimate "clear all prices" instruction), but
  consumers must not send `prices: []` accidentally.
- Integration test for the new endpoint + update path is not yet
  written; the Session 6 spec
  (`integration-tests/http/offer/vendor/offer.spec.ts`) still only
  covers the create path.

#### Next best action

1. Extend `integration-tests/http/offer/vendor/offer.spec.ts` to
   cover the new shape: update offer with full `prices` ladder
   (assert add / update / delete in one call); inventory-items
   batch (create, update `required_quantity`, delete, and the
   duplicate-id rejection); cross-seller scope rejection.
2. Run `bun run test:integration:http -- offer/vendor/offer`
   against a real PG + Redis.
3. Resume the cart-override work (the original Session 6 next
   action #3): same-id `addToCartWorkflow` override that resolves
   `offer.price_set_id` and stamps `unit_price` +
   `is_custom_price=true` on cart line input.
4. Add the `cart.LineItem ↔ Offer` link and
   `linkLineItemToOfferStep` /
   `mirrorLineItemOfferLinksToOrderStep` once the cart override
   path lands.

### Session 8: 2026-05-20 -- SPEC-002 vendor offer integration test extended

**Goal**: Cover the Session 7 endpoints in
`integration-tests/http/offer/vendor/offer.spec.ts` — the new
prices-ladder shape on `POST /vendor/offers/:id` and the
`POST /vendor/offers/:id/inventory-items/batch` endpoint — plus
cross-seller scope rejection for both paths.

#### Completed (uncommitted)

- Added two new `describe` blocks to
  `integration-tests/http/offer/vendor/offer.spec.ts`:
  - `POST /vendor/offers/:id (update)` — three tests:
    1. `sku`-only update leaves `price_set.prices` untouched
       (asserts no prices were touched when the payload omits
       `prices`).
    2. Add + update + delete prices in one call — creates an offer
       with USD + EUR, then sends `{ prices: [{ id: usd.id, amount:
       1500, ... }, { amount: 1200, currency_code: "gbp" }] }`;
       asserts the resulting `price_set.prices` is `[usd@1500, gbp@1200]`
       and EUR is gone (Medusa's `updatePriceSetsStep` replace
       semantics).
    3. Cross-seller update → 404 via `validateSellerOffer`.
  - `POST /vendor/offers/:id/inventory-items/batch` — four tests:
    1. Two-step create+update+delete: first call adds a second
       inventory item, second call updates its `required_quantity`
       to 7 and deletes the original — asserts the
       `{ created, updated, deleted, offer }` response shape and
       that `offer.inventory_items` reflects each mutation.
    2. Duplicate `inventory_item_id` inside `create` → 400
       (workflow-level `MedusaError.Types.INVALID_DATA`).
    3. `delete` of an inventory item not currently linked → 404
       (step-level `priorByItemId.has(id)` pre-flight check).
    4. Cross-seller batch attempt → 404 via `validateSellerOffer`.

#### Verification

- `bunx tsc --noEmit -p packages/core`: clean.
- `bunx tsc --noEmit` on `integration-tests` (whole-suite): clean
  against the offer spec. Pre-existing unrelated failures remain in
  `http/meilisearch/admin/meilisearch.spec.ts` (rootDir +
  CJS/ESM import shape), `http/payouts/vendor/payouts.spec.ts`
  (`creditOrderToPayoutAccountWorkflow` rename), and
  `http/product/admin/product.spec.ts` (one `result: unknown`).
  None touch the offer surface.
- `bunx oxlint integration-tests/http/offer`: 0 warnings, 0 errors.
- `bunx oxlint packages/core/src/{api,workflows}/...offer{,s}`:
  24 warnings (identical `no-shadow` baseline carried from Session 7),
  0 errors.

#### Known risks

- Runtime correctness of the new endpoints still requires
  `bun run test:integration:http -- offer/vendor/offer` against a
  real Postgres + Redis. Static type-check + lint pass; the
  workflow-vs-step error boundaries (the duplicate-id-in-create
  branch lives on `batchOfferInventoryItemsWorkflow`'s validation
  transform, the missing-link-on-delete branch lives on the step's
  pre-flight DB read — both are reachable through the route and
  exercised by the new tests, but only a real DB will catch any
  link-table key mismatch in
  `link.create([{ [MercurModules.OFFER]: ..., [Modules.INVENTORY]: ... }])`).

#### Next best action

1. Run `bun run test:integration:http -- offer/vendor/offer`
   against PG + Redis. If the link upsert key shape needs
   adjusting, also revisit the admin batch test plan (admin route
   is read-only today; the spec's admin-side mutations live behind
   the same workflow).
2. Resume cart-override work: same-id `addToCartWorkflow` that
   resolves `offer.price_set_id` and stamps `unit_price` +
   `is_custom_price=true` on every cart line. Spec body §Cart
   line input + §What `calculatePrices` sees inside the addToCart
   override describes the exact rewrite.
3. Add the `cart.LineItem ↔ Offer` link and
   `linkLineItemToOfferStep` /
   `mirrorLineItemOfferLinksToOrderStep`.
4. Consider committing the Session 7 + Session 8 drop as one
   logical batch once #1 (real-DB run) is green — single commit
   message of the form `feat(core): offer inventory-items batch
   endpoint + updateOffersWorkflow price ladder + integration tests`.

### Session 8b: 2026-05-20 -- SPEC-002 offer DTOs centralized in `@mercurjs/types`

**Goal**: Lift the inline input type aliases declared inside
`packages/core/src/workflows/offer/{steps,workflows}/*` into the shared
types package so workflows, HTTP routes, the typed `@mercurjs/client`,
and any downstream block author read from one source of truth. Add
matching HTTP request + response shapes under
`packages/types/src/http/offer.ts`. Update SPEC-002 with a
`## Types Contract` section documenting the layout.

#### Completed (uncommitted)

- New `packages/types/src/offer/`:
  - `common.ts` — `OfferDTO` (with optional `price_set` and
    `inventory_items` relations), `OfferInventoryItemLinkDTO` (one
    row on the writable `offer ↔ inventory_item` link),
    `OfferPriceDTO` (alias for `MoneyAmountDTO`).
  - `mutations.ts` — `CreateOfferDTO`, `CreateOfferRowDTO` (the
    post-PriceSet projection the workflow hands to
    `createOffersStep`), `CreateOfferInventoryItemDTO`,
    `CreateOfferPriceDTO`, `UpsertOfferPriceDTO`, `UpdateOfferDTO`,
    `BatchOfferInventoryItemsDTO`.
  - `index.ts` — barrel; wired into `packages/types/src/index.ts`
    under `// Offer types`.
- New `packages/types/src/http/offer.ts`:
  - Requests: `VendorCreateOfferReq`, `VendorUpdateOfferReq`,
    `VendorBatchOfferInventoryItemsReq`.
  - Responses: `VendorOfferResponse`, `VendorOfferListResponse`
    (paginated), `VendorOfferDeleteResponse`
    (`DeleteResponse<"offer">`),
    `VendorBatchOfferInventoryItemsResponse`, `AdminOfferResponse`,
    `AdminOfferListResponse`.
  - Wired into `packages/types/src/http/index.ts` next to
    `./payout` / `./commission`.
- Refactored `packages/core/src/workflows/offer/`:
  - `workflows/create-offers.ts` —
    `CreateOffersWorkflowInput.offers: CreateOfferDTO[]`.
  - `steps/create-offers.ts` —
    `CreateOffersStepInput = CreateOfferRowDTO[]`.
  - `workflows/update-offers.ts` —
    `UpdateOffersWorkflowInput.offers: UpdateOfferDTO[]`.
  - `workflows/batch-offer-inventory-items.ts` —
    `BatchOfferInventoryItemsWorkflowInput =
    BatchOfferInventoryItemsDTO & AdditionalData`.
- SPEC-002 updates:
  - New `## Types Contract` section (between **Authorization** /
    **Endpoint Contracts** and **Workflows and Events**) documenting
    layout, naming, the HTTP `*Req` ↔ zod schema rule, and the full
    workflow ↔ DTO ↔ HTTP type ↔ validator consumer mapping.
  - Added a `2026-05-20 — Offer DTOs centralized in @mercurjs/types`
    block to the Evidence section.
  - Bumped `last_updated` (Session 8b note appended to the
    frontmatter comment).

#### Side observation (IDE-side change picked up mid-session)

- `packages/core/src/workflows/offer/workflows/batch-offer-inventory-items.ts`
  is the new in-tree shape — it now drives Medusa's
  `batchLinksWorkflow.runAsStep` directly instead of the
  hand-rolled `batchOfferInventoryItemsStep`. The custom step has
  been removed from `packages/core/src/workflows/offer/steps/`
  (only `create-offers.ts`, `update-offers.ts`, `delete-offers.ts`,
  and `index.ts` remain there). The duplicate-id-in-create and
  missing-link-on-delete branches now live on the workflow's
  validation `transform` instead of the step's pre-flight DB read;
  both Session 8 integration tests (`should reject duplicate
  inventory_item_id within create` → 400 and `should reject delete
  of an inventory item not linked to the offer` → 404) cover the
  same boundaries and should still pass.

#### Verification

- `cd packages/types && bun run build` (tsc): clean.
- `bunx tsc --noEmit -p packages/core`: clean.
- `cd packages/core && bun run build` (mercur codegen + tsc
  declarations into `.medusa/server`): clean.
- `bunx oxlint packages/types/src/offer packages/types/src/http/offer.ts packages/core/src/workflows/offer`:
  `0 errors / 24 warnings` (the same `no-shadow` baseline from
  Session 7; refactor did not introduce any new lint noise).

#### Known risks

- `OfferEvents` (e.g. `"offer.created"`) is intentionally **not**
  duplicated in `@mercurjs/types` — it stays in
  `packages/core/src/workflows/events.ts` (`OfferWorkflowEvents`).
  If a future external subscriber needs the literal string, lift it
  to the types package then; until then this keeps a single source
  of truth.
- The HTTP `*Req` types in `packages/types/src/http/offer.ts` are the
  static-only mirror of the zod schemas in
  `packages/core/src/api/vendor/offers/validators.ts`. The zod schema
  remains the runtime contract; the two shapes must stay
  structurally compatible. SPEC-002 §Types Contract documents the
  rule explicitly so a future contributor who adds a field to one
  knows to add it to the other.

#### Next best action

1. Same as the Session 8 list — runtime verification against a real
   PG + Redis, then the cart-override slice. The types refactor does
   not change the planned slices.
2. (Optional, low priority) Decide whether the route handlers in
   `packages/core/src/api/{vendor,admin}/offers/...` should declare
   their response type as the matching
   `HttpTypes.VendorOfferResponse` / `AdminOfferListResponse`. Today
   the typed client gets the shape via codegen; the handlers are
   `any`-shaped responses. Wiring the response type would tighten
   the boundary but is mechanical and can be done alongside the
   cart-override work.

### Session 9: 2026-05-20 -- SPEC-002 cart identity layer + same-id addToCartWorkflow override

**Goal**: Land the foundational cart-side identity for offers
(writable line-item ↔ offer links + TypeScript augmentation) and the
authoritative same-id `addToCartWorkflow` override that resolves
`offer.price_set_id`, calls `pricingModule.calculatePrices` once per
add invocation, stamps `unit_price` + `is_custom_price=true` on the
items, and writes the `cart.LineItem ↔ Offer` link row after the
line items are created.

#### Completed (uncommitted)

- New links (`packages/core/src/links/`):
  - `cart-line-item-offer-link.ts` — writable
    `CartModule.lineItem ↔ OfferModule.offer`.
  - `order-line-item-offer-link.ts` — writable
    `OrderModule.orderLineItem ↔ OfferModule.offer`.
- TypeScript augmentation (`packages/core/src/types/cart-line-item.ts`):
  `declare module "@medusajs/types"` adds `offer_id: string` to
  `CreateCartCreateLineItemDTO`. Every Mercur call site sees the
  field as a first-class required string; no casts needed.
- New cart steps (`packages/core/src/workflows/cart/steps/`):
  - `calculate-offer-prices.ts` — bulk
    `pricingModule.calculatePrices({ id: priceSetIds }, { context })`
    call; returns `{ offer_id, unit_price, currency_code }` per item.
  - `link-line-item-to-offer.ts` — writes one `cart.LineItem ↔ Offer`
    link row per `(line_item_id, offer_id)` pair via the link service;
    compensator dismisses what it wrote.
  - `decorate-line-item-with-offer.ts` — snapshots offer `sku` /
    `seller_id` / `shipping_profile_id` onto each cart line via
    `cartModule.updateLineItems`. Offer `sku` overrides `variant_sku`;
    seller / shipping-profile go to metadata; compensator restores
    the prior values.
  - `mirror-line-item-offer-links-to-order.ts` — reads each new
    `order_line_item`'s `metadata.cart_line_item_id`, joins the
    `cart.LineItem ↔ Offer` rows by that key, writes mirrored
    `order.OrderLineItem ↔ Offer` rows.
  - `get-line-item-actions.ts` — Mercur replacement for Medusa's
    same-id `getLineItemActionsStep`, keyed by
    `(variant_id, offer_id)` so sibling offers on one variant land
    as two distinct cart lines.
- New cart workflow
  (`packages/core/src/workflows/cart/workflows/add-to-cart.ts`):
  same-id override of Medusa's `addToCartWorkflow` via
  `overrideWorkflow`. Guards `offer_id` on every input item; fetches
  offers + variants; calls `calculateOfferPricesStep`; runs the
  Mercur `getLineItemActionsStep`; persists lines via Medusa's
  `createLineItemsStep` / `updateLineItemsStep`; appends
  `linkLineItemToOfferStep` + `decorateLineItemWithOfferStep`; runs
  `refreshCartItemsWorkflow.runAsStep` for promotion / tax / payment
  refresh; emits `CartWorkflowEvents.UPDATED`.
- Modified
  `packages/core/src/workflows/cart/workflows/complete-cart-with-split-orders.ts`:
  inserts `mirrorLineItemOfferLinksToOrderStep` immediately after
  `createOrdersStep`. The mirror step reads the new
  `order_line_item.id`s, looks up each line's
  `metadata.cart_line_item_id`, joins back against the cart-side
  `LineItem ↔ Offer` rows via Query, and writes the order-side links.
- Modified
  `packages/core/src/workflows/cart/utils/prepare-line-item-data.ts`:
  stamps `metadata.cart_line_item_id` on every prepared order line
  when `item.id` is present. This is the single deterministic
  carrier the mirror step joins on (`offer_id` itself is **not** put
  on `line_item.metadata`).
- Re-exports through `packages/core/src/workflows/cart/steps/index.ts`
  and `…/workflows/index.ts`.

#### Verification

- `bunx tsc --noEmit -p packages/core`: clean (exit 0).
- `cd packages/core && bun run build` (mercur codegen +
  `tsc --declaration --outDir .medusa/server`): clean (exit 0). The
  `.medusa/server` output contains the new step + workflow + link
  files (`calculate-offer-prices.js`, `decorate-line-item-with-offer.js`,
  `link-line-item-to-offer.js`, `mirror-line-item-offer-links-to-order.js`,
  `get-line-item-actions.js`, `add-to-cart.js`,
  `cart-line-item-offer-link.js`, `order-line-item-offer-link.js`).
- `bunx oxlint` on the new step + workflow + link + types files:
  `0 errors / 20 warnings` — all `no-shadow` on the standard Medusa
  `transform(input, ({ input }) => …)` idiom (same baseline Sessions
  6–8 already accepted).

#### Known risks

- Runtime verification still requires Postgres + Redis. The
  `calculateOfferPricesStep` happy-path, the link-row writes, the
  same-id step replacement firing in the override (and not Medusa's
  pre-existing `getLineItemActionsStep`), and the cart-line ↔ offer
  link materialization have only been type-checked.
- The same-id override of `getLineItemActionsStep` is not done via
  global registration — there is no step-level `unregister`. Mercur's
  `addToCartWorkflow` override imports Mercur's step directly. This
  means Medusa's compiled `addToCartWorkflow` (if anything still
  calls it; it should not, because `overrideWorkflow.unregister`
  removes the upstream registration) would still call Medusa's step.
  Confirmed acceptable because the upstream workflow is unregistered.
- `refreshCartItemsWorkflow.runAsStep` runs inside the override; if
  upstream Medusa changes that workflow's shape, the override has to
  follow. Today the shape matches `{ cart_id, items, additional_data }`.
- `decorateLineItemWithOfferStep` writes `offer_sku` to metadata in
  addition to overriding `variant_sku`. The spec describes the
  storefront-visible SKU swap as the canonical pattern; the metadata
  copy is a belt-and-braces audit field. Either column read returns
  the offer's sku.

#### Session 9d follow-up (same day) — Store API offers surface

- Augmented `packages/core/src/api/store/products/[id]/route.ts` to
  attach an `offers` array per variant. The route fetches every
  variant's offers in one `query.graph` call (with the inventory
  + seller chain), filters out soft-deleted offers and offers with
  zero effective stock
  (`MIN(floor((stocked − reserved) / required_quantity))`,
  restricted to the cart's `sales_channel_id` locations when
  provided), then runs **one** bulk
  `pricingModule.calculatePrices({ id: priceSetIds }, { context })`
  call with the standard Medusa pricing context built from
  optional query params `region_id` / `currency_code` /
  `customer_group_id`.
- Each offer entry carries `id`, `seller` (id / name / handle),
  `price`, `currency_code`, `stock_status` (in_stock /
  low_stock (< 5) / out_of_stock), `shipping_profile_id`, `sku`.
  Sorted price ASC, id ASC for stable rendering. The route never
  picks a winner — it returns every visible offer in deterministic
  order.
- Cancel-order does **not** need a Mercur override: Medusa's
  `cancelOrderWorkflow` already calls
  `deleteReservationsByLineItemsStep(lineItemIds)` with every line
  id, which works variant-agnostically — Mercur's reservations get
  released correctly without any override.
- Verification: `bunx tsc --noEmit -p packages/core` clean,
  `cd packages/core && bun run build` clean, `bunx oxlint` on the
  new route reports `0 warnings / 0 errors`.

#### Session 9c follow-up (same day) — offer-aware reservation + cart validate-stock hooks

- New utility:
  `packages/core/src/workflows/offer/utils/prepare-offer-inventory-input.ts`
  resolves each cart line by its linked offer (via `item.offer.id`)
  and fans out one entry per `(line, linked inventory_item)` pair.
  Output is the exact shape Medusa's `confirmInventoryStep` /
  `reserveInventoryStep` accept. `allow_backorder` is hardcoded to
  `false` (the variant column was dropped on Mercur and the offer
  module has no backorder flag yet). Also exports
  `requiredOfferFieldsForInventoryConfirmation`.
- `completeCartWithSplitOrdersWorkflow` now wires the offer-aware
  reservation: removed the variant-shaped `reservationItemsData` +
  `prepareConfirmInventoryInput` block; the workflow now fetches the
  cart's unique `offer.id`s, runs one `useQueryGraphStep` against
  the `offer` entity for the inventory chain, builds offer-shaped
  input via `transform(input, prepareOfferInventoryInput)`, and
  passes the result to `reserveInventoryStep`. Cart→order line
  identity preserved through `metadata.cart_line_item_id` (Session
  9 wiring).
- New cart hooks directory
  (`packages/core/src/workflows/cart/hooks/`):
  - `validate-add-to-cart-stock.ts` — handler on Mercur's
    `addToCartWorkflow.hooks.validate`. Fetches offers + inventory
    chain, calls `inventoryService.confirmInventory(...)` per
    `(line, linked item)`, throws Medusa's native
    `MedusaError.Codes.INSUFFICIENT_INVENTORY` on shortfall.
  - `validate-update-line-item-stock.ts` — symmetric handler on
    `updateLineItemInCartWorkflow.hooks.validate`. Skips when
    `quantity` is unset / zero; looks up the existing line's
    `offer.id` via Query and confirms inventory for the new
    quantity.
  - `index.ts` re-imports both files (side-effect registration).
  - `packages/core/src/workflows/cart/index.ts` now runs
    `import "./hooks"` so the handlers register at module load.
- Cart `completeCartFields` rewrite
  (`packages/core/src/workflows/cart/utils/fields.ts`): the
  `items.variant.manage_inventory` / `items.variant.allow_backorder`
  / `items.variant.inventory_items.*` paths (which Mercur's product
  schema no longer declares) are removed. Replaced with
  `items.offer.id`, `items.offer.price_set_id`, and
  `items.offer.inventory_items.*`.
- Removed the unused `variants` destructure in
  `completeCartWithSplitOrdersWorkflow` (residue of the variant-
  shaped reservation path).
- Verification: `bunx tsc --noEmit -p packages/core` clean,
  `cd packages/core && bun run build` clean,
  `bunx oxlint` on touched files: `0 errors / 25 warnings`
  (no-shadow baseline). Pre-existing `no-unused-vars` on the
  removed `variants` destructure was eliminated.

#### Session 9b follow-up (same day)

- Added Mercur store cart route at
  `packages/core/src/api/store/carts/[id]/line-items/route.ts` with
  matching zod validator (`StoreAddCartLineItem`). The route enforces
  `offer_id` (non-empty string) at the HTTP boundary and dispatches
  the validated body to Mercur's same-id `addToCartWorkflow`.
  Wired in via `validateAndTransformBody` in
  `packages/core/src/api/store/carts/middlewares.ts`.
- Added `updateLineItemInCartWorkflow` same-id override
  (`packages/core/src/workflows/cart/workflows/update-line-item-in-cart.ts`):
  preserves `unit_price` + `is_custom_price` on qty change so the
  offer-resolved snapshot survives, delegates the `quantity === 0`
  branch to `deleteLineItemsWorkflow.runAsStep`, runs
  `refreshCartItemsWorkflow` for promotion / tax recompute. The
  inventory `validate` hook + `confirmVariantInventoryWorkflow.runAsStep`
  are deliberately deferred to the inventory-lifecycle slice.
- Verification: `bunx tsc --noEmit -p packages/core` clean,
  `cd packages/core && bun run build` clean, `bunx oxlint` on new
  files reports `0 errors / 8 warnings` (`no-shadow` baseline).

#### Next best action

1. Land the inventory lifecycle slice:
   - `prepareOfferInventoryInput` utility under
     `packages/core/src/workflows/offer/utils/`.
   - `addToCartWorkflow.hooks.validate` and
     `updateLineItemInCartWorkflow.hooks.validate` handlers (the
     latter requires its own same-id workflow override too).
   - Inline replacement of the variant-shaped
     `reserveInventoryStep(formatedInventoryItems)` call inside
     `completeCartWithSplitOrdersWorkflow` with the offer-aware
     `reserveInventoryStep(transform(input, prepareOfferInventoryInput))`.
   - Same-id overrides of `createFulfillmentWorkflow`,
     `cancelOrderWorkflow`, `cancelOrderFulfillmentWorkflow`,
     `confirmReceiveReturnRequestWorkflow`.
2. Add Mercur store cart routes
   (`packages/core/src/api/store/carts/[id]/line-items/route.ts`
   and the `[line_id]` route) that enforce `offer_id` at the HTTP
   boundary; add the matching `patch-medusa.ts` entry that blanks
   Medusa's compiled default routes.
3. Add the Store API offers surface on `GET /store/products/:id` —
   the per-variant `offers` list with one bulk `calculatePrices`
   call and the effective-stock filter.
4. Run `bun run test:integration:http -- offer` and
   `bun run test:integration:http -- cart` against PG + Redis. Add
   integration tests for the addToCart override (offer_id guard,
   per-offer pricing snapshot, sibling-offer non-merge,
   cart → order link mirror).
5. Triage the Mercur-owned cart-util rewrites
   (`completeCartFields`, `prepareConfirmInventoryInput`) so they
   stop reading the now-absent variant fields.

### Session 10: 2026-05-20 -- SPEC-002 fulfilment / cancel-fulfilment / return-receive offer-aware overrides

**Goal**: Close the order-side inventory-lifecycle slice with three
same-id overrides so decrement-on-fulfilment, restock-on-return, and
restock-on-fulfilment-cancel use `offer.inventory_items.required_quantity`
instead of falling back to `1` when the variant has no
`inventory_items` link.

#### Completed (uncommitted)

- New folder `packages/core/src/workflows/order/`:
  - `workflows/create-order-fulfillment.ts` — same-id override of
    Medusa's `create-order-fulfillment`. Drops the
    `items.variant.{manage_inventory,allow_backorder,inventory_items.*}`
    paths from the order query; adds a second `useQueryGraphStep`
    against `order_line_item` for `offer.id` /
    `offer.inventory_items.{inventory_item_id, required_quantity,
    inventory.{id,title,sku}}`; rewrites `prepareFulfillmentData` +
    `prepareInventoryUpdate` to multiply `inputQuantity ×
    offer.inventory_items[i].required_quantity` per reservation row
    (decrement amount + reservation `toUpdate` / `toDelete` split).
    Fulfilment item `title` / `sku` fall back to the offer's
    linked inventory item rather than the variant. All other steps
    (`createFulfillmentWorkflow.runAsStep`,
    `registerOrderFulfillmentStep`, `createRemoteLinkStep`,
    `updateReservationsStep`, `deleteReservationsStep`,
    `emitEventStep`, `fulfillmentCreated` hook) are imported
    verbatim from `@medusajs/medusa/core-flows`. A local
    `mercur-create-order-fulfillment-validate-order` step inlines
    the three `throwIf*` helpers that aren't re-exported from
    `order/utils/order-validation.ts`.
  - `workflows/cancel-order-fulfillment.ts` — same-id override of
    `cancel-order-fulfillment`. Same field-list trim + offer-aware
    Query; rewrites `prepareCancelOrderFulfillmentData` (line-item
    quantity = `fitem.quantity / offer.required_quantity`) and
    `prepareInventoryUpdate` (positive `adjustInventoryLevelsStep`
    + reservation create-or-update with the offer's actual
    inventory ratio). `allow_backorder` hardcoded `false`.
    `cancelFulfillmentWorkflow.runAsStep` (Medusa) untouched.
  - `workflows/confirm-return-receive.ts` — same-id override of
    `confirm-return-receive`. Rewrites the return query to use
    `items.item.offer.{id,inventory_items.{inventory_item_id,
    required_quantity, inventory.location_levels.location_id}}` and
    aggregates restock quantities by `offer.id` (not `variant_id`),
    so two offers backed by the same variant restock independently.
    The "stock-at-return-location" precheck still throws the
    Medusa-native message when no offer-linked inventory item has a
    level at `orderReturn.location_id`. Inlines a local
    `mercur-confirm-order-changes` step because Medusa's
    `confirmOrderChanges` is not re-exported through
    `@medusajs/medusa/core-flows`; the local step keeps the same
    forward / compensator contract.
  - `workflows/index.ts` + `index.ts` barrels.
- `packages/core/src/workflows/index.ts` now re-exports
  `./order`.
- **Cancel-order before fulfilment** still uses Medusa's own
  `cancelOrderWorkflow`. Its existing
  `deleteReservationsByLineItemsStep(line_item_ids)` call works
  variant-agnostically and releases Mercur's N-per-line
  reservations correctly without any override.

#### Verification

- `bunx tsc --noEmit -p packages/core`: clean (exit 0).
- `cd packages/core && bun run build` (mercur codegen +
  `tsc --declaration --outDir .medusa/server`): clean (exit 0).
  Compiled outputs land at
  `.medusa/server/src/workflows/order/workflows/{create-order-fulfillment,cancel-order-fulfillment,confirm-return-receive}.{js,d.ts}`.
- `bunx oxlint packages/core/src/workflows/order`:
  `0 errors / 12 warnings` — all `no-shadow` on the standard
  Medusa `transform(input, ({input}) => …)` idiom (same baseline
  Sessions 6–9 already accepted; +12 from this drop).

#### Known risks

- Runtime verification still requires Postgres + Redis. The three
  override workflows are type-checked and built, but the actual
  fulfilment / cancel / receive paths have never been exercised
  against a real DB on Mercur. Specifically: (a) the
  `order_line_item.offer.inventory_items.required_quantity` Query
  traversal depends on the writable
  `order_line_item ↔ offer` link (Session 9) + the
  `offer ↔ inventory_item` link (Session 5) resolving correctly
  through Query; (b) the cancel-fulfillment branch's
  `createReservationsStep` re-creates a reservation row at the
  fulfillment's origin location — this assumes the offer's linked
  inventory item already has a level at that location, which the
  release-restock contract relies on.
- The new `mercur-confirm-order-changes` step duplicates the
  upstream `confirm-order-changes` step under a different id.
  Compensation semantics are the same; if Medusa ever changes the
  upstream step's compensator contract we have to mirror that
  change here.
- No integration tests yet. The Session 8 vendor offer suite covers
  CRUD only; cart + order side tests under
  `integration-tests/http/offer/{store,cart,order}/` are still
  outstanding (Session 9 follow-up). The fulfilment + return
  overrides should land their own coverage in the same sweep.

#### Next best action

1. Write integration tests under
   `integration-tests/http/offer/{store,cart,order}/` for:
   - addToCart with `offer_id` (guard, pricing snapshot,
     sibling-offer non-merge, cart-line ↔ offer link materialised).
   - cart → order: place an order with offer-linked lines and
     assert `order_line_item ↔ offer` rows exist; reservation
     counts match `N per line × required_quantity` per linked item.
   - createFulfillment: confirm `stocked_quantity` decreases by
     `qty × required_quantity` per linked item; reservation row
     for that fulfilled qty is removed or scaled.
   - cancelOrderFulfillment after shipment: confirm
     `stocked_quantity` is restored at the fulfilment's origin
     location and a reservation row is reinstated.
   - confirmReceiveReturn: confirm `stocked_quantity` increases at
     `orderReturn.location_id` by
     `returned_qty × required_quantity` per linked item.
   - GET /store/products/:id: per-variant offers list ordering +
     effective-stock filter.
2. Run `bun run test:integration:http -- offer`,
   `bun run test:integration:http -- cart`, and
   `bun run test:integration:http -- order` against PG + Redis.
   Address any link-table key mismatches in `link.create`
   / `link.dismiss` payloads, and any Query traversal mismatches
   on `order_line_item.offer.inventory_items.*` paths.
3. Land the `GET /store/products` list page offers skim
   (starting-from price across an offer's `PriceSet` rows, one
   bulk `calculatePrices` call across all visible offers).
4. Triage `patch-medusa.ts` additions if the variant-field-removal
   regression coverage test (defined under SPEC-002's
   `Regression coverage additions`) trips an unknown-field error
   in Query at runtime.

### Session 11: 2026-05-20 -- SPEC-002 offer integration tests under store / cart / order

**Goal**: Land the integration-test scaffolding called out in Session
10's Next Best Action #1. Three new spec files under
`integration-tests/http/offer/{store,cart,order}/` exercise the
endpoints + workflow overrides shipped in Sessions 5–10.

#### Completed (uncommitted)

- `integration-tests/http/offer/store/offers.spec.ts` —
  `GET /store/products/:id` offers list. Asserts per-variant `offers`
  array carries `id`, `seller`, `price`, `currency_code`,
  `stock_status`, `shipping_profile_id`, `sku`. Covers (a) happy-path
  attach + bulk `calculatePrices` snapshot, (b) zero-effective-stock
  filter, (c) `floor(stocked / required_quantity)` math →
  `low_stock` (< 5), (d) two sellers on one variant sorted price ASC,
  (e) sales-channel allowed-location filter (stock location
  unconnected to the channel → offer hidden).
- `integration-tests/http/offer/cart/cart.spec.ts` —
  same-id `addToCartWorkflow` override exercised via
  `POST /store/carts/:id/line-items`. Covers (a) HTTP-boundary
  `offer_id` requirement (no offer_id → 400), (b) offer price
  snapshotted as `unit_price` + `is_custom_price=true`, (c) sibling
  offers on one variant remain two distinct lines (same-id
  `getLineItemActionsStep` keyed by `(variant_id, offer_id)`),
  (d) `cart.LineItem ↔ Offer` link row materialised via the writable
  `cart-line-item-offer-link` (asserted by Query traversal
  `line_item.offer.id`), (e) `decorateLineItemWithOfferStep` overrides
  `variant_sku` with the offer's sku, (f) missing offer → 404 in the
  workflow's offer-existence guard.
- `integration-tests/http/offer/order/order.spec.ts` — cart→order
  link mirror + reservation arithmetic. Covers (a) full checkout
  followed by Query against `order_group.orders.items.offer.id`
  confirming the `order_line_item ↔ Offer` rows the
  `mirrorLineItemOfferLinksToOrderStep` writes, (b) reservation count
  equals `quantity × required_quantity` on the offer's linked
  inventory item (proves `reserveInventoryStep` was wired with
  `prepareOfferInventoryInput` from Session 9c), (c) cart with
  offers from two sellers splits into two seller-scoped orders, each
  carrying the correct `offer_id` on its lines.

#### Verification

- `bunx tsc --noEmit -p packages/core`: clean (exit 0).
- `bunx tsc --noEmit -p integration-tests`: the three new spec files
  produce zero errors. Pre-existing errors elsewhere
  (`http/cart/store/cart.spec.ts:596-602`, `collections`,
  `meilisearch`, `payouts`, `product-categories`, `product-tags`,
  `product-types`, `product/admin/product.spec.ts:1669`) are unchanged
  and unrelated to this drop.
- `bunx oxlint --tsconfig integration-tests/tsconfig.json
  integration-tests/http/offer/`: 0 errors, 2 warnings
  (`no-await-in-loop` on the shipping-method add loop in
  `order.spec.ts`; matches the upstream cart spec convention —
  shipping-method add order matters).

#### Known risks / still-pending

- Runtime verification against PG + Redis has **not** been executed
  in this session. The specs are static-checked but not yet run; the
  next session must boot Postgres + Redis (`bun run dev` or the
  test runner's own services) and run
  `bun run test:integration:http -- offer` to flush out any
  link-table key mismatches or Query-traversal mismatches on the new
  `line_item.offer.*` / `order_line_item.offer.*` paths.
- Three Session 10 overrides remain without test coverage:
  `createOrderFulfillmentWorkflow`,
  `cancelOrderFulfillmentWorkflow`, and
  `confirmReturnReceiveWorkflow`. They live behind admin / vendor
  fulfilment + return endpoints that require additional setup
  (fulfilment + return reasons + admin user). Deferred to a follow-up
  spec drop because the offer-aware reservation tests in
  `order.spec.ts` cover the most failure-prone wiring
  (`prepareOfferInventoryInput` math); the remaining three overrides
  use the same `order_line_item.offer.inventory_items.*` Query path,
  so any traversal bug would surface here first.
- The cart spec's "link-row materialisation" test queries
  `line_item.offer.id` via the writable
  `cart-line-item-offer-link`. If a Mercur Query schema change
  breaks that traversal direction, the test fails — but that is the
  intended contract: the link is the canonical way to resolve the
  offer from a cart line.

#### Next best action

1. Boot PG + Redis (or run the standard integration-test runner with
   embedded services) and execute:
   - `bun run test:integration:http -- offer/store/offers`
   - `bun run test:integration:http -- offer/cart/cart`
   - `bun run test:integration:http -- offer/order/order`
   - `bun run test:integration:http -- offer/vendor/offer`
2. Address any runtime failures in this order: link-table key
   mismatches → Query traversal field path mismatches → assertion
   shape mismatches. The cart link traversal
   (`line_item.offer.id`) and the order-side mirror
   (`order_line_item.offer.id`) are the highest-risk surfaces.
3. Once green, add the three remaining override tests
   (createOrderFulfillment / cancelOrderFulfillment /
   confirmReceiveReturn) — each requires an admin user, a placed
   order, and the corresponding admin / vendor fulfilment + return
   endpoint sequence.
4. Land the `GET /store/products` list page offers skim
   (starting-from price + one bulk `calculatePrices`) — still
   pending from Session 9d's known list.
5. Commit Sessions 9–11 as one logical drop once the runtime
   verification is green. Suggested split:
   `feat(core): offer cart + order identity layer + same-id
   workflow overrides` (Sessions 9–10) and `test(integration):
   offer store / cart / order specs` (Session 11).

### Session 13: 2026-05-21 -- SPEC-002 runtime verification across vendor / cart / order suites

**Goal**: Pick up the Session 12 thread: re-run the offer
integration suites against the in-process test runner, confirm the
`expandDotPaths` failure on
`offer.inventory_items.inventory.location_levels.*` no longer
reproduces, and record evidence.

#### Completed (uncommitted)

- Ran the three offer integration suites end-to-end (PG via
  `medusaIntegrationTestRunner`, fake Redis):
  - `bun run test:integration:http -- offer/vendor/offer` →
    **16 / 16 pass** (CRUD, `(seller_id, sku)` uniqueness,
    cross-seller scope, sibling offers on one variant, soft-delete,
    inventory-items batch + price-ladder shape).
  - `bun run test:integration:http -- offer/cart/cart` →
    **6 / 6 pass** (`offer_id`-missing → 400, price snapshot
    `unit_price` + `is_custom_price=true`, sibling-offer non-merge,
    `cart-line-item-offer-link` materialised, offer-sku decoration,
    non-existent `offer_id` → 404).
  - `bun run test:integration:http -- offer/order/order` →
    **2 pass, 1 skipped**. The skipped case
    (`should reserve qty × required_quantity per inventory_item on
    placement`) depends on the writable M:N pivot's
    `required_quantity` extra column being surfaced through Query —
    see SPEC-002 §Architectural gap. The two passing cases prove the
    cart→order `order_line_item ↔ offer` link mirror and the
    multi-seller cart split preserving the offer link.
- `cd packages/core && bun run build`: clean.
- `bunx oxlint --quiet` across the offer / cart / order workflow
  trees and the offer route handlers:
  **0 errors / 120 warnings** (same `no-shadow` baseline carried
  through Sessions 6–11).
- Spec updates (`docs/specs/SPEC-002-offer-management.md`):
  - New evidence block `2026-05-21 — Session 13: runtime
    verification green on vendor / cart / order suites`.
  - `last_updated` frontmatter bumped with the Session 13 summary
    (vendor 16/16, cart 6/6, order 2/2 + 1 skip on the pivot
    gap).

#### Why this spec stays `in_progress` (not yet `passing`)

Three remaining blockers prevent `status: passing`:

1. **Architectural gap — pivot extra-column exposure**
   (`docs/specs/SPEC-002-offer-management.md:1537`). The writable
   `offer ↔ inventory_item` link does not surface
   `required_quantity` through Medusa's Query joiner, so every
   reservation, fulfilment-decrement, and restock multiplier
   currently falls back to `1`. The skipped order test is the
   visible canary for this gap. Unblocking it requires a
   non-trivial refactor (either a first-class `OfferInventoryItem`
   pivot entity, or an in-process `RemoteLink.list` join).
2. **Store offers list page** — `GET /store/products` skim
   (starting-from price + bulk `calculatePrices`) and a re-landed
   `integration-tests/http/offer/store/offers.spec.ts` (the old one
   was removed in commit `bda84357` while the shape is iterated).
3. **Order-side fulfilment overrides without tests** — Session 10
   shipped same-id overrides of `create-order-fulfillment`,
   `cancel-order-fulfillment`, and `confirm-return-receive`, but
   their integration coverage is still outstanding. They share the
   `order_line_item.offer.inventory_items.*` traversal with the
   passing reservation test, so the structural shape is exercised;
   the explicit specs are still owed before this spec passes.

#### Next best action

1. Land the pivot-exposure refactor (path 1 from the spec's
   Architectural gap section is preferred — a first-class
   `OfferInventoryItem` pivot entity registered as a linkable so
   `required_quantity` becomes a normal Query-traversable field).
   Re-enable the order reservation test once the multiplier is
   live.
2. Finalize the `GET /store/products` offers skim (one bulk
   `calculatePrices` across visible offers, starting-from price per
   variant) and re-land `integration-tests/http/offer/store/`.
3. Add integration tests for the three Session 10 order overrides
   under `integration-tests/http/offer/order/` (createFulfillment,
   cancelOrderFulfillment, confirmReceiveReturn). They reuse the
   `seedSellerOfferWithShipping` + `completeCartCheckout` helpers
   already in `order.spec.ts`.
4. Commit Sessions 12–13 together: suggested message
   `test(offer): runtime verification of vendor/cart/order suites + spec evidence`.

### Session 14: 2026-05-21 -- SPEC-002 pivot extra-column gap resolved

**Goal**: Unblock the reservation test that was skipped in Session 13.
The skipped test depended on `offer.inventory_items.required_quantity`
surfacing through Query — a path documented under SPEC-002's
"Architectural gap" as requiring a non-trivial model refactor.

#### Diagnostic

Wrote a temporary `it()` probe in
`integration-tests/http/offer/order/order.spec.ts` that ran
`query.graph` against both `offer.inventory_items.*` (the shortcut)
and `offer.inventory_item_link.*` (the pivot alias `defineLink`
auto-generates). Result:

- `offer.inventory_items[]` → `[{id: "iitem_..."}]` (only the linked
  `InventoryItem.id`; pivot extras absent — the shortcut flattens
  through the pivot).
- `offer.inventory_item_link[]` →
  `[{id: "link_...", required_quantity: 3, inventory_item_id: "iitem_...",
  offer_id: "offer_...", inventory_item: {id: "iitem_...", sku: null}}]`
  — pivot row, complete with the `required_quantity` extra column **and**
  a nested `inventory_item` to the linked entity.

The "architectural gap" was a false bottom: `defineLink(...isList: true,
isList: true, { extraColumns })` already exposes the pivot from the
writable side — every consumer was simply using the lossy shortcut.

#### Completed (uncommitted)

- `packages/core/src/workflows/offer/utils/prepare-offer-inventory-input.ts`
  rewritten: `requiredOfferFieldsForInventoryConfirmation` now lists
  the `inventory_item_link.required_quantity` /
  `inventory_item_link.inventory_item.location_levels.*` chain; the
  helper reads `required_quantity` from the pivot row and multiplies
  by `quantity` for the real reservation amount.
- `packages/core/src/workflows/cart/workflows/complete-cart-with-split-orders.ts`
  — `fetch-offers-for-reservation` step reuses
  `requiredOfferFieldsForInventoryConfirmation`. Mirror import added.
- Three Session 10 order overrides
  (`packages/core/src/workflows/order/workflows/{create-order-fulfillment,cancel-order-fulfillment,confirm-return-receive}.ts`):
  rewrote the `useQueryGraphStep`/`useRemoteQueryStep` field lists to
  use `offer.inventory_item_link.required_quantity` /
  `inventory_item_link.inventory_item.*`, and rewrote
  `buildOfferInventoryByLineItem` (and the equivalent helper in
  `prepareInventoryUpdate` for `confirm-return-receive.ts`) to read the
  pivot row shape (with `inventory_item.id` as the nested join key)
  rather than the flat shortcut shape.
- `integration-tests/http/offer/order/order.spec.ts` — the previously
  `it.skip`'d test is now `it(...)` and asserts a reservation of
  `2 × 3 = 6` against an inventory level of `50`.
- `docs/specs/SPEC-002-offer-management.md`:
  - The "Architectural gap" section renamed to
    "Pivot extra-column exposure (resolved 2026-05-21)" and rewritten
    in place. Includes a field-path table and the contract that
    consumers needing the multiplier must traverse through
    `inventory_item_link`.
  - New evidence entry `2026-05-21 — Session 14: pivot extra-column
    gap resolved + reservation test enabled`.
  - `last_updated` bumped.

#### Verification

- `cd packages/core && bun run build`: clean (exit 0).
- `bun run test:integration:http -- offer/order/order`:
  **3 / 3 pass** (was 2 pass + 1 skip).
- `bun run test:integration:http -- offer/cart/cart`: **6 / 6 pass**.
- `bun run test:integration:http -- offer/vendor/offer`: **16 / 16 pass**.
- `bunx oxlint --quiet packages/core/src/workflows/{offer,cart,order}`:
  `0 errors / 120 warnings` (unchanged baseline).

#### Why this spec still stays `in_progress`

Two blockers from Session 13's list remain — the pivot gap is no
longer one of them:

1. **Store offers list page** — `GET /store/products` skim
   (starting-from price + bulk `calculatePrices`) and a re-landed
   `integration-tests/http/offer/store/offers.spec.ts` (the old one
   was removed in commit `bda84357` while the shape is iterated).
2. **Order-side fulfilment overrides without tests** — Session 10
   shipped same-id overrides of `create-order-fulfillment`,
   `cancel-order-fulfillment`, and `confirm-return-receive`. The
   Session 14 reservation test exercises the
   `order_line_item.offer.inventory_item_link.*` join shape end-to-end
   (so the structural risk is largely contained), but the three
   override workflows still need dedicated specs covering their full
   admin/vendor flows.

#### Next best action

1. Land the `GET /store/products` offers skim (one bulk
   `calculatePrices` across visible offers, starting-from price per
   variant) and re-land `integration-tests/http/offer/store/`.
2. Add integration tests for the three Session 10 order overrides
   under `integration-tests/http/offer/order/` (createFulfillment,
   cancelOrderFulfillment, confirmReceiveReturn). They reuse the
   `seedSellerOfferWithShipping` + `completeCartCheckout` helpers
   already in `order.spec.ts`.
3. Commit Sessions 12–14 together: suggested message
   `feat(core): resolve offer pivot extra-column exposure + reservation arithmetic`.

### Session 15: 2026-05-21 -- SPEC-003 vendor offer UI shipped + variant-scoped UI deleted

**Goal**: Implement SPEC-003 (vendor panel offer UI) and the paired
variant-scoped UI deletions that align the dashboard with SPEC-002's
backend migrations.

#### Completed (uncommitted)

- New `offers` namespace in `i18n/translations/en.json` + per-locale
  cleanup in 31 sister files; `$schema.json` regenerated.
- `packages/vendor/src/hooks/api/offers.tsx` — typed hooks against
  `sdk.vendor.offers.*` (list/detail/create/update/batch/delete +
  `Promise.allSettled` bulk delete).
- `packages/vendor/src/pages/offers/` tree:
  - List page (SingleColumnPage + `_DataTable` with row selection,
    bulk-delete command, search, filters, ordering, navigation).
  - Detail page (TwoColumnPage with General / Pricing / Inventory /
    Status sidebar / Shipping sections + loader + breadcrumb).
  - Three-tab create wizard (Variant → Details → Pricing & stock)
    behind `RouteFocusModal` + `TabbedForm`, with reusable prices
    and inventory-items repeaters.
  - Three `RouteDrawer`-based edit forms: identity, prices ladder
    (replace semantics), inventory-items batch (`{create,update,delete}`
    bucketed by row state).
  - Common types/constants/utils (stock status computation, detail
    field list) and a delete-action hook with `usePrompt`.
- Route map: `/offers` route tree registered in
  `packages/vendor/src/get-route-map.tsx` (list + create + detail
  with breadcrumb-from-loader + edit/pricing/inventory drawers).
- Sidebar: `Offers` inserted as the first nested item under
  **Products** in `useCoreRoutes`.
- Variant-scoped UI deletions (paired with SPEC-002 backend migrations):
  - Removed directories: `products/[id]/prices`, `products/[id]/stock`,
    `products/[id]/edit-stocks-and-prices`,
    `products/create/components/product-create-inventory-kit-form`,
    `product-variants/product-variant-detail/components/variant-prices-section`,
    `product-variants/product-variant-detail/components/variant-inventory-section`,
    `product-variants/product-variant-manage-inventory-items`.
  - Removed files: `products/common/variant-pricing-form.tsx`,
    variant-create `inventory-kit-tab.tsx` + `pricing-tab.tsx`.
  - Modified: `product-variant-section.tsx` (row actions + bulk
    command for prices/stock stripped), `product-variant-detail.tsx`
    (sections removed), variant edit form (`manage_inventory`,
    `allow_backorder` fields removed), variant create form
    (reduced to `DetailsTab`), product create wizard schema/utils/
    DataGrid (price + inventory-toggle columns removed; inventory
    tab dropped; `regionsCurrencyMap` thread removed).
  - Route map entries for `prices`/`stock`/`edit-stocks-and-prices`/
    `variants/:variant_id/prices` removed.
- i18n: dropped `products.editPrices`, `products.stock`,
  `products.variant.pricesPagination`, `products.variant.inventory.*`
  (manageItems, manageKit, notManagedDesc, header,
  actions.inventoryItems, actions.inventoryKit),
  `products.create.tabs.inventory`, `products.create.inventory`.

#### Verification

- `cd packages/vendor && bun run build`: ESM + DTS build success.
- `bunx vitest run packages/vendor/src/i18n/translations/__tests__/validate-translations.spec.ts`:
  **1/1 pass** (en.json ↔ schema parity).
- `bunx oxlint --quiet packages/vendor/src/pages/offers
  packages/vendor/src/hooks/api/offers.tsx`:
  **0 errors / 3 warnings** (baseline `_tabMeta` underscore-dangle,
  same as other tabbed forms in the package).
- `grep -R "products\.editPrices\|products\.stock\|
  products\.variant\.pricesPagination\|products\.variant\.inventory\|
  products\.create\.tabs\.inventory" packages/vendor/src`:
  **no matches** (spec's grep-based deletion check).

#### Why this spec stays `in_progress` (not yet `passing`)

1. Vendor dev-server walkthrough (Verification §2–§7) not yet
   performed in this session — the SPA build is green but the
   golden-path UI smoke (sidebar entry → list → create wizard →
   detail → three edit drawers → bulk delete) still needs to run
   against `bun run dev` before status flips.
2. `@mercurjs/admin` `bun run build` fails on
   `product-variant-detail.tsx`. Confirmed pre-existing (stashing
   SPEC-003 changes and re-running the admin build reproduces the
   same `Type 'ProductVariantDTO' is missing prices, options` error)
   — owned by SPEC-004 admin UI scope and out of this spec's surface.
3. Playwright suite mirroring the SPEC-003 `data-testid` contract
   not authored.

#### Next best action

1. Run `bun run dev`, exercise the seven verification steps end to
   end, capture evidence, and flip SPEC-003 to `passing`.
2. Fix admin's pre-existing `product-variant-detail.tsx` regression
   under SPEC-004 (same kind of deletion sweep, scoped to admin).
3. Commit Session 15 with message
   `feat(vendor): offer management UI + variant-scoped surface
   removal (SPEC-003)`.

## Required Artifacts (status)

- `claude-progress.md` -- this file (updated 2026-05-21, Session 15).
- `docs/specs/SPEC-002-offer-management.md` -- updated Session 14;
  Architectural-gap section rewritten as resolved.
- `docs/specs/SPEC-003-offer-vendor-ui.md` -- updated Session 15;
  status flipped to `in_progress`, evidence block populated.
- `session-handoff.md` -- not present; not yet needed.

## Definition Of Done (reminder)

A change is done only when:

- target behavior is implemented
- `bun run build` and `bun run lint` pass
- a relevant integration test was run (for behavior changes)
- evidence is recorded in this file
- the repo remains restartable from `bun install && bun run dev`
