# Claude Progress -- Mercur.js

This is the session log and current-state tracker. Keep it short: prune old
session detail aggressively. The per-spec source of truth lives in
`docs/specs/SPEC-*.md` (status + Evidence) — this file is just the running log.

## Current Verified State

- **Repository root**: `/Users/viktorholik/Desktop/mercur`
- **Current branch**: `main`
- **Current version**: `2.2.0-rc.1`
- **Standard startup path**: `bun install && bun run dev`
- **Standard verification path**: `bun run build`, `bun run lint` (oxlint),
  `bun run test:integration:http -- <pattern>`
- **Current blocker**: none

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
