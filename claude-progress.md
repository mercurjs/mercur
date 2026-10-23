# Claude Progress -- Mercur.js

This is the session log and current-state tracker. Keep it short: prune old
session detail aggressively. The per-spec source of truth lives in
`docs/specs/SPEC-*.md` (status + Evidence) — this file is just the running log.

## Current Verified State

- **Repository root**: `/Users/viktorholik/Desktop/mercur`
- **Current branch**: `feat/magento2-connector`
- **Current version**: `2.2.0-rc.1`
- **Standard startup path**: `bun install && bun run dev`
- **Standard verification path**: `bun run build`, `bun run lint` (oxlint),
  `bun run test:integration:http -- <pattern>`
- **Current blocker**: none

## Session — Stripe connector (2026-10-22), branch `feat/stripe-connector`, worktree `~/Desktop/mercur-stripe-connector`

Spec: `docs/specs/spec-stripe-connector/` (local, gitignored; `brief.md`, `research.md`, `blueprint.md`, `assert.md`,
`removals.md`, `deltas/D-001…D-012` all `done`). Scheduled payout pipeline in the shape of
Medusa's payment module.
- Core payout module is provider-agnostic: `pop_<identifier>_<id>` registry (`pop_system_default` always),
  ten-method `IPayoutProvider` + `AbstractPayoutProvider`, new models `transfer`, `settlement`, `adjustment`,
  `payout_provider`, `payout_checkpoint`, `payout_job_run`, `payout_notification`, extended `payout_account`/`payout`
  (migration `Migration20261022120000`), `/hooks/payout/[provider]` (+ legacy alias).
- Seven scheduled jobs (`packages/core/src/jobs`), pipeline functions under
  `workflows/payout/pipeline`, pure rules under `workflows/payout/utils` (transfer factory, capture decision,
  settlement builder), workflows for transfer/reversal/payout dispatch, account sync, capture/cancel, operator
  notifications; admin routes for accounts, transfers, settlements, adjustments, jobs, status, captures,
  notifications; vendor `payout-accounts/me`, `transfers`, `settlements`; public onboarding refresh.
- Plugin `packages/plugins/stripe-connector` (`@mercurjs/stripe-connector-plugin`): Stripe payment provider
  (manual capture, order-group metadata) + Stripe Connect payout provider, admin Finance → Stripe (tab per job),
  Settings → Stripe, seller/order widgets, vendor Settings → Stripe. `packages/providers` deleted; docs rewritten.
- Verified: core tsc + build, plugin server/admin/vendor tsc + `dashboard:build`, `bun test` unit specs 35/35
  (core utils + plugin provider), lint clean on touched files, `payouts/vendor/*` 8/10 → racing subscriber removed
  (re-run pending), new `payouts/admin/payout-pipeline.spec.ts` (fixes in progress). Gotchas: integration tests need
  `packages/plugins/magento2-connector` built (test config loads its provider); `bun run test:unit` can't resolve
  `@swc/jest` locally, use `bun test <dirs>`; declaration emit needs an explicit `ReturnWorkflow<>` annotation on
  workflows that return `when()` results (TS2742).
- Open: Stripe test-mode run by hand (assert.md § I); PR to `main`.

## Session — Medusa 2.22.0 upgrade (2026-10-22), branch `chore/medusa-2-22`

Every `@medusajs/*` pin moved 2.21.2 → 2.22.0 and every peer range `>=2.21.0` → `>=2.22.0` (packages,
providers, apps, integration-tests, root, and all three templates — they already tracked the workspace
line at 2.21.2, so they follow it; `@medusajs/ui` keeps its own 4.2.3 line). `bun.lock` refreshed.
Medusa 2.22.0 requires Node 22.22+, so the `engines.node` floor on core, the payout provider, the API
app and the templates is `>=22.22.0`; docs say Node 22.22+. Breaking change absorbed: 2.22.0 made
`refundPaymentWorkflow` replay-safe (medusajs/medusa#16964), which moved the hunk the payment-hooks patch
anchored on. Regenerated as `@medusajs+core-flows@2.22.0-payment-hooks.patch` (range 2.22.0–2.23.0);
the `paymentRefunded` hook now also carries `is_replay` so a ledger can skip a replay the way the credit
line and event are skipped. The other four patches apply unchanged; their ranges extend to 2.23.0.
test-utils dropped the `inApp` option, removed from both `health.spec.ts`. `routes-manifest.json` gained
`/admin/customers/export`. Verified locally: `bun run build`, `bun run lint`, patch unit specs 40/40,
`payment/split-order-payments` + `order/admin/order-payment-status` 16/16. Gotcha: after changing a patch,
rebuild core and `jest --clearCache`, or the transformer replays the old manifest from `.medusa/server`.

## Session — Magento 2 connector, Part A (2026-10-21), branch `feat/magento2-connector`

Spec: `docs/specs/SPEC-003-magento2-connector.md` (local, `in_progress`). Design: Magento keeps
storefront, checkout, payment capture and 1P products; Mercur owns sellers, 3P offers, split orders,
commissions, payouts. Checkout drives a shadow Mercur cart (line items by `offer_id`, per-seller
shipping, `pp_external_external` session, complete).
- New plugin `packages/plugins/magento2-connector` (`@mercurjs/magento2-connector-plugin`):
  `magento_webhook` module (endpoints + signed, retried deliveries), `external` payment provider,
  `/admin/magento/*` routes (webhooks CRUD, deliveries, redeliver, status, external refund), fan-out
  subscriber, retry/prune jobs, admin UI at `/settings/magento` built with `mercurjs dashboard:build`.
- Core: `deleted_at` filter + `with_deleted` forwarding on admin offers/sellers lists; `order_group.metadata`
  (+ migration) copied from `cart.metadata`; `integrations` permission key (core catalog + SDK).
- Verified: turbo build 7/7, plugin admin tsc clean, oxlint clean, integration specs
  `magento2-connector/*` 9/9 and `offer/admin/offer-soft-delete` 1/1. `test:unit` cannot resolve
  `@swc/jest` locally; registry spec left to CI.
- Reviewed with the enterprise `medusa-review` skill (Medusa eslint preset + exemplar diff) and fixed all
  findings: writes go through workflows with compensation and refetch, validation step instead of throw in
  transform, service under `services/` with `IMagentoWebhookModuleService`, generated migration, typed
  responses, strict validators. Gate clean on plugin files; specs 10/10 after the refactor.
- Part B pushed: github.com/mercurjs/magento2-connector (`mercurjs/magento2-connector` Composer package,
  modules Core/Process/Connector/OfferIndexer/Catalog/Settlement/Frontend/GraphQl). Lint + 13 unit tests
  green locally via a static PHP binary in the scratchpad (Homebrew PHP won't build on this macOS). Not
  yet run on a Magento install.
- Next: dashboard Channel column/filter, roles preset once a roles module exists, Magento end-to-end run.

## Session — Core hot-path performance (2026-10-21), branch `perf/core-hot-path-optimizations`, PR #1677

Technique catalog from the Medusa source in `docs/PERFORMANCE.md` (section 4 lists what this branch
applied, section 5 the remaining checklist). Fixed: checkout lock timeout/ttl/retention passed in ms
instead of s; cart lock skipped on the webhook-driven completion path; commission rates loaded once per
checkout via `getCommissionLinesBatch`; vendor single-product scoping no longer scans `product_seller`;
cache opt-in on reference reads; order-group SQL soft-delete joins; composite partial indexes on
order_group/offer/payout/review/commission_rule (+ migrations). Verified locally: core tsc, unit specs
4/4, `commission-rates/admin/(commission-providers|commission-calculation)` 15/15; other suites on CI.
Gotcha: the order module decorates totals only when a top-level total field (e.g. `subtotal`) is
selected, and needs `items.*` to derive line totals. Follow-ups listed in the PR body.

## Session — Dashboard extensions, OS deltas D-001…D-005 (2026-10-20), branch `feat/dashboard-layout-composer`

Spec: `docs/specs/spec-dashboard-extensions/` (local; `docs/specs` is gitignored), `in_progress`. PR #1674.
- `LayoutComposer` (Medusa port, no edit mode) in `@mercurjs/dashboard-shared`; registry gained layouts,
  gates, layered preferences, `getWidgetsForSections`; `resolveRouteOverrides` gives overriding routes
  `renderDefault`. SDK: every virtual module merges ordered layers (`layers.ts`), new `layouts`/`preferences` modules, `defineRouteConfig`/`defineLayoutConfig`/`defineLayoutPreferences`.
- Pilots on the composer: admin product detail, vendor offer detail (existing zone ids kept).
- Verified: SDK vitest 16/16, shared vitest 33/33, panel tsc no new errors vs baseline, admin/vendor/cli
  packages build, both host apps `vite build`. Docs page `references/panel-extensions/layouts.mdx`.
- Next: D-006 (rewrite the remaining 116 compound pages, public `/hooks` + `/components`, peer deps),
  D-007 (CLI emits extension-targets for plugins, typed plugin routes), sidebars as composers.

## Session — Seller ↔ Region assignment (SPEC-001), branch `feat/seller-regions`

Spec: `docs/specs/SPEC-001-seller-regions.md`. New `region_seller` link; `linkSellerRegionsWorkflow`;
seller creation (admin + vendor registration) links `region_ids` or the store default region.
Admin: `POST /admin/sellers/:id/regions`, `POST /admin/regions/:id/sellers`, `GET /admin/sellers?region_id=`,
`seller.regions` on retrieve. Vendor: `/vendor/regions` scoped to assigned regions; offer + shipping-option
prices validated against assigned regions (400). Admin UI: region detail *Sellers* section + add modal,
store detail *Regions* sidebar + add modal, Create Seller regions picker. Vendor UI: offer price grids gain
a column per assigned region (`rules.region_id`); offer pricing sections list region prices.
Verified: `test:integration:http -- "regions|offer-region-prices|shipping-options/vendor|seller/(admin|vendor)/seller"`
(10 suites, 238 tests). `bun run build` see spec Evidence. Not verified in a browser. Uncommitted.
Known pre-existing: admin `validate-translations.spec.ts` fails on `sellers.*` schema keys missing from
`en.json` (unrelated); `bun run lint` tsc noise in untouched files.

## Session — Panel auth collision, branch `fix/panel-auth-session-collision`

Admin and vendor panels shared one API session cookie, so logging in to one logged the other out.
Both panels now keep their JWT in origin-local storage and send `Authorization` (+ `x-seller-id`
for vendor) via `getAuthHeaders` (exported from `@mercurjs/admin` / `@mercurjs/vendor`);
`@mercurjs/client` gained a `headers` option; `POST /vendor/sellers/select` returns `seller_id` and
only writes the session for session-authenticated callers. Host apps + `templates/basic` clients
updated. Verified: `bun run build`, `test:integration:http -- panel-auth` (2/2). Not verified in a
browser. **Open risk**: the messaging block's panel SSE (`EventSource` + `withCredentials`) can't
send a bearer header, so it falls back to polling until it gets a token-exchange flow.
Uncommitted.

## Session — Admin Inventory (MER-139), branch `feat/admin-inventory`

Spec + audit: `docs/specs/spec-3-admin-inventory/`. Implemented (type-clean; deps built; lint
warnings pre-existing only): **D-01** remove admin create-inventory-item flow; **D-04** drop
"Details" suffix; **D-06** Edit Attributes `InlineTip`; **D-12** Manage-Qty warning `InlineTip`;
**D-13** Edit Details flip (Title required / SKU optional); **D-15** toast copy → Figma verbatim +
subtitle; **D-18** Create Reservation warning `InlineTip`. Added all prompt/warning i18n keys and
regenerated the `$schema.json` inventory block (inventory subtree 66/66 parity).

Also done: **D-16** delete item + delete level prompts (verbatim copy, `{{location}}` interp);
**D-17** reservation delete two cases (discriminator `reservation.line_item_id` → unfulfilled-order
"Got it" info prompt vs deletable confirm); **D-19** bulk "Edit stock levels" pre-confirm prompt;
**D-14** adjust-qty empty-quantity message. Schema parity 67/67.

Also done (frontend, build-clean): **D-02** Product + Store columns + reorder (In stock before
Reserved); list now requests `+variants.product.title,+seller.name`. **D-03** filters =
SKU/Store/Location/Height/Width/MID code/Material (dropped Length/Weight/Requires-shipping) +
default sort `title` ascending (**G3b**); `seller_id` flows through the query. **D-14** reservation
required-field messages (schema moved to `buildCreateReservationSchema(t)`). Fixed a pre-existing
`AdminInventoryItemParams`→`AdminInventoryItemsParams` typo.

All touched files type-clean (`tsc --noEmit`); remaining tsc errors are pre-existing
(`@custom-types/*` alias cascade + untouched `inventory-metadata`/`inventory-stock-form`).

**Backend-remaining (needs running API — NOT verifiable in this worktree per project constraints):**
- Admin `inventory-items` route override in `packages/core` so the **Store filter** (`seller_id`
  param) is accepted and the **Store column** seller-link is guaranteed to resolve. (Store column
  may already resolve via global links in `fields`; the `seller_id` filter needs the override.)
- **D-05** Associated-offers sidebar (needs offer reverse-link on the inventory detail contract).
- **D-07** bulk store-ownership gate; **D-08** vendor notifications (subscribers); **D-09/D-10**
  admin location scoping to the item's store.
- **D-11** locations `…` right-align — uses canonical `columnHelper.action`; live visual check.
See `docs/specs/spec-3-admin-inventory/blueprint.md` for the route-override plan.

## Integration test (spin up to verify)

`integration-tests/http/inventory/admin/inventory.spec.ts` — type-clean (only jest-global noise
under standalone tsc, same as every spec). Run later with:
`bun run test:integration:http -- inventory/admin/inventory`. It seeds a seller + offer-backed
inventory item (stock location → shipping → product → offer) and asserts:
1. **Store column** — `GET /admin/inventory-items?fields=+seller.name` resolves the seller link
   (should PASS; validates D-02 Store column).
2. **Product via offer** — offer inventory links to the *offer, not the variant* (memory
   `offer-inventory-not-on-variant`), so `inventory_item.variants` is EMPTY; the product is
   reached through the offer. Test asserts `item.offer?.product?.title`.
3. **seller_id filter** — specifies D-03 backend; expected RED until the core route override lands.

⚠️ **Finding to action:** because offer inventory has no variant link, the current frontend Product
column (`variants?.[0]?.product?.title` in `use-inventory-table-columns.tsx`) will show `-` for
offer items. The list must reach Product through the offer instead. Test #2 confirms the exact
offer field/alias to use (verify `offer` vs `offers` when the suite runs), then update the column +
the list `fields` request accordingly.

Verify: `bun install` done; built `@mercurjs/types|client|dashboard-shared`; `tsc --noEmit`
touched-files clean (remaining errors are pre-existing `@custom-types/*` alias + workspace drift).

## Session — Vendor Campaigns Figma Sync (branch `feat/vendor-campaigns-figma-sync`)

Spec: `docs/specs/spec-1-vendor-campaigns/` (brief / blueprint / assert / deltas).

**Implemented:** D01 list Type column · D02 list Status column · D04 general row order
(Description before Identifier) · D05 configuration expiry warning · D06 merged
Spend+Budget into one Budget card (deleted `campaign-spend/`, updated detail sidebar +
skeleton) · D07 identifier tooltip · D08 no-limit helper text · D09 add-promotions tip
+ plural add toast · D11 create validation (name/identifier required, spend-currency
`refine`, i18n `campaigns.validation.*`) · D12 toast copy aligned to Figma
(non-interpolated, pluralized add/remove; wired missing remove-promotion toasts).

**Backend implemented (previously flagged as gated):**
- **D03 filters (frontend + backend)** — extended
  `packages/core/src/api/vendor/campaigns/validators.ts` (`budget_type` + `status`)
  and translated them in `route.ts` GET into `query.graph` filters (budget.type;
  starts_at/ends_at date ranges with `$or … null` for open-ended = active). Re-wired
  the `useCampaignTableFilters` hook, query passthrough, and list `filters` prop.
- **D08 "Limit usage per" (frontend, backend already supported)** — `Combobox`
  (customer / email / promotion code) in create form-fields (usage-only); schema +
  defaults gained `budget.attribute`; submit sets type `use_by_attribute` when an
  attribute is chosen (mirrors admin). Backend `VendorCreateCampaignBudget` already
  accepts `attribute` and the workflow forwards it — no backend change needed. Detail
  Budget card renders the attribute label.

**Tests:**
- `integration-tests/http/campaigns/vendor/campaigns.spec.ts` extended for D03/D08:
  `budget_type=spend|usage` filtering (+ invalid value → 400), `status=active|
  scheduled|expired` filtering (incl. open-ended = active, scheduled excluded from
  active; + invalid value → 400), and a `use_by_attribute` create with `attribute`
  persisting (D08). Not runnable in a fresh worktree (needs full install + Postgres);
  syntax-verified via TS `transpileModule`. Run in CI / installed checkout:
  `bun run test:integration:http -- campaigns/vendor`.

**Still out of scope:**
- **D12 notification-drawer entry** — backend notification template, out of UI scope.

**Verification:** vendor `tsc --noEmit` (root node_modules symlinked from main) shows
no NEW errors from these changes — remaining campaign errors are pre-existing/
environmental (unbuilt core route-map → `CampaignDTO` vs `AdminCampaign`,
`@custom-types` alias, `DEFAULT_CAMPAIGN_VALUES` enum). `oxlint` on changed files: no
new warnings. Full `bun run lint` + `bun run build` still owed in a fully-installed
checkout / CI (fresh worktree has no install).
- **Active spec**: _(none in progress — pick the highest-priority unfinished
  `docs/specs/SPEC-*.md`)_

## Session Log

### Session: 2026-07-29 -- Admin Reviews (MER-152, SPEC-2)

- **Goal.** Promote reviews from the registry block into `@mercurjs/core` and build the
  admin reviews UI to match Figma (canvas `40015049:1019815`, BASIC/store reviews).
- **Backend.** `packages/core/src/modules/review` (model + `status` enum + migration + service);
  links customer/order/seller/product; `workflows/review` (create/update/respond-add-once/delete
  + validate); admin/vendor/store API routes + validators + query-config + middlewares (registered
  in all three aggregators). `MercurModules.REVIEW` + review DTOs added to `@mercurjs/types`.
- **Admin UI.** `pages/reviews/{review-list,review-detail,review-edit,review-respond,common}` +
  `hooks/api/reviews.tsx`; route in `get-route-map.tsx`; sidebar entry after Stores; `reviews.*`
  i18n. List (Review ID/Rating stars/Content/Store/Customer/Date/Status badge/Response + Rating/
  Status/Date filters), detail (two-column + Customer/Order/Store sidebar cards), Edit drawer
  (Status+Rating), Respond drawer (add-once), delete-action hook.
- **Block removed.** `packages/registry/src/reviews/` + `registry.json` entry + built `r/` artifacts.
- **Verified.** types+core build ✓, admin ESM bundle ✓, `tsc` clean on review files, `oxlint` clean.
  Added `integration-tests/http/review/admin/review.spec.ts` (runs in CI — worktree can't run it).
- **Next.** CI integration run; migration apply on live DB; Figma visual parity; vendor-notify rule.

### Session Log (prior)

### Session: 2026-07-21 -- Vendor offer-targeted promotions (PR #1268)

- **Goal.** Port the Medusa promotion-create form into the vendor panel and add
  offer-level targeting so a vendor's "Amount off offers" promotion actually
  discounts the vendor's offers at checkout. Branch `feat/vendor-offer-promotions`.

- **Key decision — how an offer is targeted.** `ApplicationMethodTargetType`
  (`order`/`items`/`shipping_methods`) is a hardcoded Medusa enum; **offer is NOT
  a new target type**. An offer *is* a line item, so target stays `items` and
  "offer" is a new **rule attribute** with value path **`items.metadata.offer_id`**.
  The store add-to-cart route already writes `metadata.offer_id` onto the cart
  line; the promotion engine reads item-scope rules via `pickValueFromObject`, so
  matching needs no engine change — just the attribute + the metadata present in
  the compute context. `offer` replaces `product` in the vendor items-attributes
  (Figma dropdown = Offer/Category/Collection/Type/Tag). Rule-value dropdown uses
  `labelAttr: "sku"` (Offer has no `title`); seller-scoped via the `offer.seller_id`
  column (there is **no `offer_seller` pivot** — the link is read-only on the column).

- **Landed (backend, packages/core).** `rule-attributes-map.ts` (offer attr),
  `rule-query-configuration.ts` (offer→sku), `rule-value-options/.../route.ts`
  (offer branch: filter offers by `seller_id`), `validators.ts` (allow `once`
  allocation), `workflows/cart/utils/fields.ts` (add `items.metadata` to
  `cartFieldsForRefreshSteps` so rules see it), and the root-cause fix in
  `workflows/cart/steps/prepare-adjustments-from-promotion-actions.ts`.

- **Bug found + fixed (affected ALL seller promotions).** The seller-scoping of
  computed line-item adjustments compared `promotion.seller.id` to
  `lineItem.variant.product.seller.id`. Master products are not seller-owned, so
  that value is empty and every seller-scoped line discount was **silently
  dropped**. Now resolved from **`lineItem.offer.seller_id`**. This is why offer
  promotions produced 0 discount even though rule + metadata were correct.

- **Landed (vendor panel).** `templates.ts` → 3 Figma types (Amount off offers /
  Percentage off items / Buy X Get Y); submit handler no longer hard-codes
  `application_method.type: 'percentage'` and now sends `buy_rules`; added
  `is_tax_inclusive` switch + `once` allocation; schema `value` accepts
  string|number; removed the `country`/`product` attribute hard-filter in
  `rules-form-field.tsx`, passed `target_type` to the attributes hook, fixed a
  stale `promotion-create/...` import → `create/...`; offer-based
  `requiredProductRule`; i18n keys.

- **What was NOT done / owed.** (1) Buy X Get Y is wired at the type/template
  level but its buy-quantity UX wasn't deeply exercised — verify buy_rules +
  apply_to_quantity flow. (2) Update-promotion / edit-rules drawer wasn't
  re-audited for the offer attribute. (3) The Confluence promotions doc still
  omits "Amount off offers" — not updated. (4) No automatic-promotion (non-code)
  cart test; only code-applied. (5) Vendor promotions area has ~11 pre-existing
  tsc errors (tsup/esbuild ships anyway) — left as baseline.

- **Also in the PR (not my work, per user request to commit all).**
  `apps/vendor/.../store-setup.tsx` (pre-existing), `query-config.ts`
  (`limit`/`used` fields) and `create-seller-promotions.ts` (campaign linking) —
  unrelated, uncovered by these tests.

- **Verified.** Core + vendor builds clean. `test:integration:http` —
  promotions store+vendor 37/37 pass (incl. cart E2E: targeted offer discounted
  500 / discount_total 500; non-matching offer 0), offer/cart 8 pass (2 skipped),
  no regression.

- **Next.** Address owed items above; consider splitting the two unrelated files
  into their own PR.

Newest first. One entry per session, kept to a few lines: goal, what landed,
how it was verified, what's owed/next. Move durable facts into
`docs/specs/SPEC-*.md` Evidence or into memory — not here.

### Template

### Session NN: YYYY-MM-DD -- <spec / short title>

- **Goal.** One line.
- **Landed.** Key files/behavior (terse).
- **Verified.** build / lint / test result.
- **Owed / next.** What the next session should pick up.

## Definition Of Done

A change is done only when:

- target behavior is implemented
- `bun run build` and `bun run lint` pass
- a relevant integration test was run (for behavior changes)
- evidence is recorded in this file
- the repo remains restartable from `bun install && bun run dev`
