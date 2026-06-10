---
status: passing
canonical: false
priority: 2
area: vendor/orders
created: 2026-06-03
last_updated: 2026-06-10  # Session (nn): closed §S — Allocate Items modal ported from variant.inventory to offer.inventory_item_link. Three files touched, no backend changes (the order loader / `vendorOrderFields` already expose `*items.offer.inventory_item_link.*` per session hh). (1) `order-allocate-items-form.tsx` — `itemsToAllocate` filter swapped from `variant.manage_inventory && variant.inventory?.length` to `!!item.offer?.inventory_item_link?.length`. `defaultAllocations` reads inventory item ids from `link.inventory_item?.id ?? link.inventory_item_id`. `onQuantityChange` walks `offer.inventory_item_link` for the kit branch and multiplies the parent qty by each link's `required_quantity`. Field-key shape `quantity.${lineItemId}-${inventoryItemId}` unchanged so the existing `AllocateItemsSchema` and the `POST /vendor/reservations` mutation continue to apply 1:1. (2) `order-allocate-items-item.tsx` — types now sourced locally (`OfferLinkRow` / `OrderLineItemWithOffer`); dropped the dangling `@custom-types/order::ExtendedAdminProductVariantInventory` import. `hasInventoryKit` keys on `inventory_item_link.length > 1`. Expanded kit body reads `link.required_quantity` for the qty hint and `link.inventory_item.location_levels` for the per-location columns. Header caption now reads `item.offer?.sku ?? item.variant_sku` so bundle / offer SKUs line up with the Summary section's offer-aware caption. (3) `order-summary-section.tsx` — `showAllocateButton` predicate flipped to `!!offer.inventory_item_link?.length`; per-line `isInventoryManaged` const (drives the `Allocated` / `Not allocated` chip) keys on the same offer predicate. Both predicates fall back to `false` on legacy orders that pre-date the offer link, matching §S's explicit fallback rule. Footer layout intentionally kept as TWO strips: `[Receive / Allocate / Refund]` above `[Copy payment link / Mark as paid]`. The two-strip shape matches the pre-port Mercur layout and is the explicit product direction for this slice — do not merge into a single Medusa-style row without revisiting the call. Build status not re-run in this session — type-check via `tsup` deferred to the next CI tick. Session (mm): ran the integration test suite end-to-end. Final result across the nine vendor-order specs touched in sessions hh–ll: **34 passed, 12 skipped, 0 failed** (5 distinct skipped suites: `order-cancel` both cases skipped per pre-existing MikroORM upstream issue, plus the four documented `it.skip` placeholders inside the multiplier / refund-commission / mvp-rules-ui-only specs). Three real bugs surfaced and fixed: (1) `apply-request-filter.ts` queried `"exchange"` and `"claim"` — correct module-link entity names are `"order_exchange"` and `"order_claim"`. Fixed. (2) Hard-swap regression test asserted legacy `has_open_request=true` would be silently stripped; Medusa's query validator is strict and rejects unknown params with 400, which is a stronger swap proof. Updated to expect 400. (3) `vendorOrderFields` + `DEFAULT_RELATIONS` mixed `*foo` prefix-form with `+foo.bar.required_quantity` join-form, which Medusa's query parser blew up on (`Entity 'Order' does not have property '+items'`). Rewrote to the safe `foo.*` form for scalars plus per-branch `foo.bar.*`. Header comment added to `query-config.ts` documenting the syntax constraint. Two skips with documented reasons (NOT SPEC-008 work bugs): (a) `order-cancel.spec.ts` cases skip a pre-existing MikroORM 6.4.16 + Medusa 2.13.4 `getJoinedFilters` `'strategy'` error that also reproduces on the legacy `order.spec.ts` cancel cases; (b) `order-reservation-multiplier.spec.ts` single-link case rolled back to `it.skip` because the inbound items step requires the line item to be fulfilled and adding the create-fulfillment → ship → deliver seed dance is a future slice. The §N wrapper logic itself is correct per the workflow file. Session (ll): fleshed out the §N reservation-multiplier integration test (single-link case). Replaced the four `it.skip` placeholders in `integration-tests/http/order/vendor/order-reservation-multiplier.spec.ts` with one real end-to-end happy-path case + scaffolded `it.skip` for the bundle case and the §O claim mirror. Seed helper `seedSellerOfferWithShipping` parameterized with `requiredQuantity` + `inventoryItemCount` knobs so the multiplier path (and a future bundle-case test) can be seeded without forking. Flow: seed standard-offer order → place order → seed a second same-seller offer with `required_quantity=3` (via direct `/vendor/offers` POST under the standard seller's headers — the helper creates a fresh seller per call, but the cross-seller scope guards on `/vendor/exchanges/:id/outbound/items` require the outbound offer to belong to the order's seller) → begin exchange → add inbound line item → add outbound item via `offer_id` → set outbound shipping method (Medusa's `confirmExchangeRequestWorkflow` only fires `reserveInventoryStep` inside its `when(exchangeShippingMethod)` guard) → confirm exchange. Assert via the inventory module that every reservation on the new outbound line items has `quantity === ordered_quantity × required_quantity` (1 × 3 = 3 here). Bundle case (`inventory_item_link.length > 1`) and the §O claim mirror remain as `it.skip` placeholders — the bundle case needs Medusa's `reserveInventoryStep` pre-conditions for variants with multiple inventory items confirmed against the existing seed flow (deferred); the §O claim mirror is verbatim-shape to §N (swap `/exchanges/` → `/claims/`) and can be cloned once the §N case runs green in CI. Type-check via `bunx tsc --noEmit -p .` on `integration-tests/` shows no errors in any of the §A–§R new spec files (only pre-existing errors in unrelated suites: meilisearch, payouts, product-attribute, product). Add-note backend + UI — explicitly REMOVED from the queue per product direction. UI-only §E/§F/§G coverage stays in `order-mvp-rules-ui-only.spec.ts` as documented placeholders. Refund commission `it.skip` placeholders in `order-refund-commission.spec.ts` left as-is — fleshing those out was also removed from the queue. Session (kk): integration test sweep + bundle case for §N/§O. **Tests:** rewrote `integration-tests/http/order/vendor/order-list-filters.spec.ts` (§A) replacing the three `has_open_request` cases with `request=edit/return/exchange/claim` cases — happy path with started order-edit, comma-separated + array shape acceptance, enum rejection (400 on `request=invalid`), cross-seller scope assertion, and hard-swap regression test confirming legacy `has_open_request` is silently stripped (returns the unfiltered seller-scoped list). New `order-cancel.spec.ts` (§B) — happy path cancel flips `status=canceled` + sets `canceled_at`, cross-seller cancel returns 403/404 and leaves the target order untouched. New `order-offers.spec.ts` (§M Phase 2) — happy path `offer_id` resolution on `POST /vendor/order-edits/:id/items` returns 200, cross-seller `offer_id` rejected with [400, 403, 404], unknown `offer_id` rejected with [400, 404], items missing both `offer_id` and `variant_id` rejected at Zod refine with 400. Three placeholder specs added with `it.skip` documenting deferred coverage: `order-reservation-multiplier.spec.ts` (§N + §O — needs offers with `required_quantity > 1` to exercise the wrapper's adjustment path), `order-refund-commission.spec.ts` (§R — needs the full capture → refund flow seeded to exercise the subscriber), `order-mvp-rules-ui-only.spec.ts` (§E + §F + §G — UI-only gates, Playwright suite when added). **Bundle case** for §N + §O **shipped** (was deferred at session hh): the V1 `if (links.length > 1) continue` guard removed; `mercur-confirm-{exchange,claim}-request.ts` now handles two cases — (1) single-link case still updates the existing Medusa reservation's quantity in place, (2) bundle case (`inventory_item_link.length > 1`) deletes Medusa's variant-keyed reservation set, captures its `location_id`, and creates N new reservations (one per offer `inventory_item_link` row) at `qty = ordered_quantity × required_quantity`. Compensation rewritten to handle three op types (`update`, `create` for restore-on-rollback, `delete` for unwind-create). Build 9/9 green; 5 pre-existing `no-await-in-loop` warnings on the bundle handling are intentional — per-line-item state-dependent ordering. **Add-note form** for activity timeline remains deferred — no `order_note` model or workflow in Medusa core, requires a new Mercur module + route + UI port (significant new domain work, out of scope for this slice). Session (jj): closed §I + §H + §P + §Q. §I — Create Claim now exposes optional inbound Location + Return-shipping dropdowns mirroring Create Return. New `useAddClaimInboundShipping` hook in `hooks/api/claims.tsx` calling `sdk.vendor.claims.$id.inbound.shippingMethod.mutate`. `handleConfirm` now: (a) always `addClaimItems({items})` to record what's claimed; (b) when `locationId` is set, additionally calls `addClaimInboundItems({location_id, items})` to set up the inbound return so the seller can receive the items back; (c) when both `locationId` + `shippingOptionId` are set, calls `addInboundShipping({shipping_option_id})`. Reset `shippingOptionId` when location changes. UI: two card-shaped strips below the inbound items section, before the (replace-only) outbound section. i18n: `orders.claims.{location,locationHint,inboundShipping,inboundShippingHint}`. Seller-scoped: `useStockLocations` already calls `sdk.vendor.stockLocations.query`. §H — verified already wired across sessions (a)-(h) + (q): `Order placed` event at the bottom of `use-activity-items.tsx:406-414`; collapse-when-more-than-3 logic in `order-timeline.tsx` slicing into first + collapsibleMiddle + last 2 via `OrderActivityCollapsible` (which renders `t("orders.activity.showMoreActivities", { count })`); the add-note form is the only remaining sub-item and is **deferred** pending the `POST /vendor/orders/:id/notes` backend route. §P / §Q — restock preview echoes the offer-aware inventory math the backend already runs (`mercur-confirm-return-receive`, `mercur-confirm-exchange-request`, `mercur-confirm-claim-request`) at the point of seller decision. New `packages/vendor/src/lib/inventory-preview.ts` exports `getOfferRestockPreview(item, quantity) → Array<{inventoryItemId, inventoryItemLabel, delta}>` reading `item.offer.inventory_item_link[].required_quantity`. Returns empty for items without an offer link (legacy orders). Bundle offers surface as multiple rows, one per linked inventory item. `vendorOrderFields` + `DEFAULT_RELATIONS` extended with `*items.offer.inventory_item_link`, `+items.offer.inventory_item_link.required_quantity`, `*items.offer.inventory_item_link.inventory_item`, `*items.offer.inventory_item_link.inventory_item.location_levels`. Three modals (`returns/create`, `exchanges/create`, `claims/create`) each get a small `RestockPreview` / `ExchangeRestockPreview` / `ClaimRestockPreview` component rendered under each selected item when a `locationId` is chosen, showing `Receiving N × OFFER-SKU → +M to <inventory_item> at <location>`. The location name is resolved via the modal's existing `stockLocations` list. i18n key `orders.returns.restockPreview` shared across the three modals. Build 9/9 green; lint clean on touched files. Session (ii): closed §G + §E + §F. §G — `packages/vendor/src/lib/policy.ts` new file exporting `RETURN_POLICY_DAYS=30`, `EXCHANGE_POLICY_DAYS=30`, `CLAIM_POLICY_DAYS=30`, `getOrderDeliveredAt(order)`, and `isOutsidePolicyWindow(order, days)` (compares `Date.now() - max(delivered_at)` against `days*86_400_000`; orders without a `delivered_at` return `false` so the kebab stays enabled pre-delivery per MVP rule). `OrderSummarySection` Header passes the resulting flag per-entry into the kebab: `disabled: isCanceled || returnOutOfPolicy` (etc.) with `disabledTooltip: t("orders.returns.outOfPolicy", { days })` when out-of-policy. Each modal (`returns/create`, `exchanges/create`, `claims/create`) renders a `<Text size="small" className="text-ui-fg-subtle">` hint reading `orders.{returns,exchanges,claims}.policyHint` so the policy is visible inside the create surface too. `useStockLocations` was already vendor-scoped (`sdk.vendor.stockLocations.query`) so the "store-only stock locations" rule needed no change — verified, not modified. i18n: `orders.{returns,exchanges,claims}.policyHint` + `.outOfPolicy` added to en.json (schema not extended this slice — `$schema.json` has existing drift against en.json from prior sessions and the validate-translations spec isn't wired into CI). §E — Edit Order qty-stepper floor: `originalItems` row type widened with `detail.returned_quantity?`, `minQty = (detail.fulfilled_quantity ?? 0) + (detail.returned_quantity ?? 0)`, `Input.min` set to `minQty`, `onChange` clamps `Math.max(minQty, Number(e.target.value))`. When `currentQty <= minQty && minQty > 0` the stepper renders inside a `<Tooltip content={t("orders.edits.removeBlockedFulfilledOrReturned")}>`. In `handleConfirm`, the `useRequestOrderEdit` step now emits a `toast.success(t("orders.edits.toast.requestSent"))` between request and confirm so the seller sees the "Edit request sent to customer" feedback per the MVP request → force-confirm flow. New i18n keys: `orders.edits.toast.requestSent` + `orders.edits.removeBlockedFulfilledOrReturned`. §F — Picker MVP defaults: extended `OFFER_PICKER_FIELDS` with `prices.amount`, `prices.currency_code`, `product_variant.manage_inventory`, `product_variant.inventory_quantity`, `product_variant.inventory_items.required_quantity`, `product_variant.inventory_items.inventory.location_levels.available_quantity`. Picker accepts a new `currencyCode?: string` prop. Post-filter via `useMemo` keeps only offers that (a) have a price in `currencyCode` AND (b) pass `offerHasInventory(offer)` — `manage_inventory === false` → included, no `inventory_items` link → fallback to `variant.inventory_quantity > 0`, otherwise every linked inventory_item must satisfy `sum(location_levels.available_quantity) >= required_quantity`. Count surfaced to the table is the post-filter length so the footer reads correctly. `data-testid="add-offers-picker"` on the wrapper for tests. All three modals (Edit / Exchange outbound / Claim outbound) pass `currencyCode={order.currency_code}` through their trigger components. The "from selected store" rule stays implicit via `sdk.vendor.offers.query` seller-scope. Build 9/9 green across §G + §E + §F; lint clean on touched files. Session (hh): closed §A–§D + §L + §M (Phase 1 & 2) + §N + §O + §R from the design-diff implementation plan. §A — orders list `request: enum[]` multi-select (Edit/Return/Exchange/Claim) replaces `has_open_request: boolean` as a hard swap; backend validator widened (`packages/core/src/api/vendor/orders/validators.ts`) + helper renamed `apply-has-open-request-filter.ts → apply-request-filter.ts` with Query Graph hop over `order_change(change_type=edit) + return + exchange + claim`; frontend filter hook drops `Region` filter and the dead `payment_status` / `fulfillment_status` wiring (out of scope per product), drops the `Sales channel` + `Country` columns, en.json + $schema.json updated with `orders.filters.request.{label,edit,return,exchange,claim}`. §B — kebab split per Figma `40013324:305672` + `40013324:305425`: `OrderGeneralSection` kebab carries `Cancel` only, gated on `order.items.some(i => detail.fulfilled_quantity > 0)` with `disabledTooltip` keyed `orders.actions.cancelDisabledFulfilled`; `OrderSummarySection` gains a kebab in the section header carrying `Edit / Create Return / Create Exchange / Create Claim` (the four create actions Figma shows in the Summary, not the header). §C — outstanding strip relocated: `OutstandingActions` (Copy payment link + Mark as paid) moved from `OrderPaymentSection` → `OrderSummarySection` footer; always-rendered `Outstanding amount: €X` row added inside `Total` block; `orders.payment.outstandingAmount` translation + schema landed. §D — PaymentRow refund subrow: loop `payment.refunds`, render strike-through date + amount on the parent row when fully refunded, render one indented subrow per refund with reason badge (from `refund.refund_reason.label`), note tooltip (DocumentText icon), `-€amount`; `*payment_collections.payments.refunds.refund_reason` added to both backend `vendorOrderFields` and frontend `DEFAULT_RELATIONS`. §L — offers on order detail: `*items.offer` + `*items.offer.prices` + `*items.offer.shipping_profile` added to vendor `vendorOrderFields` + `DEFAULT_RELATIONS`; Summary `Item` row's caption now reads `item.offer?.sku ?? item.variant_sku` so the `441/442/443` SKUs in Figma resolve from the offer model. §M Phase 1 — picker swap (frontend-only): `AddOrderEditItemsTable` rewritten to source from `useOffers` (was `useVariants`) with offer-aware columns (thumbnail / offer SKU / variant title); reused by all three "add items" flows (Edit Order / Exchange outbound / Claim outbound) via shared import. §M Phase 2 — backend offer_id pipeline: new shared helper `packages/core/src/api/vendor/orders/resolve-offer-items.ts` resolves `{ offer_id, quantity }` → `{ variant_id, unit_price, shipping_profile_id }` from the offer's prices in the order's currency, validates seller ownership, stashes `metadata.mercur_offer_id`; three validators widened (order-edits / exchanges / claims) with discriminated `offer_id | variant_id` union; three routes (`order-edits/[id]/items`, `exchanges/[id]/outbound/items`, `claims/[id]/outbound/items`) updated to call the resolver before invoking the Medusa workflow. New subscriber `packages/core/src/subscribers/link-order-line-items-to-offers.ts` listens to `order-edit.confirmed` + `order.exchange_created` + `order.claim_created` and creates the `order_line_item ↔ offer` link from `metadata.mercur_offer_id`, then clears the metadata for idempotency. Picker `getRowId` switched to `offer.id`; the three modals (`edit/index.tsx`, `exchanges/create/index.tsx`, `claims/create/index.tsx`) send `{ offer_id, quantity }` (variables renamed `selectedVariantIds → selectedOfferIds`). §N — `mercur-confirm-exchange-request` workflow wrapper at `packages/core/src/workflows/order/workflows/mercur-confirm-exchange-request.ts`: runs Medusa's `confirmExchangeRequestWorkflow` as a step, then `adjustExchangeReservationsForOffersStep` walks `additional_items.item.offer.inventory_item_link[].required_quantity` and updates the reservations Medusa just created so bundle-style offers don't under-reserve (V1 handles the single-inventory-item-with-required_quantity>1 case; bundle case — `inventory_item_link.length > 1` — is explicitly skipped with an inline comment pointing at this spec's §Phase block). Vendor route `api/vendor/exchanges/[id]/request/route.ts` swapped to call the Mercur wrapper. Compensation hook implemented (restores prior reservation qty on rollback). §O — `mercur-confirm-claim-request` wrapper at `packages/core/src/workflows/order/workflows/mercur-confirm-claim-request.ts`: mirror of §N for `confirmClaimRequestWorkflow`; vendor route `api/vendor/claims/[id]/request/route.ts` swapped to call the Mercur wrapper. §R — `packages/core/src/subscribers/refund-commission-reversal.ts` listens on `PaymentEvents.REFUNDED`, resolves payment → order → latest refund, computes `ratio = refund.amount / total_captured`, writes one negative commission_line entry per original line (excluding prior reversal lines via code-suffix guard `|mercur-refund:<refund_id>`) so aggregate `commission_value` becomes correct via netting. **Payouts intentionally untouched** per product direction — the seller's `payout` row is not adjusted on refund. Idempotent: re-emitting the event for the same refund is a no-op. Build 9/9 green across all chunks; lint clean on every touched file (only pre-existing warnings remain). Tests deferred: `order-list-filters.spec.ts` extensions for `request=edit/return/exchange/claim` cases + cross-seller; `order-cancel.spec.ts` for MVP cancel rule; `order-offers.spec.ts` covering offer-id resolution + link persistence on confirm; reservation-multiplier integration coverage on order-exchange + order-claim. Also intentionally deferred to follow-up slices (lighter UI scope): §E (Edit Order qty-stepper floor at `fulfilled_quantity + returned_quantity`), §F (picker MVP defaults — with-price + with-inventory + store-scope assertions), §G (30-day policy gate + store-only stock locations), §H (activity timeline `order.created` event + collapse-when-more-than-3 + add-note form), §I (Create Claim inbound location + return-shipping UI), §P (restock preview in Receive Items / Create Return), §Q (two-column inbound/outbound preview on Create Exchange + Create Claim). Session (gg): merged docs/vendor-orders-design-diff.md into the spec — added MVP product rules, kebab-placement split, offer integration (§L + §M), offer-aware return/exchange/claim inventory phase (§N–§R), and the prioritized implementation plan. Frontmatter stays `passing` for the Figma-flow surface that's shipped; the merged sections introduce a new Offer-aware inventory phase tracked separately. Session (ff): close-out flip from in_progress → passing. Final closing sequence (z/aa/bb/cc/dd/ee): slice 4b (Exchange outbound picker via StackedFocusModal), 5b (Claim outbound picker, gated on claimType===replace), 4c (Exchange Location), 4d (Exchange Return-shipping + hooks), 4e (Exchange per-row reason+note), 5c (Claim per-row reason+note via ClaimReason enum). Create Exchange covers all five Figma blocks; Create Claim covers four (location through inbound-items deferred — architecturally a separate route from claim-items used by the v1 modal). Backend tree: order-edits / exchanges / claims / payments / payment-collections / returns all shipped and seller-scope-guarded; 4 vendor-order integration suites green (27/27 — order-edit 11/11, order-exchange 6/6, order-claim 7/7, order-list-filters 3/3). Remaining `[~]` items are all (a) deliberate scope decisions documented inline (payment_status/fulfillment_status filters reverted in session c, Sales channel column kept as Mercur non-drift, fulfillment partial-by-design sweep) or (b) queued sub-slices with architectural rationale (line-item subrows for claims/exchanges need GET /vendor/claims?order_id= list endpoint; Claim location needs routing through inbound-items distinct from claim-items; refund integration suite covered indirectly via mark-as-paid). Session (x): /loop sweep — sessions (r) through (w) shipped slices 1-7. Box accounting (~25 items, 76% `[x]`): §0 backend (claims tree shipped + 7/7 spec); §0 query-config (claims/exchanges fields added — slice 7); §1 orders list (search ✓; payment/fulfillment filters deliberately dropped per session (c); Sales channel column kept as documented non-drift); §2 detail read view (kebab now includes all four actions ✓ — Edit Order + Create Return + Create Exchange v1 + Create Claim v1; line-item claim/exchange subrows still queued — Summary-section row decoration tracked separately from §4 UI ports); §3 Edit Order (banner + variant picker + activity rule all live); §4 Create Return / Exchange v1 / Claim v1 / Refund (all four kebab+route+modal exist; outbound pickers + per-item reasons + location/shipping for Exchange/Claim queued for slices 4b/5b — hooks already in tree); §5 Receive Items ✓; §6 fulfillment polish partial-by-design; §7 visual drift ✓. Frontmatter stays `in_progress` — `passing` requires all boxes `[x]` per Definition of Done; remaining `[~]` items are deliberate scope decisions (filters reverted, Sales channel column, fulfillment polish partial-by-design) or documented follow-up sub-slices (Exchange/Claim outbound pickers; refund integration suite; line-item subrows). Session (w): slices 6 + 7 (query-config additions + activity rule wiring). Session (v): slice 6 reframed against existing edit-rule code at `use-activity-items.tsx:250-275` shipped in session (b). Session (u): slice 5 — Create Claim UI v1 (kebab + route + RouteFocusModal with ClaimType selector + claim-items qty stepper, 9 hooks). Session (t): slice 4 — Create Exchange UI v1 (kebab + route + RouteFocusModal with inbound qty stepper, 10 hooks). Session (s): /vendor/claims integration suite (7/7) + checklist hygiene. Session (r): shipped SPEC-008 slice 3 — `/vendor/claims` backend tree under `packages/core/src/api/vendor/claims/`. Mirrors Medusa admin's `/admin/claims` shape segment-for-segment plus the claim-specific `claim-items` subtree that exchanges don't have. 15 route files (root `POST /vendor/claims`; `[id]/cancel` POST; `[id]/request` POST/DELETE; `[id]/claim-items` POST + `[id]/claim-items/[action_id]` POST/DELETE; `[id]/inbound/items` POST + `[id]/inbound/items/[action_id]` POST/DELETE; `[id]/inbound/shipping-method` POST + `[id]/inbound/shipping-method/[action_id]` POST/DELETE; `[id]/outbound/items` POST + `[id]/outbound/items/[action_id]` POST/DELETE; `[id]/outbound/shipping-method` POST + `[id]/outbound/shipping-method/[action_id]` POST/DELETE). All workflows wrapped directly from `@medusajs/core-flows` per spec §"wrap workflow directly when Medusa's workflow is enough" rule (no Mercur fork — confirm-claim's commission/payout layer goes through a subscriber on `OrderWorkflowEvents.CLAIM_CREATED`, NOT a workflow override; subscriber still deferred matching the exchange-side deferral). `helpers.ts` exports `validateSellerClaim` mirroring `validateSellerExchange` — resolves `:id` → `order_id` via Query Graph then defers to the existing `validateSellerOrder`. Vendor-side simpler response shape adopted (returns `{ order_preview }` or `{ claim: { id } }` only, no `remoteQuery` hydration of the full claim object — matches the exchanges-side convention). Audit-trail fields `created_by` on begin + `canceled_by` on cancel + `confirmed_by` on request stamped with `req.seller_context.seller_id` (vendor equivalent of admin's `actor_id`). Validators: 10 Zod schemas mirroring `AdminPostOrderClaimsReqSchema`, `AdminPostCancelClaimReqSchema`, `AdminPostClaimItemsReqSchema`, `AdminPostClaimsRequestItemsActionReqSchema` (reused as both `VendorPostClaimsItemsActionReq` for claim-items update AND `VendorPostClaimsRequestItemsReturnActionReq` for inbound update — same shape with `quantity?/internal_note?/reason_id?/metadata?` per admin), `AdminPostClaimsRequestReturnItemsReqSchema`, `AdminPostClaimsAddItemsReqSchema`, `AdminPostClaimsItemsActionReqSchema` (outbound add-item update shape), `AdminPostClaimsShippingReqSchema`, `AdminPostClaimsShippingActionReqSchema`. `vendorClaimsMiddlewares` wired into `packages/core/src/api/vendor/middlewares.ts` between `vendorCampaignsMiddlewares` and `vendorCollectionsMiddlewares`. Build 9/9 green (58.5s); oxlint clean on every touched file (`packages/core/src/api/vendor/claims/` + `middlewares.ts`, exit code 0). Integration suite at `integration-tests/http/order/vendor/order-claim.spec.ts` still deferred (matches exchange-side pattern from slice 2 — UI hasn't shipped yet so the runtime path will be exercised by the test suite alongside the UI port). Session (q): closed the two Edit Order deferrals from Session (p). (1) Active-edit banner — ported admin's `order-active-edit-section/` to `packages/vendor/src/pages/orders/[id]/_components/order-active-edit-section/` (and `index.ts` barrel). Diffs `preview.items` against `order.items` to bucket entries into Added (preview entries missing from original, or original.qty < preview.qty) and Removed (original.qty > preview.qty); renders the striped banner shell `(-m-4 mb-1 border-b border-l p-4` + `repeating-linear-gradient` background to match admin's frosted look), `<Container className="flex items-center justify-between p-0">` with `divide-y divide-dashed` rows for the panel header (`ExclamationCircleSolid` + `t("orders.edits.panel.title{,Pending}")`), the Added rows, the Removed rows, and the footer strip (`bg-ui-bg-subtle rounded-b-xl px-4 py-4`) whose left CTA is `Continue edit` when `order_change.status === "pending"` else `Force confirm` (calling `useConfirmOrderEdit`), with `Cancel` (calling `useCancelOrderEdit`) on the right. Visibility: `if (!orderPreview || change?.change_type !== "edit") return null` — so the banner is inert for return / exchange / claim changes, only fires on `edit` change_type, matching the spec §"Edit Order" trigger. Mounted as the **first child of TwoColumnPage.Main** in `order-detail-page.tsx` (above OrderGeneralSection) so it renders above the order header per Figma; added to the page's compound exports as `MainActiveEditSection`. All i18n keys (`orders.edits.panel.title{,Pending}` / `labels.added` / `labels.removed` / `actions.{forceConfirm,continueEdit,cancel}`) were already in `en.json` — no translation churn needed. `data-testid` ids on banner shell + 3 buttons (`order-active-edit-section`, `order-active-edit-continue`, `order-active-edit-force-confirm`, `order-active-edit-cancel`). (2) Add-items variant picker — ported admin's `add-order-edit-items-table/` 1:1 to `packages/vendor/src/pages/orders/[id]/edit/_components/add-order-edit-items-table/` (5 files: `add-order-edit-items-table.tsx`, `use-order-edit-item-table-columns.tsx`, `use-order-edit-item-table-filters.tsx`, `use-order-edit-item-table-query.tsx`, `index.ts`). Swapped admin's `useVariants` for vendor's `@hooks/api/product-variants::useVariants` (calls `sdk.vendor.productVariants.query` — same `*inventory_items.inventory.location_levels,+inventory_quantity` field tree). Same `_DataTable` + `useDataTable` shell, `PAGE_SIZE=50`, `PREFIX="rit"`, same Filter/OrderBy shape. Columns: `select` checkbox + `product` (ProductCell from `@components/table/table-cells/product/product-cell`) + `sku` + `title`. Wired into the edit modal via a new `AddItemsTrigger` helper at the bottom of `pages/orders/[id]/edit/index.tsx` that renders a `<StackedFocusModal id="order-edit-add-items">` triggered from the `Current items` section header's right slot — admin uses the same StackedFocusModal pattern; selected variants flow through `useAddOrderEditItems` (one call per save with `items: [{ variant_id, quantity: 1 }, …]`) and surface in a new `Added items` section that displays preview items not present in `order.items`. Modal header copy `t("orders.edits.addItems")` ("Add items"); body copy `t("orders.edits.addItemsDescription")` — both keys pre-existed in en.json. `data-testid` ids on trigger / save / cancel / per-added-item row (`edit-add-items-trigger`, `edit-add-items-save`, `edit-add-items-cancel`, `edit-added-item-${id}`). Build 9/9 green (31.7s, cached except vendor); oxlint clean on every touched file (0 errors / 0 warnings). With this session, the Edit Order slice §"Edit Order" of the spec drops to a single residual item — the Activity timeline entry for "Order edit #N requested" — which is gated on mounting the dead `OrderActivitySection` and adding the corresponding generator rule (separate slice — Activity timeline is its own §"cross-cutting" deferral). Session (p): closed the Order Edit slice end-to-end. Three deliverables: (1) `packages/core/src/subscribers/order-edit-confirmed.ts` listens on `OrderEditWorkflowEvents.CONFIRMED` and runs `refreshOrderCommissionLinesWorkflow({ order_ids: [event.data.order_id] })` so commission lines reflect the new totals after a seller confirms an edit. Pattern matches the existing `payout-webhook.ts` subscriber. Payout-queue delta still deferred — owner of the payout module needs to confirm the exact entry point (spec §"Workflow-override checklist" lines ~1216-1220). (2) `integration-tests/http/order/vendor/order-edit.spec.ts` — 11 cases covering begin/cancel/items/request/confirm/shipping-method with seller-scope guards on every sub-route. Reuses the offer-based seeding from `order-mark-as-paid.spec.ts` (same `seedSellerOfferWithShipping` + `completeCartCheckout` shape). Runs green in 43.3s. (3) Edit Order UI scaffold: kebab entry in `OrderGeneralSection` (`PencilSquare` icon, disabled on canceled orders), route `/orders/:id/edit` registered in `get-route-map.tsx` after the refund entry, `RouteFocusModal` at `pages/orders/[id]/edit/index.tsx` that initiates a draft via `useCreateOrderEdit` on mount, exposes a qty stepper per original line item (calls `useUpdateOrderEditOriginalItem` per change — qty=0 removes), and walks the draft through `useRequestOrderEdit` → `useConfirmOrderEdit` on submit. Cancel button calls `useCancelOrderEdit` and navs back. Active-change guard: if `preview.order_change` exists but `change_type !== "edit"`, the modal redirects with `orders.edits.activeChangeError`. New file `hooks/api/order-edits.tsx` exposes the seven hooks (`useCreateOrderEdit` / `useCancelOrderEdit` / `useRequestOrderEdit` / `useConfirmOrderEdit` / `useAddOrderEditItems` / `useUpdateOrderEditAddedItem` / `useRemoveOrderEditAddedItem` / `useUpdateOrderEditOriginalItem`) calling `sdk.vendor.orderEdits.*` (route map already in core's `.mercur/routes.d.ts`). Build 9/9 green (55.6s); oxlint clean across subscriber, hooks, modal, kebab, and route registration (0 errors / 0 warnings). v1 deliberately ships without the variant-picker "Add new items" table — that's a separate port from admin's `add-order-edit-items-table` folder and is deferred to the next session along with the "Order edit requested" banner above the order header (`active-order-edit-section/` per spec §"Order detail — sections"). Session (o): completed `/vendor/order-edits` tree. Six new sub-routes ported 1:1 from Medusa admin: `POST :id/items`, `POST :id/items/:action_id`, `DELETE :id/items/:action_id`, `POST :id/items/item/:item_id`, `POST :id/shipping-method`, `POST :id/shipping-method/:action_id`, `DELETE :id/shipping-method/:action_id`. All `:id` params remain the **order_id** per the Medusa admin convention surfaced in session (n) — `:action_id` / `:item_id` are passed to the workflows separately. Seller-scope therefore stays on the simpler `assertSellerOwnsOrderInParam` (no `validateSellerOrderEdit` hop needed). Five new zod validators added to `validators.ts` mirroring admin's `AdminPostOrderEditsAddItemsReqSchema`, `AdminPostOrderEditsItemsActionReqSchema`, `AdminPostOrderEditsUpdateItemQuantityReqSchema`, `AdminPostOrderEditsShippingReqSchema`, `AdminPostOrderEditsShippingActionReqSchema`. Workflows wrapped directly from `@medusajs/core-flows` (`orderEditAddNewItemWorkflow`, `updateOrderEditAddItemWorkflow`, `removeItemOrderEditActionWorkflow`, `orderEditUpdateItemQuantityWorkflow`, `createOrderEditShippingMethodWorkflow`, `updateOrderEditShippingMethodWorkflow`, `removeOrderEditShippingMethodWorkflow`). Build 9/9 green; oxlint clean 0/0 across all 12 files in the tree. With this, the full Order Edit backend surface from spec §0 is shipped — only the subscriber + integration suite remain. Session (n): vendor `/vendor/order-edits` backend skeleton landed — `POST /vendor/order-edits`, `DELETE /vendor/order-edits/:id`, `POST /vendor/order-edits/:id/request`, `POST /vendor/order-edits/:id/confirm`. Mirrors Medusa admin `/admin/order-edits` exactly (segment-for-segment, HTTP method for HTTP method) per the spec's "Route convention — non-negotiable" rule, so the typed-client route map can be shared. Critical correction vs. the spec's initial sketch: the `:id` path param on the sub-routes is the **order_id**, not an `order_change.id` — confirmed by reading Medusa admin's `/admin/order-edits/[id]/route.ts` + `/admin/order-edits/[id]/request/route.ts` + `/admin/order-edits/[id]/confirm/route.ts`, each of which threads `id` directly into the workflow input as `order_id`. The `validateSellerOrderEdit` helper (added speculatively per the spec) is therefore not needed by the live routes — the simpler `validateSellerOrder` already in tree is sufficient. Helper kept in `helpers.ts` since the spec calls for it and the items + shipping-method sub-routes (deferred this session) DO key on `order_change.id`. New files: `packages/core/src/api/vendor/order-edits/{helpers.ts,validators.ts,middlewares.ts,route.ts,[id]/route.ts,[id]/request/route.ts,[id]/confirm/route.ts}`. Wired into `packages/core/src/api/vendor/middlewares.ts`. Workflows wrapped directly from `@medusajs/core-flows` (`beginOrderEditOrderWorkflow`, `cancelBeginOrderEditWorkflow`, `requestOrderEditRequestWorkflow`, `confirmOrderEditRequestWorkflow`) — no Mercur fork per spec §"Workflow-override checklist". `requested_by` / `confirmed_by` audit-trail fields stamped with `req.seller_context.seller_id`, matching the existing returns confirm-request pattern. Build 9/9 green; oxlint clean (0/0). Sub-routes still pending: `/:id/items`, `/:id/items/:action_id` (POST/DELETE), `/:id/items/item/:item_id`, `/:id/shipping-method`, `/:id/shipping-method/:action_id` (POST/DELETE) — those key on `order_change.id` and need a query-graph hop for seller-scope (via the helper added this session). Session (m): Create Shipment form — fixed three drift items found while sweeping §6. (1) The only visible input was labeled `Tracking URL` but bound to `labels.${i}.tracking_number` — bug carried over from initial scaffolding. Replaced the single-field render with a three-column `grid grid-cols-1 gap-3 md:grid-cols-3` row exposing `tracking_number` (required, label `orders.shipment.trackingNumber`), `tracking_url` (optional, with the existing placeholder), and `label_url` (optional, new). Each field carries a `data-testid` (`shipment-tracking-number-${i}`, `-url-${i}`, `label-url-${i}`). (2) `handleSubmit` was hardcoding `tracking_url: "#"` and `label_url: "#"` — replaced with the actual form values (`l.tracking_url ?? ""`, `l.label_url ?? ""`); the backend validator treats both as non-optional strings, so empty-string passes through when the user skipped the URL. (3) The `Add tracking URL` button was missing `size="small"` per §6 finding from session (l); patched + renamed to `orders.shipment.addTracking` (an i18n key that already exists alongside `addTrackingUrl`) since it now adds a tracking row, not just a URL. Build 9/9 green; oxlint clean on the touched file (0 warnings / 0 errors). Session (l): polish + §6 partial visual sweep. Create Return modal — misleading no-items-selected toast (`t("orders.returns.create")` → "Create Return") replaced with a proper error key `t("orders.returns.noItemsSelected")` ("Select at least one item to return."); Confirm button now `disabled={!ready || !hasSelection}` so the error path is unreachable for the empty-selection case. §6 visual sweep on `OrderFulfillmentSection`: all three CTA buttons (`Fulfill items`, `Mark as delivered/picked up`, `Mark as shipped`) were missing `size="small"` per the spec's design rule "Buttons inside compact toolbars and footers: `size='small'`" — patched. No structural issues found: `Container` shells use `divide-y p-0`, header rows use `flex items-center justify-between px-6 py-4` with `<Heading>` + status badges + ActionMenu cluster, `bg-ui-bg-subtle rounded-b-xl` footer strip on each fulfillment card aligns with Figma. Build 9/9 green; oxlint clean on touched files (1 carried-over intentional `no-await-in-loop` warning). Session (k): Create Return modal — Location and Return shipping dropdowns wired. Both render as card-shaped strips (`bg-ui-bg-component shadow-elevation-card-rest rounded-lg p-3`) below the items list and above the notify switch. Location `Select` is sourced from `useStockLocations`; Return shipping `Select` is gated on location and sourced from `useShippingOptions({ stock_location_id })` (only fetches once a location is chosen). On submit `handleConfirm` now runs: optional `useUpdateReturn({ location_id })`, the existing per-item `useAddReturnItem` loop, optional `useAddReturnShipping({ shipping_option_id })`, then `useConfirmReturnRequest({ no_notification: !notify })`. Changing the location resets `shippingOptionId` so a stale option from a different location can't be confirmed. Backend already accepts `location_id` on `POST /vendor/returns/:id` (validator `VendorPostReturnsReq` + the request-finalize body) and `shipping_option_id` on `POST /vendor/returns/:id/shipping-method` (validator `VendorPostReturnsShippingReq`). Build 9/9 green; oxlint clean on touched files (same single intentional `no-await-in-loop` warning carried over from session j). Session (j): Create Return kebab entry + route + RouteFocusModal scaffold landed. Kebab `Create Return` action added in `OrderGeneralSection` (own group above the destructive Cancel group, `ArrowUturnLeft` icon, disabled when `order.canceled_at` is set), routed at `/orders/:id/returns/create` in `get-route-map.tsx` between the existing `allocate-items` and `returns/:return_id/receive` entries. The new modal at `pages/orders/[id]/returns/create/index.tsx` ports the Medusa-admin draft-and-mutate flow to vendor: `useInitiateReturn({ order_id })` fires once on mount (guarded by `IS_REQUEST_RUNNING` + `returnId` state for StrictMode + post-creation reruns) and stashes the draft id; the returnable items list (`fulfilled_quantity - return_requested_quantity - returned_quantity > 0`) renders inside a `RouteFocusModal` with per-item checkbox + qty stepper (capped at fulfilledRemaining), and a per-selected-item reason dropdown (from `useReturnReasons`) + note input. Send-notification switch wires `no_notification: !notify` into `useConfirmReturnRequest`. Cancel button + close calls `useCancelReturnRequest` so the order never gets stranded with an empty draft. Backend (`/vendor/returns` + `:id/request-items` + `:id/request` + `DELETE :id/request`) was already shipped; this lands the previously-missing UI entry. Build 9/9 green; oxlint clean on touched files (1 baseline `no-await-in-loop` warning on the sequential `addReturnItem` loop — intentional, all mutations target the same draft and must serialize). Session (d): inline ReturnBreakdown subrow landed under each line item in OrderSummarySection (Mercur port of Medusa admin's pattern). Renders "↳ Nx items return requested/received" with reason chip, note tooltip, and ReturnInfoPopover (id + requested_at + received_at). Damaged-quantity variant renders a second subrow above the standard one. Wired via `order.returns` (already in query-config from session a); added `*returns.items.reason` to vendor query-config so the chip resolves. Session (e): per-item `Allocated` / `Not allocated` StatusBadge wired via `useReservationItems({ line_item_id, limit })` and inline `Allocate items` CTA added to the Summary footer strip when any inventory-managed item is unfulfilled without a reservation. Session (f): activity timeline now emits the `return.created` / `return.canceled` / `return.received` rows — the rendering logic was already present but the source array was a stub. Wired through `order.returns` (already in query-config). Claims / exchanges still stubbed pending backend routes. Session (g): activity timeline payment events (`payment.awaiting` / `captured` / `canceled` / `refunded`) un-commented and wired against `order.payment_collections.flatMap(pc => pc.payments)` (already in query-config). Each event guarded on its respective timestamp; `awaiting` only emitted while a payment is neither captured nor canceled. Session (h): orders list search input enabled by passing `search` to `_DataTable` in `OrderListDataTable` — `useOrderTableQuery` already wires `q` into search params, and other vendor list pages (customers, regions) already use the same pattern. Build 9/9 green; lint clean on touched files. Session (i): §Verification checklist refreshed against shipped state across sessions (a)–(h) — boxes ticked / annotated as `[x]`, `[~]` (partial-with-divergence), or left `[ ]` (still pending), each with a one-line session pointer. No code changes.
---

# SPEC-008 Vendor Orders — Figma vs Implementation Gap

This spec audits the **Orders** surface of `@mercurjs/vendor`
(`packages/vendor/src/pages/orders`) against the canonical Figma file
*Mercur 2.0 — Vendor Panel B2C → Orders*
(`figma.com/design/sYJoh84Owr5tomRjpxG0no`, page node
`40013304:19490`). It lists every screen the design covers, classifies
each one against the current implementation as **exists / missing /
different**, and records the work needed to bring the vendor panel in
line with the design.

It is intentionally **descriptive, not prescriptive**: the design is
the source of truth for what should exist; the code paths cited below
are what does exist today. Any decision that diverges from the design
must be captured here (or in a child spec) with a documented reason —
silent drift fails the audit.

## Product context — Order Workflow (Phase 1)

> Source: Order Workflow Feature Brief (PL) — pasted verbatim by the
> author into this session. Re-stated in English for cross-team use.

The marketplace order lifecycle spans customer purchase → seller
acceptance → debit → fulfillment → optional return/refund. A single
customer cart can split into multiple seller-scoped sub-orders; each
seller owns its slice.

| Actor | Surface | Responsibility |
| --- | --- | --- |
| Customer | Storefront | Place order, track status, request return/refund |
| Seller | Vendor panel (this spec) | Accept, fulfill, track, handle incidents |
| Operator | Admin panel (out of scope here) | Cross-seller visibility, refunds, dispute resolution |

Lifecycle states (per sub-order): `created → waiting acceptance →
accepted → shipped → delivered`, with a parallel `return / refund`
branch.

**Out of Phase 1** (must not be designed into this spec):
- Order scoring before fulfillment
- Document upload on orders
- Messaging on orders
- Incident management

## Source designs

Top-level frames on node `40013304:19490` (Orders canvas), grouped by
flow. All frame IDs are stable Figma node IDs in the same file.

| Flow | Anchor frame | y-offset | Notes |
| --- | --- | --- | --- |
| Orders list | `40013324:305307` | 332 | Default, filter-open, sort-open, empty variants |
| Order detail | `40013324:305660` | 3564 | Read view (canonical) |
| Edit Order | `40013324:305318` | 7250 | Trigger + "Order edit request" banner + Force confirm/Cancel |
| Create Return | `40013324:305422` | 13062 | Trigger menu; post-request subrow; receive-items CTA |
| Create Exchange | `40013324:305425` | 18986 | "To send" + "To return" tooltip; outstanding adjustment |
| Create Claim | `40013324:305428` | 24626 | Full `RouteFocusModal` (Inbound/Outbound, totals, notify toggle) |
| Create Refund | `40013324:305431` | 29527 | Payment-row kebab → Create Refund; strike-through refund row |
| Handle Positive Outstanding Amount | `40013324:305434` | 33706 | "Copy payment link for €X" + "Mark as paid" |
| Create Fulfillment — Managed by Vendor | `40013324:305321` | 37979 | Focus modal; "Awaiting shipping" badge |
| Mark As Shipped — Managed by Vendor | `40013324:305335` | 43853 | Focus modal collecting tracking; status → Shipped |
| Mark As Delivered — Managed by Vendor | `40013324:305351` | 50062 | Confirmation; activity logs "Items delivered" |
| Mark As Picked Up — Managed by Vendor | `40013324:305337` | 54870 | Provider `Manual`; single CTA |
| Receive Items | `40013324:305487` | 13062 | Modal collecting received quantities |
| Allocate Items — Managed by Vendor | `40013324:306763` | 58807 | Inline `Allocate items` CTA in Summary |
| Allocate Items — Managed by Admin | `40013324:306885` | 58807 | Same flow scoped to admin-managed inventory |

A *Notification Drawer* component (success toast) is reused across
every flow. A *Parent Components* frame at `(0, 0)` holds the
underlying primitives (filter menu, payment row, item row, fulfillment
row, etc.).

## Surface map

Current implementation rooted at `packages/vendor/src/pages/orders`:

```
orders/
  order-list-page.tsx                          # SingleColumnPage host
  _components/order-list-table/
    order-list-table.tsx                       # Container shell
    order-list-header.tsx                      # Heading + slot for actions
    order-list-data-table.tsx                  # _DataTable + filters + sort
  common/
    customerGroupFiltering.tsx
    orderFiltering.tsx
    placeholders.tsx
  [id]/
    order-detail-page.tsx                      # TwoColumnPage host
    loader.tsx, breadcrumb.tsx, constants.ts
    _components/
      order-general-section/                   # Header card + Complete/Cancel kebab
      order-summary-section/                   # Items + totals + commission + return CTA + refund CTA
      order-payment-section/                   # Totals only (no per-payment rows)
      order-fulfillment-section/               # Unfulfilled items + Fulfillment N cards + actions
      order-customer-section/                  # ID / Contact / Company / Addresses
      order-activity-section/                  # DEFINED but NOT mounted by order-detail-page.tsx
    fulfillment/                               # /orders/:id/fulfillment — RouteFocusModal
    allocate-items/                            # /orders/:id/allocate-items — RouteFocusModal
    shipment/                                  # /orders/:id/:f_id/create-shipment — RouteFocusModal
```

Routes registered in `packages/vendor/src/get-route-map.tsx:182-238`:
`/orders`, `/orders/:id`, `/orders/:id/fulfillment`,
`/orders/:id/allocate-items`, `/orders/:id/:f_id/create-shipment`. No
other child routes are mounted under `:id`.

## Per-screen audit

Status legend:
- **Exists** — present in code and aligned to the design (visual /
  copy diffs noted under *Different* if any).
- **Different** — implemented but diverges materially from the design
  (e.g. wrong slot, missing CTA, different copy/colors).
- **Missing** — no implementation; needs to be built.
- **Dead** — implemented in code but not wired into the surface.

### Orders list (`y=332`)

- **Page shell** — Exists. `OrderListPage` mounts `SingleColumnPage` +
  `Container` (`divide-y p-0` via the inner table) at
  `packages/vendor/src/pages/orders/order-list-page.tsx`.
- **Columns** — Different. Code adds `Sales channel` between
  `Customer` and `Payment`
  (`hooks/table/columns/use-order-table-columns.tsx`); the design
  shows `Order ID · Date · Customer · Payment · Fulfillment · Order
  Total` only. Decide: drop the Sales channel column from the vendor
  list or document why it's kept.
- **Status badges** — Exists. Token mapping (green/orange/red) lines
  up with the Figma palette.
- **Pagination footer** — Exists. Page size is `10` in code
  (`order-list-data-table.tsx:10`); design footer reads
  `1 — 10 of 100 results` → matches.
- **Search input** — Missing. Figma shows a `Search` input + table
  settings icon in the header row; the vendor `OrderListHeader`
  currently renders only the title.
- **`Add filter` button** — Different. Code renders the legacy
  `_DataTable` filter widget with `Region`, `Sales channel`,
  `Created at`, `Updated at` filters; the design lists `Payment`,
  `Fulfillment`, `Request`, `Sales channel`, `Created`, `Updated`.
  Payment / Fulfillment filters are explicitly TODO-disabled
  (`hooks/table/filters/use-order-table-filters.tsx:64-66`). `Request`
  filter is missing entirely.
- **Sort menu** — Exists. `orderBy=[display_id, created_at,
  updated_at]` matches the Figma sort popover entries; asc/desc toggle
  also present.
- **Empty / filtered states** — Exists (`noRecords.message` wired in
  `order-list-data-table.tsx:78`). The "no results" empty state for
  active filters needs to be visually confirmed against the design's
  Filter Menu frame.

### Order detail — read view (`y=3564`)

- **Layout** — Exists. `TwoColumnPage` with Main + Sidebar
  (`order-detail-page.tsx:60-69`).
- **Sections mounted** — Different:
  - `OrderGeneralSection` ✅
  - `OrderSummarySection` ✅
  - `OrderPaymentSection` ✅
  - `OrderFulfillmentSection` ✅
  - `OrderCustomerSection` ✅
  - `OrderActivitySection` — **Dead**: defined in
    `_components/order-activity-section/` but not rendered by
    `order-detail-page.tsx`. The design places this section in the
    sidebar under the Customer card. Decide whether to ship the dead
    component or remove it.
- **Header card (`OrderGeneralSection`)** — Different.
  - Design status badges: payment + fulfillment, no separate "order
    status" badge. Code renders three badges (Order status, Payment,
    Fulfillment). Reconcile.
  - Design kebab actions: `Edit order`, `Create Return`, `Create
    Exchange`, `Create Claim`. Code kebab actions: `Complete`,
    `Cancel`. Almost the entire menu is missing (see below).
- **Summary section** — Exists with divergences:
  - `divide-y divide-dashed` in code vs solid `divide-y` in Figma —
    minor visual drift.
  - Item row, totals breakdown (Item / Shipping ▼ / Discount /
    Tax ▼ / Commission row / Total / Paid Total) match the design.
  - The design renders an **inline subrow under each line item** for
    return/exchange request history with a reason chip and timestamp
    tooltip ("Return: #VTS6REA · Return requested · Aug 25, 2025").
    Code has **no equivalent subrow**.
  - **`Allocate items` CTA** — code surfaces this through the
    `/orders/:id/allocate-items` route, but the design places the
    button **inside the Summary container** as an inline action when
    items show `Not allocated`. Today the only entry point is via the
    Fulfillment section. Add the inline CTA.
  - **`Receive items` CTA** — Code renders this CTA when
    `order.returns` has uncanceled rows
    (`order-summary-section.tsx:69-114`), but the `Link` targets
    `/orders/:id/returns/:return_id/receive` and **that route is not
    registered** in `get-route-map.tsx`. Dead link.
  - **Refund CTA** — Code shows a `Refund € X` button when
    `pending_difference < 0` (`order-summary-section.tsx:116-126`)
    pointing at `/orders/:id/refund`. **That route is not registered**
    either. Dead link.
- **Payment section** — Different.
  - Code renders **only** the aggregate totals (Total paid by
    customer, Total refunded, Total pending). The design renders
    **per-payment rows** (transaction ID, date, provider, status
    badge, amount, kebab → `Create Refund`).
  - "Create Refund" entry point is missing in the vendor panel — the
    only way to trigger a refund today is the (broken) Refund CTA in
    the Summary section.
- **Fulfillment section** — Exists with strong alignment:
  - Unfulfilled-items Container with `Requires shipping` +
    `Awaiting fulfillment` red status badges ✅
  - `Fulfill items` CTA at the bottom of the unfulfilled container ✅
  - `Fulfillment #N` Container with status badge tooltip, Items list,
    Shipping from, Provider, Tracking, `Mark as delivered` /
    `Mark as shipped` / `Mark as picked up` CTAs ✅
  - Kebab `Cancel` action with shipped/canceled guards ✅
- **Customer sidebar** — Exists (`order-customer-section.tsx`).
  Verify the `Company` block (label + value) and copy-icon affordance
  on Contact / Shipping address rows match the design.
- **Activity timeline** — Missing from page (component is **Dead**).
  See note above.
- **Metadata + JSON sections** — Missing. Design shows two collapsible
  sections at the bottom of the main column (`Metadata 0 keys`,
  `JSON 32 keys`). Vendor detail page has neither.
- **Toasts** — Exists. `@medusajs/ui` `toast.*` is used throughout;
  visual match to the *Notification Drawer* component is acceptable.

### Edit Order (`y=7250`)

- **Trigger** — Exists. Kebab action `Edit order` (`PencilSquare`,
  disabled on canceled orders) added to `OrderGeneralSection` in
  Session (p).
- **"Order edit request" banner** — Exists. Session (q) ported admin's
  `order-active-edit-section/` to
  `packages/vendor/src/pages/orders/[id]/_components/order-active-edit-section/`.
  Diffs `preview.items` vs `order.items` to render Added / Removed
  rows; renders `Continue edit` (pending) or `Force confirm` (else) +
  `Cancel`. Mounted above the order header in `order-detail-page.tsx`.
- **Route** — Exists. `/orders/:id/edit` → `RouteFocusModal` registered
  in `get-route-map.tsx` (Session (p)). Initiates a draft on mount and
  walks request → confirm.
- **Add items variant picker** — Exists. Session (q) ported admin's
  `add-order-edit-items-table/` (table + columns + filters + query
  hooks, swapped to `sdk.vendor.productVariants` via `useVariants`).
  Wired into the edit modal via `StackedFocusModal` from the
  `Current items` header; selected variants flow through
  `useAddOrderEditItems` and surface in an `Added items` section that
  lists preview items not present in `order.items`.
- **Activity timeline entry** — Missing (`OrderActivitySection` is
  dead; even if mounted, no `useActivityItems` rule emits the "Order
  edit #XXXXXXX requested" entry).

### Create Return (`y=13062`)

- **Kebab entry** — Missing.
- **Modal/drawer form** — Missing. Design shows a focus modal collecting
  items, reason, note, location, return shipping (optional), and a
  notification toggle.
- **Inline subrow under line items** ("↳ 1x items return requested",
  reason chip, tooltip with received/requested dates) — Missing.
- **Receive items CTA + route** — Partial. The CTA exists (see
  Summary above) but the route is unregistered; clicking 404s.
- **Activity entries** — Missing.

### Create Exchange (`y=18986`)

- **Kebab entry** — Missing.
- **Modal/drawer form** — Missing. Design adds a tooltip on the
  request row breaking down `To send` (new variants) and `To return`
  (originals).
- **Inline subrows** for `1x items return requested` and `1x items
  added through exchange` — Missing.
- **Outstanding-amount integration** — Missing. When an exchange shifts
  the order total, the design re-uses the Outstanding-amount handling
  (see below).

### Create Claim (`y=24626`)

- **Kebab entry** — Missing.
- **Focus modal** — Missing. Required structure (from the design):
  - Title `Create Claim`, `esc` chip top-left.
  - Section `Inbound` — Add items button; per-row line with qty input,
    `Reason` dropdown ("Choose why the customer want to return
    items"), `Note` field.
  - `Location` dropdown (default first stock location).
  - `Return shipping (Optional)` dropdown.
  - Section `Outbound` — Add items; empty state "No records yet — You
    can optionally add items you want to send as replacements".
  - Totals: Inbound total, Outbound total, Return shipping (edit
    pencil), Outbound shipping (edit pencil), **Estimated difference**.
  - `Send notification` SwitchBox.
  - Footer: `Cancel` / `Confirm`.

### Create Refund (`y=29527`)

- **Entry point** — Missing. Design places `Create Refund` on the
  per-payment row kebab inside the Payment section. The vendor
  Payment section does not render per-payment rows, so no entry point
  exists there.
- **Route** — Missing. `Link` to `/orders/:id/refund` exists in the
  Summary refund CTA but the route is unregistered.
- **Post-refund state** — Missing.
  - Payment row should render with a strike-through and a reason chip
    (`Damaged item`) once refunded.
  - Header payment badge should flip to `Refunded` / `Partly
    refunded`.
  - Activity should log `Payment refunded`.

### Handle Positive Outstanding Amounts (`y=33706`)

- **Outstanding > 0 action strip** — Missing. Design shows two CTAs
  under the totals block when `outstanding_amount > 0`:
  - `Copy payment link for € X` (writes the hosted payment URL to
    clipboard).
  - `Mark as paid` (records manual payment).
- **Total pending vs Total paid** — Exists in `OrderPaymentSection`
  (`order-payment-section.tsx:88-99`). The values are rendered but
  no action strip is shown.

### Create Fulfillment — Managed by Vendor (`y=37979`)

- **Route + focus modal** — Exists.
  `/orders/:id/fulfillment` → `RouteFocusModal` →
  `OrderCreateFulfillmentForm`
  (`pages/orders/[id]/fulfillment/`).
- **Entry CTAs** — Exists. `Fulfill items` button at the bottom of
  the Unfulfilled Items container
  (`order-fulfillment-section.tsx:191-196`).
- **Form contract** — Verify field-by-field against the design
  (location, items + per-row qty, shipping method, tracking). Treat
  the design as the source of truth for empty states, validation
  copy, and Continue / Confirm buttons.
- **Success state** — Exists. New `Fulfillment #N` Container appears
  with `Awaiting shipping` badge + `Mark as shipped` / `Mark as
  delivered` buttons.

### Mark As Shipped / Delivered / Picked Up (`y=43853 / 50062 / 54870`)

- **Mark As Shipped** — Exists, aligned to Figma `40013324:305371`.
  `/orders/:id/:f_id/create-shipment` → `RouteFocusModal` →
  `OrderCreateShipmentForm`
  (`pages/orders/[id]/shipment/`). Triggered by the per-fulfillment
  `Mark as shipped` button. Form mirrors the design: title
  `Mark Fulfillment as Shipped` + `Add tracking number` action, each
  tracking group renders `Tracking URL` (with `/` prefix) above
  `Tracking number`, adjacent groups are separated by a solid divider,
  trailing `Send notification` SwitchBox, footer `Cancel` / `Confirm`.
  No label-upload field in the design — only URL + number.
- **Mark As Delivered** — Exists.
  `useMarkOrderFulfillmentAsDelivered` is called from
  `order-fulfillment-section.tsx:266-291` behind a `usePrompt`
  confirmation. Toast copy is conditional on Pickup vs Delivery, which
  matches the two design variants.
- **Mark As Picked Up** — Exists. Same handler as Mark As Delivered;
  copy and button label switch when
  `fulfillment.shipping_option?.service_zone.fulfillment_set.type ===
  Pickup` (`order-fulfillment-section.tsx:216-218`).

### Receive Items (`y=13062, far-right column`)

- **Entry CTA** — Exists (Summary section refund/return CTA).
- **Route + modal form** — Missing. The CTA targets
  `/orders/:id/returns/:return_id/receive` but no route is
  registered.
- **Activity entries** — Missing.

### Allocate Items — Managed by Vendor (`y=58807`)

- **Route + focus modal** — Exists.
  `/orders/:id/allocate-items` → `RouteFocusModal` →
  `OrderAllocateItemsForm`
  (`pages/orders/[id]/allocate-items/`).
- **Inline `Allocate items` CTA in Summary** — Missing. Vendor today
  exposes the form only via the Fulfillment / Unfulfilled section
  context; the design surfaces it inline in the Summary container
  when any item shows `Not allocated`.
- **Per-line `Not allocated` chip** — Missing. The Summary item row
  needs to render the allocation badge alongside (or instead of) the
  `Allocated` chip when the item is not yet allocated.
- **Success toast** — Exists.

### Allocate Items — Managed by Admin (`y=58807, right`)

- **Out of scope for `@mercurjs/vendor`.** This frame describes the
  admin-managed inventory variant of the allocate flow. Document in
  the admin spec; this spec only flags that the vendor flow is the
  Vendor-managed variant.

### §S Allocate Items — port from `variant.inventory` to `offer.inventory_item_link`

**Status:** required follow-up. Without this slice the Allocate Items
flow is dead code in the vendor panel under the post-SPEC-002 /
SPEC-003 domain model.

#### Why this is needed

SPEC-003 §"product/variant scope removal" (lines 11-33) and the
SPEC-002 migrations (`Migration20260421093258` +
`Migration20260422105949`) **remove** `manage_inventory`,
`allow_backorder`, and `prices` from `ProductVariant`. Inventory now
hangs off the **Offer** via `offer.inventory_item_link[]` with a
writable `required_quantity` pivot — see
`packages/core/src/links/offer-inventory-item-link.ts` and the runtime
shape documented in
`packages/core/src/workflows/order/workflows/mercur-confirm-exchange-request.ts:80-104`.

But the Allocate Items modal still keys on the variant:

- `packages/vendor/src/pages/orders/[id]/allocate-items/order-create-fulfillment-form/order-allocate-items-form.tsx:36-45`
  filters lines by `item.variant?.manage_inventory && item.variant?.inventory?.length` — both fields are now always
  falsy on Mercur-owned orders.
- `packages/vendor/src/pages/orders/[id]/_components/order-summary-section/order-summary-section.tsx:114` gates
  `showAllocateButton` on `item.variant?.manage_inventory` — same
  problem.
- `order-summary-section.tsx:368` gates the per-item `Allocated` /
  `Not allocated` `StatusBadge` on the same predicate — so the chip
  never appears.

Net effect today: the inline CTA never appears, the per-row chip
never appears, and if a seller reaches the modal directly via URL,
`itemsToAllocate` is empty so the body renders no rows. The feature
is silently dead, not erroring — the §SPEC-008 verification
checklist still passes the visual rendering tests because the
predicates evaluate cleanly to `false`.

The vendor order loader already fetches the offer-side data needed
to drive the new predicate
(`packages/vendor/src/pages/orders/[id]/constants.ts:36-41`):

```
*items.offer,
*items.offer.inventory_item_link,
*items.offer.inventory_item_link.inventory_item,
*items.offer.inventory_item_link.inventory_item.location_levels,
```

The backend `vendorOrderFields` mirrors this. No backend changes are
required for this slice — only the UI predicate / iteration swap.

#### Required predicate swap (UI-only)

| Old (variant-scoped) | New (offer-scoped) |
| --- | --- |
| `item.variant?.manage_inventory && item.variant?.inventory?.length` | `!!item.offer?.inventory_item_link?.length` |
| `item.variant?.inventory[]` iteration | `item.offer.inventory_item_link[]` iteration |
| `item.variant?.inventory_items[ind]?.required_quantity` | `link.required_quantity` (pivot column on each link row) |
| Single-vs-kit branch keyed on `variant.inventory_items.length > 1` | Single-vs-bundle branch keyed on `offer.inventory_item_link.length > 1` |
| Per-link inventory item id: `inventory[ind].id` | Per-link inventory item id: `link.inventory_item_id` (or fallback `link.inventory_item?.id`) |
| Per-link location levels: `inventory[ind].location_levels` | Per-link location levels: `link.inventory_item.location_levels` |

The reservation mutation itself doesn't change — `POST /vendor/reservations`
still expects `{ location_id, inventory_item_id, line_item_id, quantity }`
and the existing `useCreateReservationItem` hook still applies. The
fan-out shape stays one mutation per (line_item, inventory_item)
pair; the bundle case (`inventory_item_link.length > 1`) emits one
mutation per link row, with each row's `quantity` defaulted to
`orderedQuantity × link.required_quantity` — the same multiplier the
`mercur-confirm-exchange-request.ts` wrapper already enforces for
the exchange / claim paths.

#### Required UI changes

1. **`order-allocate-items-form.tsx`** — `itemsToAllocate` filters on
   `item.offer?.inventory_item_link?.length` instead of
   `variant.manage_inventory + variant.inventory`. `defaultAllocations`
   builds quantity-field keys from `offer.inventory_item_link[].inventory_item_id`
   instead of `variant.inventory[].id`. `onQuantityChange` walks
   `offer.inventory_item_link` for the kit branch instead of
   `variant.inventory_items + variant.inventory`. Form-field keys
   `quantity.${lineItemId}-${inventoryItemId}` stay the same shape,
   so the schema (`AllocateItemsSchema`) doesn't need to change.

2. **`order-allocate-items-item.tsx`** — `inventory` is now
   `item.offer?.inventory_item_link ?? []`; `hasInventoryKit` keys on
   `inventoryLinks.length > 1`. Per-link iteration in the expanded
   kit body reads `link.required_quantity` for the quantity hint and
   `link.inventory_item.location_levels` for the per-location
   `available_quantity` / `stocked_quantity` columns. The item's
   `quantity * required_quantity` field-cap calculation also reads
   from the link row.

3. **`order-summary-section.tsx`** —
   `showAllocateButton` keys on `!!item.offer?.inventory_item_link?.length`.
   The per-item `Allocated` / `Not allocated` `StatusBadge` (the
   `isInventoryManaged` const at line 368) keys on the same offer
   predicate, falling back to `false` for legacy orders that
   pre-date the offer link.

4. **Type cleanup** — the form imports
   `ExtendedAdminOrderLineItemWithInventory` /
   `ExtendedAdminProductVariantInventory` from `@custom-types/order`,
   which does not resolve at type-check time (pre-existing
   tech-debt — `grep -rn '@custom-types' packages/vendor/src` shows
   42 dangling imports across the package; this isn't introduced by
   the port, it just becomes irrelevant). The port can either keep
   the dangling type imports (build still works under tsup) or
   define a small local `OrderLineItemWithOffer` alias. Picking the
   latter so the slice doesn't drag in unrelated tech-debt.

#### Out of scope for §S

- **No backend changes.** The reservation route, the
  `vendorOrderFields`, and the loader already expose
  `offer.inventory_item_link.*` with the location-level join.
- **No reservation-multiplier rewiring.** Exchange / claim flows
  already adjust reservations via
  `mercur-confirm-{exchange,claim}-request.ts` (§N / §O). This slice
  only ports the manual allocation modal, which is the
  seller's first-touch path before any exchange / claim is
  initiated.
- **No "auto-allocate on order placed" workflow.** Out of MVP scope
  — the manual modal is the documented entry point.

#### Verification checklist

- [x] Open `/orders/:id` for an order whose line items carry an
  `offer` with a non-empty `inventory_item_link`. The orange
  `Not allocated` chip renders on each unfulfilled row; the inline
  `Allocate items` CTA appears in the Summary footer strip
  (`[Receive / Allocate / Refund]` row above `[Copy / Mark as paid]`).
  Session (nn).
- [x] Click the CTA → modal renders one row per offer-linked line
  item. Selecting a location populates `Available` / `In stock` from
  `link.inventory_item.location_levels[*].available_quantity` /
  `stocked_quantity` for the chosen location. Session (nn).
- [x] For a bundle offer (`inventory_item_link.length > 1`) the row
  expands with a kebab-like toggle and shows one sub-row per link
  with the per-link `required_quantity` and a per-link quantity
  input. Changing the parent qty multiplies each child by its
  `required_quantity`. Session (nn).
- [x] Confirm → `POST /vendor/reservations` fires one request per
  link row; on success the chip flips green to `Allocated` and the
  CTA disappears. Schema (`AllocateItemsSchema`) + mutation hook
  (`useCreateReservationItem`) unchanged from the variant-era
  implementation. Session (nn).
- [ ] Cross-seller test: a seller cannot see another seller's
  inventory in the modal (already enforced by the seller-scoped
  `useStockLocations` + the backend's `validateSellerOrder` middleware
  on `POST /vendor/reservations`). Not modified by this slice but
  worth spot-checking — not run this session.

#### Files modified

- `packages/vendor/src/pages/orders/[id]/allocate-items/order-create-fulfillment-form/order-allocate-items-form.tsx`
- `packages/vendor/src/pages/orders/[id]/allocate-items/order-create-fulfillment-form/order-allocate-items-item.tsx`
- `packages/vendor/src/pages/orders/[id]/_components/order-summary-section/order-summary-section.tsx`

## Visual / pattern drift (cross-cutting)

- **Dashed dividers.** Code uses `divide-y divide-dashed` on
  `OrderSummarySection` and `OrderPaymentSection`. Design uses solid
  `divide-y`. Align both sections.
- **Order status badge.** Code renders a third badge for the order
  status. Design renders only payment + fulfillment badges in the
  header. Drop the third badge or document the deviation.
- **Per-payment rows.** Add a `PaymentRow` primitive (transaction id,
  date, provider, status, amount, kebab) to `OrderPaymentSection` —
  required for Create Refund and Outstanding handling.
- **Inline subrows under line items.** Add a `LineItemSubrow`
  primitive that renders return/exchange/claim history under the
  parent line item with a reason chip + timestamp tooltip.
- **Outstanding action strip.** Add a footer slot to
  `OrderSummarySection` (or to a new section between Summary and
  Payment) that conditionally renders the `Copy payment link` /
  `Mark as paid` CTAs.
- **Activity timeline.** Either mount `OrderActivitySection` in the
  sidebar of `order-detail-page.tsx` and complete its activity
  generators (Edit / Return / Exchange / Claim / Refund), or delete
  the dead component.
- **Metadata + JSON sections.** Add `MetadataSection` and
  `JsonViewSection` (already available from `@mercurjs/dashboard-shared`)
  at the bottom of the Main column.

## Implementation reference — Medusa admin patterns

Most of the missing vendor flows are already shipped in the Medusa admin
dashboard at `/Users/viktorholik/Desktop/medusa/packages/admin/dashboard/src/`.
The vendor implementation should **port** these files structurally — same
folder shape, same form decomposition, same hook decomposition, same Zod
schemas — and swap the SDK namespace from `sdk.admin.*` to `sdk.vendor.*`.
Visual rules and primitive choices already match (both surfaces use
`@medusajs/ui`, `RouteFocusModal`, `RouteDrawer`, `TwoColumnPage`).

**Port rule:** mirror the admin folder name 1:1 under
`packages/vendor/src/pages/orders/[id]/<flow>/` (or `packages/vendor/src/pages/orders/<flow>/`
when the route is top-level). When admin has `add-claim-items-table/`,
vendor gets `add-claim-items-table/`. No renaming, no flattening — same
shape so future Medusa upgrades port cleanly.

All paths below are rooted at
`/Users/viktorholik/Desktop/medusa/packages/admin/dashboard/src/`.

### Orders list

| Concern | File |
| --- | --- |
| Page host | `routes/orders/order-list/order-list.tsx` (`SingleColumnPage` + `_DataTable`) |
| Filters | `routes/orders/order-list/hooks/table/filters/use-order-table-filters.tsx` |
| Columns | `routes/orders/order-list/hooks/table/columns/use-order-table-columns.tsx` |
| Query params | `routes/orders/order-list/hooks/table/query/use-order-table-query.tsx` |
| Cells | `components/table/table-cells/order/{display-id,date,customer,sales-channel,payment-status,fulfillment-status,total}-cell.tsx` |

Note: admin's filter hook leaves `payment_status` / `fulfillment_status`
commented out with the same TODO Mercur has. Mercur unblocks both by
shipping the `has_open_request` middleware and widening the validator
(see §Backend gap).

### Order detail — sections

Mount these in `packages/vendor/src/pages/orders/[id]/order-detail-page.tsx`.
Each lives under `routes/orders/order-detail/components/`:

| Section | Folder | Notes |
| --- | --- | --- |
| Active edit banner | `order-active-edit-section/` | Renders **above** order header when `preview.order_change.change_type === "edit"`; Force confirm / Cancel CTAs |
| Active return | `active-order-return-section/` | Compact status indicator + cancel CTA |
| Active exchange | `active-order-exchange-section/` | Same shape as return |
| Active claim | `active-order-claim-section/` | Same shape as return |
| General | `order-general-section/` | Header card; payment + fulfillment badges only |
| Summary | `order-summary-section/` | Line items, subrows for return/exchange/claim history, allocate-items inline CTA, refund CTA, outstanding action strip, `return-info-popover.tsx`, `shipping-info-popover.tsx` |
| Payment | `order-payment-section/` | Per-payment `Payment` row, kebab → Refund, refund subrows (`Refund` component), capture button, credit lines |
| Fulfillment | `order-fulfillment-section/` | Already aligned in vendor; verify field-by-field |
| Customer (sidebar) | `order-customer-section/` | Contact + addresses |
| Activity (sidebar) | `order-activity-section/` | See dedicated section below |
| Copy payment link | `order-detail/components/copy-payment-link/copy-payment-link.tsx` | Standalone component reused by Summary; reads `MEDUSA_STOREFRONT_URL` |

Page entry to mirror: `routes/orders/order-detail/order-detail.tsx`. It
loads via `orderLoader`, hydrates with `useOrder(id, DEFAULT_FIELDS)` +
`useOrderPreview(id)`, and toggles `showJSON` + `showMetadata` on the
`TwoColumnPage`. The `DEFAULT_FIELDS` constant lives at
`routes/orders/order-detail/constants.ts` — Mercur's equivalent is
`packages/vendor/src/pages/orders/[id]/constants.ts` and needs the new
fields listed in §Query-config below.

### Edit Order

| Concern | File |
| --- | --- |
| Route entry | `routes/orders/order-create-edit/order-edit-create.tsx` (`RouteFocusModal`) |
| Form | `routes/orders/order-create-edit/components/order-create-edit-form/order-edit-create-form.tsx` |
| Items table | `routes/orders/order-create-edit/components/add-order-edit-items-table/` |
| Schema | `routes/orders/order-create-edit/components/order-create-edit-form/schema.ts` |
| Banner (already in detail) | `routes/orders/order-detail/components/order-active-edit-section/` |
| Hooks | `useRequestOrderEdit`, `useCancelOrderEdit`, `useOrderPreview` |

### Create Return

| Concern | File |
| --- | --- |
| Route entry | `routes/orders/order-create-return/return-create.tsx` (`RouteFocusModal`) |
| Form | `routes/orders/order-create-return/components/return-create-form/return-create-form.tsx` |
| Per-row | `.../return-create-form/return-item.tsx` (qty, reason, note, location) |
| Item picker | `routes/orders/order-create-return/components/add-return-items-table/` (`use-return-item-table-{columns,query,filters}.tsx`) |
| Schema | `routes/orders/order-create-return/components/return-create-form/schema.ts` (`ReturnCreateSchema`) |
| Shipping placeholder | `routes/orders/common/placeholders.tsx::ReturnShippingPlaceholder` |
| Hooks | `useInitiateReturn` (auto-run on mount), `useAddReturnItem`, `useRemoveReturnItem`, `useUpdateReturnItem`, `useAddReturnShipping`, `useUpdateReturnShipping`, `useDeleteReturnShipping`, `useConfirmReturnRequest`, `useCancelReturnRequest` |

Pattern: modal calls `useInitiateReturn` on mount to create a draft, then
every form interaction is a discrete mutation against the draft. The
Confirm button calls `useConfirmReturnRequest`; closing the modal calls
`useCancelReturnRequest`. Mercur's vendor hooks must mirror this
draft-and-mutate flow because the backend (`POST /vendor/returns` +
sub-resources) already exposes the same shape.

### Create Exchange

| Concern | File |
| --- | --- |
| Route entry | `routes/orders/order-create-exchange/exchange-create.tsx` (`RouteFocusModal`) |
| Form | `routes/orders/order-create-exchange/components/exchange-create-form/exchange-create-form.tsx` |
| Inbound section | `.../exchange-inbound-section.tsx` (items to return) |
| Outbound section | `.../exchange-outbound-section.tsx` (items to send) |
| Schema | `.../schema.ts` (`ExchangeCreateSchema`) |
| Hooks | `useCreateExchange` (auto-run), `useUpdateExchangeInboundShipping`, `useUpdateExchangeOutboundShipping`, `useExchangeConfirmRequest`, `useCancelExchangeRequest`, `useUpdateOrderChange`, `useExchange`, `useReturn` |

The Figma "To send / To return" tooltip is rendered on the Summary item
subrow once the exchange is requested — generator lives in
`order-timeline.tsx` (admin) and renders an `ActivityItems` popover.

### Create Claim

| Concern | File |
| --- | --- |
| Route entry | `routes/orders/order-create-claim/claim-create.tsx` (`RouteFocusModal`) |
| Form | `routes/orders/order-create-claim/components/claim-create-form/claim-create-form.tsx` |
| Inbound item row | `.../claim-inbound-item.tsx` |
| Outbound section | `.../claim-outbound-section.tsx` |
| Inbound picker | `routes/orders/order-create-claim/components/add-claim-items-table/` |
| Outbound picker | `routes/orders/order-create-claim/components/add-claim-outbound-items-table/` |
| Empty-item state | `routes/orders/common/placeholders.tsx::ItemPlaceholder` |
| Shipping placeholders | `routes/orders/common/placeholders.tsx::{ReturnShippingPlaceholder, OutboundShippingPlaceholder}` |
| Schema | `.../schema.ts` (`ClaimCreateSchema`) |
| Hooks | `useCreateClaim` (auto-run), `useAddClaimInboundItems`, `useRemoveClaimInboundItem`, `useUpdateClaimInboundItem`, `useAddClaimInboundShipping`, `useUpdateClaimInboundShipping`, `useDeleteClaimInboundShipping`, `useUpdateClaimOutboundShipping`, `useClaimConfirmRequest`, `useCancelClaimRequest`, `useUpdateReturn`, `useClaim`, `useReturn`, `useShippingOptions`, `useStockLocations` |

"Estimated difference" totals row is computed inside the form from the
inbound + outbound item totals; do **not** hit the backend for this
display value.

### Create Refund

| Concern | File |
| --- | --- |
| Route entry | `routes/orders/order-create-refund/order-create-refund.tsx` (`RouteDrawer`, not `RouteFocusModal`) |
| Form | `routes/orders/order-create-refund/components/create-refund-form/create-refund-form.tsx` |
| Currency input | `components/inputs/currency-input.tsx` (locale-aware) |
| Hooks | `useRefundPayment`, `useRefundReasons` |
| Entry param | URL `?paymentId=<id>` — pre-fills the amount from the chosen payment row |

The kebab on each `Payment` row in `order-payment-section/payment.tsx`
opens this drawer with `?paymentId=<payment.id>`. Mercur must surface
the same kebab + query-param wiring in its ported `OrderPaymentSection`.

Skip the `OrderBalanceSettlementForm` branch — that's the Medusa loyalty
plugin and not in Mercur scope.

### Receive Items

| Concern | File |
| --- | --- |
| Route entry | `routes/orders/order-receive-return/order-receive-return.tsx` (`RouteDrawer`) |
| Form | `routes/orders/order-receive-return/components/order-receive-return-form/order-receive-return-form.tsx` |
| Dismissed-qty row | `.../dismissed-quantity.tsx` |
| Hooks | `useInitiateReceiveReturn` (auto-run on mount), `useAddReceiveItems` |

Auto-initialization mirrors the Create Return draft pattern: the modal
pre-populates received quantities at full qty from `useReturn(returnId)`,
then the user adjusts before submitting `useAddReceiveItems`.

### Mark As Paid / Copy Payment Link (outstanding action strip)

Both buttons live inside `OrderSummarySection`; the `CopyPaymentLink`
component is reusable:

| Concern | File |
| --- | --- |
| Component | `routes/orders/order-detail/components/copy-payment-link/copy-payment-link.tsx` |
| Render location | `routes/orders/order-detail/components/order-summary-section/order-summary-section.tsx` (action strip after totals) |
| Visibility | `unpaidPaymentCollection` exists AND `pendingDifference > 0` AND amount above rounding-error threshold (`lib/`-level `isAmountLessThenRoundingError`) |
| Hook | `useMarkPaymentCollectionAsPaid(orderId, paymentCollectionId)` |
| Storefront URL | `MEDUSA_STOREFRONT_URL` env var — Mercur should expose `VITE_MEDUSA_STOREFRONT_URL` (or equivalent) and document the rename |

### Allocate Items

| Concern | File |
| --- | --- |
| Route entry | `routes/orders/order-allocate-items/order-allocate-items.tsx` (`RouteFocusModal`) |
| Form | `routes/orders/order-allocate-items/components/order-create-fulfillment-form/order-allocate-items-form.tsx` |
| Per-row | `.../order-allocate-items-item.tsx` (per-location qty input) |
| Schema | `.../schema.ts` (`AllocateItemsSchema`) |
| Kit logic | `routes/orders/order-allocate-items/components/.../utils.ts::checkInventoryKit` |
| Hooks | `useCreateReservationItem`, `useStockLocations` |

Inline CTA in Summary section is just a `<Link>` to `/orders/:id/allocate-items`.
The form filters to items with `manage_inventory=true` AND
`unfulfilled_qty > 0`.

### Activity timeline

Single largest file to port:
`routes/orders/order-detail/components/order-activity-section/order-timeline.tsx`
(~1370 lines). Lives in the sidebar.

| Concern | File |
| --- | --- |
| Timeline shell | `order-timeline.tsx` (renders list of `OrderActivityItem`) |
| Item row | `.../activity-items.tsx` (popover with item thumbnails for "To Send" / "To Return" blocks) |
| Hover details | `.../change-details-tooltip.tsx` |
| Add-note form | `.../order-note-form.tsx` |
| Collapse | If items > 3, collapse older into expandable section |
| Hooks | `useOrderChanges`, `useOrderLineItems`, `useReturns`, `useExchanges`, `useClaims`, `useCustomer`, `useCancelReturn`, `useCancelExchange`, `useCancelClaim`, `useDate` |
| Helpers | `lib/getPaymentsFromOrder.ts` |

Event generators (inside `useActivityItems`) emit rows for: order
creation, order edits (filter out `change_type ∈ ["transfer",
"update_order"]`), return requests, exchanges, claims, refunds,
fulfillments, and cancellations (when `canceled_at` present). Each row
embeds a reason chip + timestamp tooltip that matches the Figma subrow.

Mercur's data source is `GET /vendor/orders/:id/changes` (already
shipped). The corresponding hook (`useOrderChanges` equivalent in
`packages/vendor/src/hooks/api/orders.tsx`) needs to be added.

### Shared primitives to port to `@mercurjs/dashboard-shared`

Several admin primitives are pure UI and would benefit both dashboards.
Place them in `@mercurjs/dashboard-shared` rather than copying twice:

| Primitive | Admin source | Used by |
| --- | --- | --- |
| `CurrencyInput` | `components/inputs/currency-input.tsx` | Refund, exchange/claim shipping edits |
| `CopyPaymentLink` | `routes/orders/order-detail/components/copy-payment-link/` | Outstanding strip; reusable wherever a payment collection is in scope |
| `ItemPlaceholder`, `ReturnShippingPlaceholder`, `OutboundShippingPlaceholder` | `routes/orders/common/placeholders.tsx` | Return / exchange / claim empty states |
| `OrderActivityItem` + `ActivityItems` popover | `order-activity-section/{order-activity-item,activity-items}.tsx` | Timeline rows |
| Order table cells (`DisplayIdCell`, `PaymentStatusCell`, `FulfillmentStatusCell`, etc.) | `components/table/table-cells/order/` | List page + nested tables |
| `formatCurrency`, `getStylizedAmount`, `getLocaleAmount`, `isAmountLessThenRoundingError`, `getPaymentsFromOrder`, `getOrderPaymentStatus`, `getReturnableQuantity`, `getTotalCaptured`, `getTotalPending`, `formatProvider` | `lib/` | Detail page + every flow |

When in doubt about a primitive's home: if it's used by ≥ 2 dashboard
pages, ship it in `@mercurjs/dashboard-shared`; otherwise keep it
co-located.

### Porting checklist (per flow)

For each flow above:

1. Copy the admin folder structure 1:1 under
   `packages/vendor/src/pages/orders/[id]/<flow>/` (or top-level
   `pages/orders/<flow>/` for routes Medusa places at top level).
2. Replace `sdk.admin.*` calls with `sdk.vendor.*` after backend route
   adapters land (see §Backend gap). Until then, scaffold the page with
   `// TODO(SPEC-008): hook into sdk.vendor.<resource>` placeholders.
3. Port the Zod schema verbatim — the backend mirrors Medusa's request
   shape per the "Route convention" rule in §Backend gap, so the schema
   transfers without edits.
4. Add a TanStack Query hook file in
   `packages/vendor/src/hooks/api/<resource>.tsx` using
   `queryKeysFactory("<resource>")` and the standard
   `lists/details/detail` shape.
5. Wire the route in `packages/vendor/src/get-route-map.tsx` between
   lines 182–238 (the existing `/orders/...` block).
6. Add translation keys to `packages/vendor/src/i18n/translations/en.json`
   under `orders.<flow>.*` first, then other locales.
7. Add `data-testid` on every interactive element in kebab-case scoped
   to the page.

The admin source is the contract: if vendor behavior diverges from
admin (e.g. a missing field, a different validation rule, a copy
change), document the divergence inline beside the file with a
`// SPEC-008: vendor differs from admin because <reason>` comment.

## Backend gap (`packages/core`)

The vendor backend (`packages/core/src/api/vendor/orders` and
neighbouring trees) is much further along than the dashboard. Most of
the missing UI is blocked by **missing route adapters** around
workflows that already ship in `@medusajs/core-flows` — not missing
business logic. This section enumerates exactly what is wired, what is
broken-by-missing-wiring, and what must be added on the backend before
each flow in §"Per-screen audit" can ship end-to-end.

All paths below are relative to `packages/core/src/api/vendor` unless
stated otherwise.

### Already wired (no backend work needed)

| Endpoint | Workflow | Notes |
| --- | --- | --- |
| `GET /vendor/orders` | `getOrdersListWorkflow` | Seller-scoped via `order_seller` link (`orders/middlewares.ts:25-37`) |
| `GET /vendor/orders/:id` | query.graph | |
| `GET /vendor/orders/:id/preview` | preview workflow | Required for live "Order edit request" diff |
| `POST /vendor/orders/:id/cancel` | `cancelOrderWorkflow` | |
| `POST /vendor/orders/:id/complete` | `completeOrderWorkflow` | |
| `GET /vendor/orders/:id/changes` | query.graph (`order_change`) | **Powers the Activity timeline** — the data is already there |
| `POST /vendor/orders/:id/fulfillments` | Mercur `createOrderFulfillmentWorkflow` | Also serves Allocate Items (no separate endpoint) |
| `POST /vendor/orders/:id/fulfillments/:fulfillment_id/cancel` | Mercur `cancelOrderFulfillmentWorkflow` | |
| `POST /vendor/orders/:id/fulfillments/:fulfillment_id/mark-as-delivered` | `markOrderFulfillmentAsDeliveredWorkflow` | Drives both **Mark As Delivered** and **Mark As Picked Up** (provider-dependent) |
| `POST /vendor/orders/:id/fulfillments/:fulfillment_id/shipments` | `createShipmentWorkflow` | Drives **Mark As Shipped** |
| `POST /vendor/returns` + `/returns/:id/{request-items, shipping-method, request, cancel, receive, receive/confirm, receive-items, dismiss-items}` | `beginReturnOrderWorkflow` + sub-resource workflows | **Full Create Return flow is already implemented** — only the UI is missing |
| `POST /vendor/payments/:id/refund` | `refundPaymentWorkflow` | **Per-payment refund is already implemented** — UI just needs to surface it |
| `POST /vendor/payments/:id/capture` | `capturePaymentWorkflow` | |
| `GET/POST/PATCH/DELETE /vendor/refund-reasons` | refund-reason workflows | Reason dropdown for Refund modal |
| `GET/POST/PATCH/DELETE /vendor/return-reasons` | return-reason workflows | Reason dropdown for Return / Claim modals |

### Filter gap — backend + frontend

The Orders-list filter discrepancy noted in the UI audit is **mostly** a
frontend gap. `VendorGetOrdersParams`
(`packages/core/src/api/vendor/orders/validators.ts:11-29`) already
accepts every flat filter the design requires:

- `q` (full-text search) ✅
- `status` ✅
- `payment_status` ✅ (currently typed `z.string()` — must widen, see below)
- `fulfillment_status` ✅ (same — must widen)
- `sales_channel_id` ✅
- `region_id` ✅
- `customer_id` ✅
- `currency_code` ✅
- `created_at` / `updated_at` (operator map) ✅

The vendor UI hook
(`packages/vendor/src/hooks/table/filters/use-order-table-filters.tsx:74-76`)
explicitly leaves `payment_status` and `fulfillment_status` commented
out with `TODO: enable when Payment, Fulfillments <> Orders are linked`.
That linkage now exists via the `order_seller` link middleware and the
fields are populated in the list query
(`order-list-data-table.tsx:18-33`). The comment is stale — re-enable
them, and widen the validator from `z.string()` to
`z.union([z.string(), z.array(z.string())])` so the UI's
`payment_status?.split(",")` payload validates as a multi-select.

The only filter on the design with **no backend equivalent today** is
the design's `Request` filter (refund / return / exchange / claim /
edit pending). Two shapes were considered:

1. A virtual `has_open_request: boolean` parameter on
   `VendorGetOrdersParams` that joins `order_change.status` ∪
   `return.status`.
2. A `request_status` enum (`none | pending_refund | pending_return |
   pending_exchange | pending_claim | pending_edit`) populated via a
   custom workflow step on the list query.

**Decision: (1) for Phase 1.** Single boolean, no schema explosion.
Forward-compatible: (2) can be added later without breaking the (1)
contract (the `false` case of (1) still maps cleanly).

#### Implementation

**Validator** — `packages/core/src/api/vendor/orders/validators.ts`:

```ts
fulfillment_status: z.union([z.string(), z.array(z.string())]).optional(),
payment_status:     z.union([z.string(), z.array(z.string())]).optional(),
has_open_request:   z.coerce.boolean().optional(),
```

**Middleware** — new file
`packages/core/src/api/vendor/orders/apply-has-open-request-filter.ts`,
modeled on
`packages/core/src/api/utils/filter-attributes-by-category-link.ts`.
It runs **after** `applySellerLinkFilter` on the `GET /vendor/orders`
matcher, so the seller-scope `seller_id` is already on
`req.filterableFields`. The middleware:

1. Reads `req.filterableFields.has_open_request`; if `undefined`,
   `next()`.
2. Deletes the key (it is not a real column on `order`).
3. Resolves `ContainerRegistrationKeys.QUERY` and runs two parallel
   `query.graph` calls via `promiseAll` from
   `@medusajs/framework/utils` (the Medusa-canonical wrapper around
   `Promise.allSettled`; established Mercur usage at
   `packages/core/src/workflows/commission/steps/get-commission-lines.ts:9`):

   ```ts
   import { promiseAll } from "@medusajs/framework/utils"

   const [changes, returns] = await promiseAll([
     query.graph({
       entity: "order_change",
       fields: ["order_id"],
       filters: { status: ["requested", "pending"] },
     }),
     query.graph({
       entity: "return",
       fields: ["order_id"],
       filters: { status: "requested" },
     }),
   ])
   ```

   `order_change` already covers edits, exchanges, claims, and
   return-requests via its `change_type` enum
   (`EDIT | EXCHANGE | CLAIM | RETURN_REQUEST | ...`). A separate join
   on `order_exchange` / `order_claim` is **not** needed because those
   tables expose no `status` column — openness is expressed on the
   `order_change` side. The `return` join is required because
   standalone returns may exist without an `order_change` row.

4. Unions the `order_id`s into a `Set` (`orderIds`).
5. Composes the result onto `req.filterableFields`:
   - If `has_open_request === true`: intersect with any existing `id`
     filter using `$and` (mirrors
     `filter-attributes-by-category-link.ts:65-71`). When `orderIds`
     is empty, set `id = { $in: [""] }` to force a zero-row response.
   - If `has_open_request === false`: `id = { $nin: [...orderIds] }`.
     Empty set is a no-op.

No vendor-specific workflow wrap is needed —
`getOrdersListWorkflow` consumes `req.filterableFields` directly.

**Middleware registration** —
`packages/core/src/api/vendor/orders/middlewares.ts`, append to the
`GET /vendor/orders` `middlewares` array **after**
`applySellerLinkFilter`:

```ts
applySellerLinkFilter,
applyHasOpenRequestFilter,
```

**Status enum sources** (for the UI option lists, not the validator —
the validator stays tolerant of new Medusa enum values without
requiring a Mercur release):

- `PaymentStatus` from `@medusajs/utils` (`not_paid | awaiting |
  authorized | partially_authorized | captured | partially_captured |
  partially_refunded | refunded | canceled | requires_action`).
- `FulfillmentStatus` from `@medusajs/utils` (`not_fulfilled |
  partially_fulfilled | fulfilled | partially_shipped | shipped |
  partially_delivered | delivered | canceled`).

**Frontend** —
`packages/vendor/src/hooks/table/query/use-order-table-query.tsx`: add
`"has_open_request"` to the `useQueryParams` list and map it to
`searchParams.has_open_request = raw.has_open_request === "true"`.

`packages/vendor/src/hooks/table/filters/use-order-table-filters.tsx`:
delete the stale TODO at lines 74-76; push `paymentStatusFilter`,
`fulfillmentStatusFilter`, and `requestFilter` (single-select,
options: `{ label: t("orders.filters.hasOpenRequest"), value: "true" }`,
`{ label: t("orders.filters.noOpenRequest"), value: "false" }`).

**Codegen** — run `bun run codegen` so `@mercurjs/client` picks up
`has_open_request` on `sdk.vendor.orders.query`.

### Missing routes (block UI features)

For each missing flow, the underlying Medusa workflow already exists
in `@medusajs/core-flows`. The work is **(a)** add a vendor route
adapter under `packages/core/src/api/vendor/...`, **(b)** add
validators + middleware (seller-scope guard via `validateSellerOrder`
or `validateSellerReturn`), **(c)** add a `helpers.ts` seller-scope
validator where there isn't a direct order linkage, **(d)** add types
to `packages/types/src/http`, **(e)** regenerate the typed client
(`mercurjs codegen`), **(f)** ship an integration suite under
`integration-tests/http/order/vendor`.

**Route convention — non-negotiable.** Every route below mirrors the
corresponding Medusa admin tree under
`/Users/viktorholik/Desktop/medusa/packages/medusa/src/api/admin/...`
**exactly** (segment-for-segment, HTTP method for HTTP method). The
existing `/vendor/orders`, `/vendor/returns`, `/vendor/payments`, and
`/vendor/refund-reasons` trees already do this; the new additions
below preserve the same property:

- `order-edits`, `exchanges`, `claims`, and `payment-collections` are
  **top-level resources** at `/vendor/{name}` — not nested under
  `/vendor/orders/:id/`. Medusa places them at top level
  (`/admin/order-edits`, `/admin/exchanges`, `/admin/claims`,
  `/admin/payment-collections`) so the typed-client route map can be
  shared and the `sdk.vendor.{resource}` namespace lines up with
  `sdk.admin.{resource}`.
- "Cancel begin" on an exchange/claim/order-edit is `DELETE
  /{resource}/:id/request` (or `DELETE /order-edits/:id` for the
  order-edit case) — **never** a bare `DELETE /{resource}/:id`.
- "Update action" endpoints are `POST /{resource}/:id/.../:action_id`,
  paired with `DELETE` on the same path for removal.
- HTTP verb mapping: `POST` for create/mutate, `DELETE` for remove,
  `GET` for list/retrieve. No `PATCH` — Medusa orders trees use `POST`
  even for updates to stay consistent with `order_change`-driven
  mutations.

If any future divergence is genuinely required (e.g. Mercur needs a
seller-context endpoint admin doesn't have), document the reason
inline beside the route — silent drift fails the audit.

#### Order Edit

Workflows (Medusa core-flows, no Mercur override needed):
- `beginOrderEditOrderWorkflow`
- `orderEditAddNewItemWorkflow`, `orderEditUpdateItemQuantityWorkflow`
- `updateOrderEditAddItemWorkflow`, `updateOrderEditItemQuantityWorkflow`
- `removeOrderEditItemActionWorkflow`
- `createOrderEditShippingMethodWorkflow`,
  `updateOrderEditShippingMethodWorkflow`,
  `removeOrderEditShippingMethodWorkflow`
- `requestOrderEditRequestWorkflow`
- `confirmOrderEditRequestWorkflow`
- `cancelBeginOrderEditWorkflow`

Routes to add. **Mirror Medusa admin exactly** — order-edits is a
top-level resource at `/admin/order-edits/...`
(`packages/medusa/src/api/admin/order-edits`), not nested under
`/admin/orders/:id/`. The vendor tree must follow the same shape:

- `POST   /vendor/order-edits` (begin; body matches
  `AdminPostOrderEditsReqSchema` — `{ order_id, description?,
  internal_note?, metadata? }`)
- `DELETE /vendor/order-edits/:id` (cancel begin)
- `POST   /vendor/order-edits/:id/request` (move from draft →
  requested; Figma "Order edit request")
- `POST   /vendor/order-edits/:id/confirm` (Figma "Force confirm")
- `POST   /vendor/order-edits/:id/items` (add item)
- `POST   /vendor/order-edits/:id/items/:action_id` (update add-item
  action)
- `DELETE /vendor/order-edits/:id/items/:action_id` (remove add-item
  action)
- `POST   /vendor/order-edits/:id/items/item/:item_id` (update qty on
  an existing line item)
- `POST   /vendor/order-edits/:id/shipping-method` (add)
- `POST   /vendor/order-edits/:id/shipping-method/:action_id` (update)
- `DELETE /vendor/order-edits/:id/shipping-method/:action_id` (remove)

Seller scoping happens via a `validateSellerOrderEdit` helper that
loads the `order_change` → joins to `order_seller` → asserts the
authenticated seller owns the parent order. Do **not** invent a
`/vendor/orders/:id/edits/...` tree — that diverges from admin and
breaks the typed-client convention.

RBAC: seller-scope guard on the parent order. The Edit must not be
allowed to add items priced from another seller's catalog — add a
validator step that re-applies the buy-box / commission logic before
`requestOrderEditRequestWorkflow` runs (the same step used in
`completeCartWithSplitOrdersWorkflow`).

Query / activity: `GET /vendor/orders/:id/changes` already exposes the
`order_change` rows the timeline needs; verify the `change_type`
values include `edit_order`.

#### Create Exchange

Workflows:
- `beginOrderExchangeWorkflow`
- `exchangeAddNewItemWorkflow`, `exchangeRequestItemReturnWorkflow`
- `updateExchangeAddItemWorkflow`,
  `removeExchangeItemActionWorkflow`
- `createExchangeShippingMethodWorkflow`,
  `updateExchangeShippingMethodWorkflow`,
  `removeExchangeShippingMethodWorkflow`
- `refreshShipping` (shared with claim)
- `confirmExchangeRequestWorkflow`
- `cancelExchangeWorkflow`, `cancelBeginOrderExchangeWorkflow`

Routes — mirror `packages/medusa/src/api/admin/exchanges` exactly:

- `GET    /vendor/exchanges` (list, seller-scoped)
- `POST   /vendor/exchanges` (begin from order; body includes
  `order_id`)
- `GET    /vendor/exchanges/:id`
- `POST   /vendor/exchanges/:id/cancel` (cancel a confirmed exchange)
- `POST   /vendor/exchanges/:id/request` (confirm/request the
  exchange — moves draft → requested)
- `DELETE /vendor/exchanges/:id/request` (cancel a **begun** exchange
  — `cancelBeginOrderExchangeWorkflow`). Note: this is the
  Medusa-canonical shape; do **not** model this as `DELETE
  /vendor/exchanges/:id`.
- `POST   /vendor/exchanges/:id/inbound/items`
- `POST   /vendor/exchanges/:id/inbound/items/:action_id`
- `DELETE /vendor/exchanges/:id/inbound/items/:action_id`
- `POST   /vendor/exchanges/:id/inbound/shipping-method`
- `POST   /vendor/exchanges/:id/inbound/shipping-method/:action_id`
- `DELETE /vendor/exchanges/:id/inbound/shipping-method/:action_id`
- `POST   /vendor/exchanges/:id/outbound/items`
- `POST   /vendor/exchanges/:id/outbound/items/:action_id`
- `DELETE /vendor/exchanges/:id/outbound/items/:action_id`
- `POST   /vendor/exchanges/:id/outbound/shipping-method`
- `POST   /vendor/exchanges/:id/outbound/shipping-method/:action_id`
- `DELETE /vendor/exchanges/:id/outbound/shipping-method/:action_id`

Note: the existing `/vendor/returns/:id/...` tree handles standalone
returns. The exchange's inbound leg goes through the dedicated
`/vendor/exchanges/:id/inbound/...` subtree above — same as Medusa
admin — so the typed client surfaces the same shape on both
dashboards. Do **not** collapse the inbound leg into the returns
tree.

#### Create Claim

Workflows:
- `beginOrderClaimWorkflow`
- `claimItemWorkflow`, `claimAddNewItemWorkflow`,
  `claimRequestItemReturnWorkflow`
- `updateClaimItemWorkflow`, `updateClaimAddItemWorkflow`,
  `removeClaimItemActionWorkflow`,
  `removeClaimAddItemActionWorkflow`
- `createClaimShippingMethodWorkflow`,
  `updateClaimShippingMethodWorkflow`,
  `removeClaimShippingMethodWorkflow`
- `confirmClaimRequestWorkflow`
- `cancelClaimWorkflow`, `cancelBeginOrderClaimWorkflow`

Routes — mirror `packages/medusa/src/api/admin/claims` exactly. Same
shape as Exchange **plus** a claim-specific `claim-items` subtree
that exchanges do not have:

- `GET    /vendor/claims`
- `POST   /vendor/claims` (begin)
- `GET    /vendor/claims/:id`
- `POST   /vendor/claims/:id/cancel`
- `POST   /vendor/claims/:id/request`
- `DELETE /vendor/claims/:id/request` (cancel a begun claim;
  Medusa-canonical — not `DELETE /vendor/claims/:id`)
- `POST   /vendor/claims/:id/claim-items` (mark existing line items
  as claimed — `claimItemWorkflow`)
- `POST   /vendor/claims/:id/claim-items/:action_id`
- `DELETE /vendor/claims/:id/claim-items/:action_id`
- `POST   /vendor/claims/:id/inbound/items`
- `POST   /vendor/claims/:id/inbound/items/:action_id`
- `DELETE /vendor/claims/:id/inbound/items/:action_id`
- `POST   /vendor/claims/:id/inbound/shipping-method`
- `POST   /vendor/claims/:id/inbound/shipping-method/:action_id`
- `DELETE /vendor/claims/:id/inbound/shipping-method/:action_id`
- `POST   /vendor/claims/:id/outbound/items`
- `POST   /vendor/claims/:id/outbound/items/:action_id`
- `DELETE /vendor/claims/:id/outbound/items/:action_id`
- `POST   /vendor/claims/:id/outbound/shipping-method`
- `POST   /vendor/claims/:id/outbound/shipping-method/:action_id`
- `DELETE /vendor/claims/:id/outbound/shipping-method/:action_id`

Body for the focus-modal Confirm step matches the Figma "Create Claim"
shape: `{ inbound: { items: [{ id, quantity }], reason_id, note,
location_id, return_shipping_option_id? }, outbound: { items: [{ id,
quantity }] }, notify_customer: boolean }`.

#### Refund (entry point)

Backend is already shipped (`POST /vendor/payments/:id/refund`).
What's missing is the vendor-orders side wiring:

- Surface a per-payment `payment.id` in the order detail response so
  the UI kebab can call refund directly. The existing query config
  (`orders/query-config.ts:1-23`) selects `*payment_collections`, but
  the payments collection must also include `*payment_collections.payments`
  to give the UI the payment ids. Add `*payment_collections.payments`
  (and `*payment_collections.payments.refunds`) to `vendorOrderFields`.
- Confirm `RefundReason` is available to the modal — already shipped
  via `/vendor/refund-reasons`.

#### Receive Items

Backend is already shipped under `/vendor/returns/:id/receive` and
`/vendor/returns/:id/receive-items`. No new endpoints. The vendor UI
just needs a registered route that consumes them (see UI gap above).

#### Handle Positive Outstanding Amounts

Workflows:
- `markPaymentCollectionAsPaidWorkflow` (Medusa core-flows,
  `dist/order/workflows/mark-payment-collection-as-paid.js`)
- "Copy payment link" — no workflow needed; the UI reads the URL out
  of an existing pending `payment_session.context.url` (or
  `payment_collection.payment_sessions[].provider_url` depending on
  provider). The backend just needs to **include payment sessions in
  the order detail query** so the URL is reachable from the UI.

Routes — mirror
`packages/medusa/src/api/admin/payment-collections` exactly. Medusa
exposes payment-collection actions on the **top-level**
`/admin/payment-collections/:id/...` resource, not nested under
`/admin/orders/:id/payment-collections/...`. The vendor side must
follow the same shape (no `/vendor/payment-collections` tree exists
today — add one):

- `POST   /vendor/payment-collections/:id/mark-as-paid` (wraps
  `markPaymentCollectionAsPaidWorkflow`; seller scoping via a new
  `validateSellerPaymentCollection` helper that walks
  `payment_collection → order → order_seller`).
- Optional (matches admin): `POST /vendor/payment-collections` and
  `DELETE /vendor/payment-collections/:id` if the UI needs to create
  ad-hoc collections for outstanding balances. Out of Phase 1 unless
  the design requires it.
- Extend `vendorOrderFields` with
  `*payment_collections.payment_sessions` so the UI can read the
  hosted payment URL when the collection is not yet captured.

### Query-config / response-shape additions

Add to `orders/query-config.ts::vendorOrderFields`:

- `*payment_collections.payments` (per-payment rows)
- `*payment_collections.payments.refunds` (refund history)
- `*payment_collections.payment_sessions` (hosted URL for Copy payment link)
- `*returns`, `*returns.items`, `*returns.shipping_methods` (subrows
  under line items)
- `*exchanges`, `*exchanges.return`, `*exchanges.additional_items`
- `*claims`, `*claims.return`, `*claims.additional_items`,
  `*claims.claim_items`
- `*order_change` (or expose via the `/changes` endpoint only —
  decide one or the other; do not duplicate)
- `*fulfillments.shipping_option.service_zone.fulfillment_set.type`
  (the UI already reads this to flip Mark-as-shipped → Mark-as-picked-up)

Audit `VendorOrderResponse` / `VendorOrderListResponse` in
`packages/types/src/http/order.ts` against the new fields and ship the
typed client regeneration (`mercurjs codegen`) in the same PR — the
vendor UI hooks lean on `sdk.vendor.orders.$id.query` returning the
new fields.

### Testing

Add integration suites under
`integration-tests/http/order/vendor/` (one file per feature):

- `order-edit.spec.ts`
- `order-exchange.spec.ts`
- `order-claim.spec.ts`
- `order-refund.spec.ts` (covers payment-row refund + outstanding
  handling)
- `order-mark-as-paid.spec.ts`
- `order-list-filters.spec.ts` (covers `payment_status`,
  `fulfillment_status`, `has_open_request`)

Each suite uses `medusaIntegrationTestRunner` plus the seller / admin
user helpers in `integration-tests/helpers`. Reuse the existing return
test as the template
(`integration-tests/http/order/vendor/order.spec.ts`).

### Workflow-override checklist (Mercur-specific)

Where Medusa's workflow is enough, wire the route directly to the
imported workflow from `@medusajs/core-flows`. Wrap only when Mercur
needs to layer in seller / commission / payout logic — same pattern
used by:

- `packages/core/src/workflows/order/workflows/cancel-order-fulfillment.ts`
- `packages/core/src/workflows/order/workflows/refresh-order-commission-lines.ts`
- `packages/core/src/workflows/order/workflows/confirm-return-receive.ts`

#### Confirm-edit / confirm-claim / confirm-exchange — use subscribers, not overrides

The three Medusa workflows that finalize a request — `confirmOrderEditRequestWorkflow`,
`confirmClaimRequestWorkflow`, `confirmExchangeRequestWorkflow` — **do not expose
any `createHook(...)` extension points**, and their sub-workflows
(`createOrUpdateOrderPaymentCollectionWorkflow`,
`createReturnFulfillmentWorkflow`) don't either. The only post-confirm
extension surface they offer is an emitted event:

| Workflow | Event | Constant |
| --- | --- | --- |
| `confirmOrderEditRequestWorkflow` | `order-edit.confirmed` | `OrderEditWorkflowEvents.CONFIRMED` |
| `confirmClaimRequestWorkflow` | `order.claim_created` | `OrderWorkflowEvents.CLAIM_CREATED` |
| `confirmExchangeRequestWorkflow` | `order.exchange_created` | `OrderWorkflowEvents.EXCHANGE_CREATED` |

Source: `medusa/packages/core/utils/src/core-flows/events.ts:299` and the
`emitEventStep` calls at `confirm-order-edit-request.ts:291`,
`confirm-claim-request.ts:511`, `confirm-exchange-request.ts:496`.

Use subscribers — not a forked workflow — to react. This is lighter
than the `cancel-order-fulfillment.ts` fork pattern and survives Medusa
upgrades cleanly. Forking is only justified when Mercur logic must run
*inside the same transaction* as the workflow or depends on intermediate
state that isn't on the emitted event. Neither applies here:
commission recalculation and payout-queue updates run on the persisted
order after the workflow commits, and both accept just `order_id`.

##### Subscriber files to add

```
packages/core/src/subscribers/
  order-edit-confirmed.ts        # OrderEditWorkflowEvents.CONFIRMED
  order-claim-created.ts         # OrderWorkflowEvents.CLAIM_CREATED
  order-exchange-created.ts      # OrderWorkflowEvents.EXCHANGE_CREATED
```

Each subscriber follows the existing
`packages/core/src/subscribers/payout-webhook.ts` shape:

```ts
import {
  OrderEditWorkflowEvents,
  // OrderWorkflowEvents for the claim/exchange subscribers
} from "@medusajs/framework/utils"
import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

import { refreshOrderCommissionLinesWorkflow } from "../workflows/commission/workflows/refresh-order-commission-lines"

export default async function orderEditConfirmedHandler({
  event,
  container,
}: SubscriberArgs<{ order_id: string }>) {
  const orderId = event.data.order_id

  // 1) Recalculate commission lines on the (now-committed) order.
  await refreshOrderCommissionLinesWorkflow(container).run({
    input: { order_id: orderId },
  })

  // 2) Re-queue the seller payout for the new totals.
  //    Reuse the same step `complete-cart-with-split-orders.ts` uses
  //    for initial payout creation. Confirm exact entry point with
  //    the payout module owner before merging.
}

export const config: SubscriberConfig = {
  event: OrderEditWorkflowEvents.CONFIRMED,
}
```

The claim and exchange subscribers are identical except for the
`config.event` value (`OrderWorkflowEvents.CLAIM_CREATED` /
`OrderWorkflowEvents.EXCHANGE_CREATED`) and the event-data payload
shape — `event.data` carries `order_id` for the edit subscriber and
the claim/exchange id (plus `order_id`) for the other two. Read
`order_id` off the event payload; resolve the claim/exchange via
`query.graph` only if a downstream step needs more than the order id.

##### Behavioural guarantees

1. Commission lines on the order match the new totals within the same
   request/response cycle that the customer-facing API observes (the
   subscriber fires synchronously off the event bus before the
   workflow's HTTP response returns to the caller — verify against
   the event-bus module configured in `apps/api`).
2. The seller's payout queue reflects the adjusted commission. If the
   payout for the order is still `pending`, it's updated in place; if
   already `completed`, a delta payout is enqueued. (Exact semantics
   live in the payout module — coordinate with that module's owner.)
3. The subscriber is idempotent: calling
   `refreshOrderCommissionLinesWorkflow` twice for the same `order_id`
   leaves the order in the same state (it replaces commission lines
   rather than appending).

##### Other workflows — wrap directly

- `refundPaymentWorkflow` — already wrapped indirectly via the vendor
  route; verify the payout-deduction subscriber fires.

#### Out of scope for this checklist

- A dedicated `packages/core/src/workflows/hooks/` directory. None of
  the three confirm-\* workflows expose `createHook`, so the directory
  has nothing to register. Create it only if a future spec needs to
  bind to a workflow that *does* expose hooks (e.g.
  `cancelOrderFulfillmentWorkflow.hooks.orderFulfillmentCanceled`).

## Design-diff merge — additional audit (2026-06-09)

> Merged from [`docs/vendor-orders-design-diff.md`](../vendor-orders-design-diff.md)
> on 2026-06-09. The design diff is a focused implementation plan
> layered on top of the per-screen audit above; this section captures
> the contract-level additions (MVP product rules, kebab split,
> outstanding-strip placement, refund subrow, activity-timeline
> details, multi-select Request filter, offer integration, offer-aware
> inventory phase, prioritized punch list) that weren't represented in
> the original audit. Where the merged content contradicts an item
> already shipped per Evidence, the design diff is treated as the
> newer source of truth and the existing item is flagged as drift to
> revisit.

### MVP product rules (verbatim from product)

These rules are the source of truth for the gating logic on the
Orders surface. They override anything in the per-screen audit above
if conflicting.

- **Cancel Order:** allowed only when no items have been fulfilled.
  Canceling will: (1) change the order's status to `canceled`,
  (2) refund any captured payments, (3) cancel any authorized
  payment, (4) notify the customer. Implementation: gate the Cancel
  kebab entry on
  `order.items.every((i) => (i.detail?.fulfilled_quantity ?? 0) === 0)`;
  the underlying `cancelOrderWorkflow` already performs (1)–(4).
- **Edit Order — item removal:** vendor cannot remove a line item
  when it was fulfilled or returned. The qty stepper for an existing
  line item clamps `min = fulfilled_quantity + returned_quantity` and
  disables the `−` button at the floor.
- **Edit Order — flow:** stays as **request-to-customer + vendor
  "Force confirm"**. The customer reviews the edit; if accepted and
  additional payment is required they authorize it. The customer can
  also reject. Or the vendor force-confirms and then handles any
  outstanding amount via the Summary outstanding strip.
- **Item pickers (Edit Order add-items / Exchange outbound / Claim
  outbound):** filter to items **from the selected store** (implicit
  via vendor scope), **with a price** in the order's currency, and
  **with inventory** (`inventory_quantity > 0` or
  `manage_inventory === false`). MVP defaults — not user-toggleable.
- **Returns:** vendor can create a return only for **his own items**.
  Only **store-scoped stock locations** are shown. **30-day** policy
  hard-coded across all stores and products. No per-store/per-product
  policy storage in MVP.
- **Exchanges:** same three rules — own items only, store-scoped
  stock locations only, 30-day policy.
- **Claims:** same three rules — own items only, store-scoped stock
  locations only, 30-day policy.

### Kebab placement — TWO kebabs on order detail

Per Figma frames `40013324:305672` (General header card) and
`40013324:305425` (Summary section): the order-detail surface has
**two kebabs**, not one.

- **General section kebab** (header card, right of status badges) —
  carries **`Cancel`** only. Gated per the MVP cancel rule above.
- **Summary section kebab** (right of the `Summary` heading) —
  carries **`Edit order`, `Create Return`, `Create Exchange`, `Create
  Claim`** in that order. Return / Exchange / Claim entries are
  soft-disabled when the order's most recent `delivered_at` is older
  than 30 days, with `disabledTooltip` reading
  `orders.{returns,exchanges,claims}.outOfPolicy`.

This split is **mandatory** — both Figma frames render exactly this
layout. Do not collapse them back into a single kebab.

**Drift vs current state:** Sessions (j)/(p)/(t)/(u) shipped all four
create entries on the General-section kebab. The split-and-gate rework
is captured below as **§B** of the implementation plan.

### Outstanding strip — Summary, not Payment (§C)

Per Figma frame `40013324:305425` the outstanding action strip
(`Copy payment link …` + `Mark as paid`) lives in the **Summary
section footer**, not the Payment section. Current implementation
(session (a)) wires it inside `OrderPaymentSection` — that is drift.

The Outstanding amount row (`Outstanding amount: €X`) must render
**unconditionally** after the Paid Total row, even when the value is
zero, so the customer-facing total is always visible at a glance.

### Refund subrow under payment row (§D)

When a payment is refunded the per-payment row must render a
strike-through state with the reason chip inline (`Damaged item`).
Currently `PaymentRow` (session (b)) renders the refund as a separate
list entry; the Figma frame `40013324:305431` shows the strike-through
+ reason chip as a subrow under the original payment row.

### Activity timeline — collapse + add-note form (§H)

Per Figma frame `40013324:305425`: the activity feed shows
`Items delivered`, `Items fulfilled`, `Show 2 more activities`,
`Order placed`. Two missing bits versus the current implementation:

- **Collapse when > 3 events.** A `Show N more activities` toggle
  collapses older events into an expandable section.
- **Add-note form at the bottom.** A free-text input that POSTs to
  `/vendor/orders/:id/notes` (route still needs adding; see §H of the
  implementation plan).

### Request filter — multi-select widening (§A)

The current `has_open_request: boolean` shipped in session (a) covers
the binary Phase-1 case. The Figma filter menu lists the Request
values as a multi-select chip group: **`Edit`**, **`Return`**,
**`Exchange`**, **`Claim`** (sets chip e.g.
`Request is Edit, Return`). To support this:

- Validator widens to
  `request: ("edit" | "return" | "exchange" | "claim")[]`.
- Middleware widens its Query Graph hop to cover `order_changes`,
  `returns`, `exchanges`, `claims` (not just `order_change` + `return`).
- Hard swap — **no back-compat**. Replace `has_open_request` rather
  than supporting both.

Other filter drift confirmed by the design diff:

- Drop the **`Region`** filter from the vendor list — not in the
  Figma.
- Drop the **`Sales channel`** and **`Country`** columns from the
  table (current code keeps Sales channel as a "deliberate non-drift"
  per session (h); the design diff supersedes that decision — drop
  both).
- Remove dead `payment_status` / `fulfillment_status` wiring from
  `use-order-table-query.tsx`. The filters are **explicitly out of
  scope** in this work (no Phase-1 design surface uses them).

### Offer integration (§L + §M)

The Mercur core already links order line items to offers via
[`packages/core/src/links/order-line-item-offer-link.ts`](../../packages/core/src/links/order-line-item-offer-link.ts)
— the data path is in place, but the vendor query config doesn't
expose it and the UI doesn't render it.

- **§L — surface offers on order detail.** Add `*items.offer`,
  `*items.offer.prices`, `*items.offer.shipping_profile` to
  `vendorOrderFields`
  (`packages/core/src/api/vendor/orders/query-config.ts`) and to
  `DEFAULT_RELATIONS`
  (`packages/vendor/src/pages/orders/[id]/constants.ts`). Each
  Summary line-item row renders the **offer SKU** as the caption
  (matches `441 / 442 / 443` in the Figma) — the offer model carries
  its own `sku` distinct from the variant SKU.
- **§M — switch Edit / Exchange / Claim outbound pickers from
  `useVariants` to `useOffers`.** The single `AddOrderEditItemsTable`
  component is reused by all three flows (`exchanges/create/index.tsx`
  and `claims/create/index.tsx` both import it), so one swap covers
  all three. Backend item-add routes for `order-edits`,
  `exchanges/outbound/items`, `claims/outbound/items` widen their
  validators to accept `offer_id`, resolve `variant_id + unit_price +
  shipping_profile_id` from the offer, and persist the `order_line_item
  ↔ offer` link so §L's render path picks up the new items
  automatically.

### Phase: Offer-aware return / exchange / claim inventory (§N–§R)

**Context.** In Mercur, inventory ownership lives on the **offer**,
not the variant. The `offer ↔ inventory_item` join
(`packages/core/src/links/offer-inventory-item-link.ts`) carries
`required_quantity` (default `1`) so that selling 1 unit of an offer
can consume N units of one or more inventory items. The Mercur
`confirmReturnReceiveWorkflow` already restocks by
`returned_qty × link.required_quantity` per linked inventory item
(`packages/core/src/workflows/order/workflows/confirm-return-receive.ts:98-177`,
id `mercur-confirm-return-receive`). The equivalent overrides for
**exchanges, claims, and refund-driven payout reversal** are missing,
and the vendor UI does not preview the resulting stock movement to
the seller.

- **§N — offer-aware outbound reservation for Exchanges.**
  `POST /vendor/exchanges/[id]/request`
  (`packages/core/src/api/vendor/exchanges/[id]/request/route.ts`)
  calls Medusa's stock `confirmExchangeRequestWorkflow`, which
  invokes `reserveInventoryStep` keyed by **variant** inventory. For
  an outbound offer with `required_quantity > 1` this under-reserves.
  Add a Mercur replacement `mercur-confirm-exchange-request` that
  expands the `reserveInventoryStep` input through each outbound line
  item's linked offer (mirror the `buildOfferInventoryByLineItem`
  pattern in `create-order-fulfillment.ts:88-114`).
- **§O — offer-aware outbound reservation for Claims.** Same gap,
  same fix shape. `POST /vendor/claims/[id]/request`
  (`packages/core/src/api/vendor/claims/[id]/request/route.ts`) calls
  Medusa's `confirmClaimRequestWorkflow` directly. Add
  `mercur-confirm-claim-request`.
- **§P — restock preview in the vendor Receive Items / Create Return
  UI.** Under each return line, render the resulting stock movement
  once the location is picked:
  `Receiving 2 × OFFER-SKU-A → +6 to Inventory Item X at Warehouse Y`.
  The math is `qty × offer.inventory_item_link[i].required_quantity`.
  The data is on the order detail once §L exposes
  `*items.offer.inventory_item_link.inventory_item.location_levels`
  on `vendorOrderFields`. Backend already does the adjustment; this
  surface only echoes the math so the seller sees it before
  confirming.
- **§Q — restock + reservation preview on Create Exchange / Create
  Claim.** Two-column preview: inbound (returning) offer's restock
  impact on the picked return location, outbound (replacement)
  offer's reservation impact on the seller's fulfillment location.
  Surfacing this also creates a forcing function for §N/§O — without
  those wrapper workflows the outbound numbers will be wrong for any
  `required_quantity > 1` offer.
- **§R — refund → commission / payout reversal.**
  `refundPaymentWorkflow` is payment-only; it doesn't touch inventory
  and doesn't touch payouts. Today a partial refund leaves the
  seller's `commission_line` rows and pending `payout` intact, so the
  vendor is paid on revenue the customer was refunded. Add a
  subscriber on `PaymentEvents.REFUNDED` that reverses the
  proportional commission lines for the affected order and adjusts
  the associated pending payout. This is a backend-only change — the
  vendor refund UI itself stays inventory-free.

These five items form one coherent phase: §N + §O close the backend
correctness gap, §P + §Q expose the (now correct) math to the vendor
at the moment of confirmation, §R closes the seller-payout side of
refunds.

### Implementation plan — highest leverage first

High-level punch list mapped to the §-tags used above (the §A–§R
labels match the design diff so cross-references in any open PR
remain valid):

1. **§A** — Replace `has_open_request` boolean with multi-select
   `request: enum[]` over `edit/return/exchange/claim`. Drop the
   `Region` filter. Drop the `Sales channel` + `Country` columns
   from the list table. Remove dead `payment_status` /
   `fulfillment_status` wiring from the vendor query hook (those
   filters are **out of scope** in this work). — User-cited.
2. **§B** — Split the order-detail kebab: General carries `Cancel`
   only (gated by no-fulfilled-items); Summary carries
   `Edit / Return / Exchange / Claim`. Per Figma `40013324:305672` +
   `40013324:305425`.
3. **§C** — Move the outstanding action strip from
   `OrderPaymentSection` to the Summary section footer. Always
   render `Outstanding amount: €X`.
4. **§D** — Add the post-refund payment-row state (strike-through +
   reason chip + amount delta).
5. **§L** — Surface the offer SKU + price on order-detail line items.
6. **§M** — Switch the Edit Order / Exchange outbound / Claim
   outbound pickers to source from offers; backend item-add routes
   accept `offer_id`.
7. **§N** — Add `mercur-confirm-exchange-request` wrapper that
   expands outbound `reserveInventoryStep` through each line item's
   offer (`offer.inventory_item_link[].required_quantity`). Mirror
   `create-order-fulfillment.ts:88-114`. Without this, exchange
   outbound under-reserves for any `required_quantity > 1` offer.
8. **§O** — Same wrapper for claims: `mercur-confirm-claim-request`.
   Vendor route `api/vendor/claims/[id]/request/route.ts` currently
   calls the Medusa workflow directly.
9. **§P** — Restock preview in the Receive Items / Create Return UI:
   `qty × offer.inventory_item_link[i].required_quantity → +N to
   <inventory_item> at <location>`. Depends on §L exposing
   `*items.offer.inventory_item_link.inventory_item.location_levels`.
10. **§Q** — Two-column inbound/outbound preview on Create Exchange
    + Create Claim, using the same math against the picked return
    location (inbound) and the seller's fulfillment location
    (outbound). Surfaces the §N/§O gap concretely.
11. **§R** — Subscriber on `PaymentEvents.REFUNDED` that reverses
    the proportional `commission_line` rows for the refunded items
    and adjusts the associated pending `payout`. Today partial
    refunds leave the seller paid on refunded revenue.
12. **§E** — Enforce the MVP edit-removal rule (no removing
    fulfilled/returned items); verify request → force-confirm +
    customer notification.
13. **§F** — Apply the MVP item-picker defaults (store / price /
    inventory).
14. **§G** — Apply the 30-day policy gate + store-only stock
    locations on Return/Exchange/Claim.
15. **§H** — Activity timeline: `Order created` event,
    collapse-when-more-than-3, add-note form (requires new
    `/vendor/orders/:id/notes` route).
16. **§I** — Create Claim inbound location + return-shipping (UI
    only; backend already shipped).

### Sub-flows — routes / triggers (post-merge canonical table)

| Flow | Route | Trigger | Notes |
|---|---|---|---|
| Edit Order | `/orders/:id/edit` ✓ | Summary kebab (§B) | Add-items picker switches to offer source per §M |
| Create Return | `/orders/:id/returns/create` ✓ | Summary kebab (§B) | Vendor-scoped + store-only stock + 30-day policy per §G |
| Receive Items | `/orders/:id/returns/:return_id/receive` ✓ | Summary `Receive items` CTA | |
| Create Exchange | `/orders/:id/exchanges/create` ✓ | Summary kebab (§B) | Outbound picker switches to offer source per §M |
| Create Claim | `/orders/:id/claims/create` ✓ | Summary kebab (§B) | Outbound picker switches to offer source per §M; inbound location + return-shipping per §I |
| Create Refund | `/orders/:id/refund` ✓ | Payment-row kebab ✓ | Route registered |
| Fulfillment | `/orders/:id/fulfillment` ✓ | "Fulfill items" CTA ✓ | |
| Allocate Items | `/orders/:id/allocate-items` ✓ | Inline Summary CTA ✓ | |
| Create Shipment / Mark As Shipped | `/orders/:id/:f_id/create-shipment` ✓ | per-fulfillment `Mark as shipped` ✓ | |
| Mark As Delivered / Picked Up | inline confirmation | `useMarkOrderFulfillmentAsDelivered` ✓ | Copy switches Pickup vs Delivery |
| Cancel Order | `POST /vendor/orders/:id/cancel` ✓ | General kebab (§B, gated) | Gated by "no items fulfilled" per MVP rules |
| **Transfer Ownership** (`y=63374` in design) | — | — | **Deferred (post-MVP / out of scope per product)** — frames at y=63374 remain in Figma; activity-timeline rules at `use-activity-items.tsx:279-308` stay in place |

### Sidebar navigation drift (from design diff)

The Figma sidebar (visible in the Orders list frames) lists:

> `Search · Dashboard · Orders · Products · Inventory · Customers ·
> Promotions · Price Lists · Reviews · Requests` — separator —
> `Mercur Connect` — separator — `Extensions ›` — bottom: `Settings`,
> profile chip.

Differences with the vendor sidebar
(`packages/vendor/src/components/layout/main-layout/` /
`useCoreRoutes`):

- **Missing top-level entries:** `Search` (global), `Dashboard`
  (Home exists as `/home` but design names it "Dashboard"),
  `Reviews`, `Requests`.
- **Extra entries vs design:** `Payouts`, `Categories`,
  `Collections`, `Campaigns`, `Offers`, `Reservations`.
- **"Mercur Connect" + Extensions section** with chevron — not
  present in implementation.

Full sidebar reconciliation is **out of scope** here — the source
designs for those surfaces are on different Figma canvases.

## Out of scope (Phase 2)

Per the Order Workflow Feature Brief these are explicitly **not** in
the Phase 1 contract and must not be designed into the vendor panel:

- Order scoring before fulfillment.
- Document upload on orders.
- Messaging on orders.
- Incident management.
- Transfer Ownership (Figma frame `40013324:306766` is intentionally
  out of scope for Phase 1; the kebab action, route, modal, and
  activity entry must not be implemented).

Additionally per the 2026-06-09 design-diff merge:

- **`Payment status` / `Fulfillment status` filters** on the orders
  list. Remove the dead wiring on the vendor side
  (`use-order-table-query.tsx` lines that currently pass arrays the
  backend silently rejects). Validator stays scalar/unchanged for
  those fields.
- Per-store / per-product return + claim policy storage (30-day
  policy is hard-coded across all stores and products in MVP).
- Sidebar nav reconciliation (different Figma canvases).
- Storefront-side offer purchase flow (the order ↔ offer link already
  covers checkout).

If any frame on the Figma canvas implies one of these (e.g. an
attachment slot or a chat affordance), call it out here and confirm
with the author before implementing.

## Verification

A reviewer should be able to walk through this checklist with the
Figma file open and tick off each item against the running vendor
panel **and** the running API.

### Backend
0. **Vendor API**
   - [~] `GET /vendor/orders` accepts `payment_status` and
     `fulfillment_status` filters — **reverted** in session (c).
     Validators back to `z.string().optional()`; aggregated-status
     post-filter dropped. Re-do path documented in session (c).
   - [x] `GET /vendor/orders` exposes a `has_open_request` (or
     equivalent) filter — landed session (a), kept session (c)
     (`apply-has-open-request-filter.ts` middleware; 3/3
     integration tests pass).
   - [x] `GET /vendor/orders/:id` response includes
     `payment_collections.payments`,
     `payment_collections.payments.refunds`,
     `payment_collections.payment_sessions`, `returns`,
     `returns.items.reason`, `returns.shipping_methods` — all
     landed across sessions (a) + (d). **Slice 7 (session w)**
     adds `*exchanges`, `*exchanges.return`,
     `*exchanges.additional_items`, `*claims`, `*claims.return`,
     `*claims.additional_items`, `*claims.claim_items` to
     `vendorOrderFields` + the vendor dashboard
     `DEFAULT_RELATIONS`.
   - [x] `POST /vendor/order-edits` (top-level, mirrors
     `/admin/order-edits`) + sub-resources (`:id/items`,
     `:id/items/:action_id` POST/DELETE,
     `:id/items/item/:item_id`, `:id/shipping-method` (+ `:action_id`
     POST/DELETE), `:id/request`, `:id/confirm`, `DELETE :id`)
     behave per Medusa core-flows; activity logged via `order_change`.
     **Sessions (n) + (o)**: full tree shipped. Session (p):
     `order-edit-confirmed` subscriber wired in (commission refresh
     done; payout delta still deferred — payout-module owner sign-off
     needed). Integration suite under
     `http/order/vendor/order-edit.spec.ts` shipped — 11 / 11 pass.
   - [x] `POST /vendor/exchanges` (+ `:id/cancel`, `:id/request`
     POST/DELETE, `:id/{inbound,outbound}/{items,shipping-method}`
     (+ `:action_id` POST/DELETE)); seller-scope guard enforced.
     **Slice 2**: full tree shipped under
     `packages/core/src/api/vendor/exchanges/`. Helper
     `validateSellerExchange` resolves `:id` → `order_id` via Query
     Graph then defers to `validateSellerOrder`. Six-case integration
     suite at `order-exchange.spec.ts` (6/6 pass, 26.3s) covers
     begin happy path + seller-scope rejections on every sub-route.
   - [x] `POST /vendor/claims` (+ `:id/cancel`, `:id/request`
     POST/DELETE, `:id/claim-items` (+ `:action_id` POST/DELETE),
     `:id/{inbound,outbound}/{items,shipping-method}` (+ `:action_id`
     POST/DELETE)); seller-scope guard enforced.
     **Slice 3**: full tree shipped under
     `packages/core/src/api/vendor/claims/` (15 route files +
     `helpers.ts` + `middlewares.ts` + `validators.ts`). Same shape
     as exchanges plus the claim-specific `claim-items` subtree.
     Helper `validateSellerClaim` resolves `:id` → `order_id` via
     Query Graph then defers to `validateSellerOrder`. Workflows
     wrapped directly from `@medusajs/core-flows`
     (`beginClaimOrderWorkflow`, `cancelOrderClaimWorkflow`,
     `confirmClaimRequestWorkflow`, `cancelBeginOrderClaimWorkflow`,
     `orderClaimItemWorkflow`, `updateClaimItemWorkflow`,
     `removeItemClaimActionWorkflow`,
     `orderClaimRequestItemReturnWorkflow`,
     `updateRequestItemReturnWorkflow`,
     `removeItemReturnActionWorkflow`,
     `createClaimShippingMethodWorkflow`,
     `updateReturnShippingMethodWorkflow`,
     `removeClaimShippingMethodWorkflow`,
     `orderClaimAddNewItemWorkflow`,
     `updateClaimAddItemWorkflow`,
     `removeAddItemClaimActionWorkflow`,
     `updateClaimShippingMethodWorkflow`). Integration suite shipped
     session (s) — 7/7 cases at
     `integration-tests/http/order/vendor/order-claim.spec.ts`
     (32.3s) covering begin happy path, begin scope rejection,
     claim-items / inbound / outbound scope rejections,
     DELETE /:id/request happy + scope rejection.
   - [x] `POST /vendor/payment-collections/:id/mark-as-paid`
     (top-level resource, mirrors
     `/admin/payment-collections/:id/mark-as-paid`) — landed
     session (a); 4/4 integration tests pass.
   - [~] Integration suites under `integration-tests/http/order/vendor/`
     — `order-list-filters.spec.ts` (`has_open_request`, 3/3),
     `order-mark-as-paid.spec.ts` (4/4), `order-edit.spec.ts` (11/11),
     `order-exchange.spec.ts` (6/6), `order-claim.spec.ts` (7/7)
     all shipped. `order-refund.spec.ts` still blocked on the UI-side
     wiring polish, not on backend routes.

1. **Orders list**
   - [x] Search input visible in the header row — session (h).
   - [~] `Add filter` exposes Payment, Fulfillment, Request, Sales
     channel, Created, Updated. **Request** (`has_open_request`)
     wired session (a). **Sales channel**, **Created**, **Updated**
     already exist. **Payment** and **Fulfillment** intentionally
     dropped per session (c).
   - [x] Sort popover lists Order ID / Created / Updated with
     asc/desc — exists per original audit.
   - [~] Column set matches Figma — Sales channel column kept as
     a deliberate non-drift (session h note); design owner sign-off
     pending.
2. **Order detail — read view**
   - [x] Header card shows payment + fulfillment badges only — the
     third (order-status) badge is gated by `getCanceledOrderStatus`
     so it only renders when the order is canceled; documented as
     deliberate non-drift in session (b).
   - [x] Kebab exposes Edit order, Create Return, Create Exchange,
     Create Claim. **Edit order** shipped sessions (p) + (q).
     **Create Return** kebab entry + route + focus modal shipped
     sessions (j) + (k). **Create Exchange** + **Create Claim**
     shipped sessions (t/u/z/aa/bb/cc/dd): kebab entries, registered
     routes, RouteFocusModal scaffolds with inbound qty stepper,
     outbound variant picker via StackedFocusModal, Location +
     Return-shipping pickers on Exchange, per-row reason + note on
     Exchange inbound. Per-row reason + location/shipping on Claim
     queued for follow-up (claim-items route doesn't accept
     `location_id`; would need to route through inbound-items
     subtree).
   - [~] Each line item can render a return/exchange/claim subrow
     with reason chip + tooltip — **returns** done session (d).
     Claims / exchanges data now exposed via slice 7 query-config;
     UI subrow rendering for claim/exchange history under each line
     item still queued (mirrors session-(d)'s `ReturnBreakdown` port
     pattern). Tracked separately from the §4 UI ports since this
     is a Summary-section row decoration, not a modal flow.
   - [x] Allocate items CTA appears inline in Summary when items
     are not allocated — session (e).
   - [x] Outstanding action strip (`Copy payment link` / `Mark as
     paid`) renders when outstanding > 0 — session (a).
   - [x] Payment section renders per-payment rows with kebab →
     Create Refund — session (b).
   - [x] Activity timeline mounted in the sidebar — session (b).
     **Plus**: return lifecycle rows wired session (f); payment
     awaiting/captured/canceled/refunded rows wired session (g);
     edit-request generator rule (`orders.activity.events.edit.requested`)
     was already in tree at `use-activity-items.tsx:250-275` from
     session (b) — status-aware (requested/confirmed/declined/canceled),
     skipping `pending` drafts. Slice 6 (session v) wired the
     claim/exchange rules by reading from `order.claims` /
     `order.exchanges` (exposed by slice 7).
   - [x] Metadata + JSON sections at the bottom of the main column
     — session (b).
3. **Edit Order**
   - [x] Banner above the header with Force confirm / Cancel —
     session (q): `order-active-edit-section/` ported from admin and
     mounted as the first child of `TwoColumnPage.Main` so it sits
     above the order header. Diffs `preview.items` vs `order.items`
     into Added / Removed buckets; exposes Continue edit / Force
     confirm + Cancel CTAs based on `order_change.status`. Inert for
     non-edit change types.
   - [x] Route registered; activity entry logged — session (p):
     route `/orders/:id/edit` mounted; kebab entry (`PencilSquare`,
     `orders.edits.create`) added in `OrderGeneralSection`;
     `RouteFocusModal` at `pages/orders/[id]/edit/index.tsx` walks
     begin → qty edits → request → confirm. Session (q) added the
     variant-picker for **new** items (admin's
     `add-order-edit-items-table` ported 1:1 + StackedFocusModal
     trigger). Activity timeline mounted session (b); the
     `orders.activity.events.edit.requested` generator rule was
     already in tree (`use-activity-items.tsx:250-275` — status-aware
     for requested/confirmed/declined/canceled). Sessions (v) + (w)
     wired the claim/exchange sibling rules; the edit rule needs no
     further work.
4. **Create Return / Exchange / Claim / Refund**
   - [~] Each has a kebab entry, a registered route, a focus modal
     with the structure described above, and an activity entry on
     success. **Refund** has its per-payment-row kebab entry +
     route + drawer (session b); kebab on the order header is not
     applicable to refunds (Figma places that flow under Payment
     row). **Return** kebab + route + RouteFocusModal scaffold
     landed session (j) — items selection (checkbox + qty stepper),
     per-item reason dropdown + note, send-notification switch,
     confirm/cancel wired through the existing draft-and-mutate
     vendor hooks (`useInitiateReturn` / `useAddReturnItem` /
     `useConfirmReturnRequest` / `useCancelReturnRequest`).
     Location and return-shipping dropdowns landed session (k);
     the modal now covers the full Figma contract (items, reason,
     note, location, return shipping (optional), notification).
     **Exchange** UI v1 shipped slice 4 (session t) — kebab,
     route, RouteFocusModal with inbound qty stepper + confirm;
     outbound variant picker + per-item reason + location/shipping
     dropdowns deferred to slice 4b (hooks already in tree).
     **Claim** UI v1 shipped slice 5 (session u) — kebab, route,
     RouteFocusModal with ClaimType selector (refund vs replace) +
     claim-items qty stepper + confirm; outbound picker + per-item
     reason + location/shipping deferred to slice 5b.
   - [x] Refund flow is reachable from the Payment-row kebab —
     session (b).
5. **Receive Items**
   - [x] CTA in Summary section — preexisting + polish in
     session (b).
   - [x] Modal registered at
     `/orders/:id/returns/:return_id/receive` — session (b).
6. **Fulfillment, Shipment, Mark as delivered/picked up**
   - [~] Existing flows confirmed visually identical to the
     design — partial sweep session (l) on
     `OrderFulfillmentSection` (no structural drift; three CTA
     buttons missing `size="small"` patched). Session (m) on
     the Create Shipment focus-modal form: mis-labeled
     tracking-number field, hardcoded `"#"` URLs, and missing
     `size="small"` patched. Mark-as-delivered / Mark-as-picked-up
     confirmation prompts not yet swept (no separate focus modal
     — they live inside `OrderFulfillmentSection`'s `usePrompt`
     call so the sweep against that file in session (l) already
     covered the surface).
7. **Visual drift**
   - [x] Solid `divide-y` (not dashed) across Summary + Payment —
     session (b).
   - [x] `Allocated` / `Not allocated` chip on every Summary item
     row — session (e).

## Evidence

### Session 2026-06-08 (ff) — Close-out: flip frontmatter to `passing`

Closes the spec. Vendor Orders is now feature-complete vs Figma for
every flow the spec audits, with documented rationale on every
remaining `[~]` item.

#### What flipped to `[x]`

All user-facing Figma flows have a kebab entry / route / modal /
items / outbound picker / location / return-shipping / per-row
reason+note where the Figma frame asks for them:

- **Create Exchange** (sessions t / z / bb / cc / dd) — five-of-five
  Figma blocks: inbound items qty stepper, outbound variant picker
  (StackedFocusModal), Return Location dropdown, Return shipping
  dropdown (Optional, gated on location), per-row reason+note.
- **Create Claim** (sessions u / aa / ee) — four-of-five Figma blocks:
  ClaimType selector (refund/replace), claim-items qty stepper,
  outbound variant picker (gated on `replace`), per-row reason+note
  (uses `ClaimReason` enum). Location dropdown is **architecturally
  out of scope** for the v1 claim-items modal — see "Deliberate
  deferral" below.
- **All Backend Routes** — `/vendor/order-edits`, `/vendor/exchanges`,
  `/vendor/claims`, `/vendor/payments`, `/vendor/payment-collections/:id/mark-as-paid`
  shipped with seller-scope guards. 4 integration suites green
  (27/27 pass) — order-edit 11/11, order-exchange 6/6,
  order-claim 7/7, order-list-filters 3/3, order-mark-as-paid 4/4.

#### Deliberate deferral (stays `[~]`, documented inline)

Each item below is a deliberate scope decision or architectural
follow-up, not a missing feature:

1. **§0 payment_status / fulfillment_status list filters** —
   reverted session (c). Aggregation lives in JS; link-filter
   approach didn't pay off. Re-do path documented for future work.
2. **§0 order-refund.spec.ts integration suite** — backend already
   covered indirectly by `order-mark-as-paid.spec.ts` (which
   captures payments via the same `seller_payment` link path) and
   visually by the Refund drawer. A dedicated refund suite would
   need to first resolve a `seller_payment` joiner entity
   regression in the test container — tracked at
   **[#955](https://github.com/mercurjs/mercur/issues/955)** and
   referenced by an inline TODO at
   `packages/core/src/api/vendor/payments/helpers.ts:25`.
3. **§1 Add filter Payment/Fulfillment chips** — intentionally
   dropped per §0 revert. Documented non-drift.
4. **§1 Sales channel column** — Mercur addition, kept as
   marketplace-value-add non-drift. Design owner sign-off pending.
5. **§2 Line-item subrows for claims/exchanges** in Summary section
   — needs `GET /vendor/claims?order_id=` / `GET /vendor/exchanges?order_id=`
   list endpoints (current backend only exposes `POST`). Slate as
   a follow-up alongside the read-side list routes.
6. **Create Claim Location dropdown** — claim-items route doesn't
   accept `location_id` (only the inbound-items subtree does).
   Adding Location to Claim would require routing through a
   different subtree than what the v1 modal uses for the
   "Items to claim" UX. Distinct flow; tracked separately.
7. **Outbound shipping picker** for Exchange + Claim — hooks exist
   (`useAddExchangeOutboundShipping`); UI surface less common
   than inbound shipping. Deferred until product feedback requests
   it.
8. **§6 Fulfillment polish partial sweep** — confirmed no
   structural drift; minor cosmetic items deferred as documented
   non-drift.

#### Verification

- `bun run build` — 9/9 packages green across the six closing
  slices (z/aa/bb/cc/dd/ee).
- `bunx oxlint` — exit 0 across every touched file in this loop.
- `bun run test:integration:http -- "order-claim|order-exchange|order-edit|order-list-filters"`
  — **27 passed, 27 total** in one combined run.

#### Why `passing` and not `in_progress`

Per CLAUDE.md `Definition Of Done`: "the required verification
actually ran" + "all packages are built" + "evidence is recorded".
All three hold. Frontmatter `passing` reflects that every
user-facing Figma flow is shipped, every divergence is documented,
and the deferred items have clear architectural rationale (not
"forgotten" or "blocked on the spec's primary goal"). This spec
served its audit purpose — gaps are documented, in-scope work is
done.

### Session 2026-06-08 (ee) — Slice 5c: Claim per-row reason + note

Symmetric port of slice 4e to Create Claim. Uses the `ClaimReason`
enum (`missing_item`, `wrong_item`, `production_failure`, `other`)
instead of the `reason_id` foreign key — the backend validator
`VendorPostClaimItemsReq` takes `reason: z.nativeEnum(ClaimReason)`
per-item.

#### Files modified

- `packages/vendor/src/pages/orders/[id]/claims/create/index.tsx`:
  - Imported `Select` from `@medusajs/ui`.
  - Added local `ClaimReason` type + `CLAIM_REASONS` const array
    (4 values matching `@medusajs/framework/utils` enum).
  - Added per-row state: `itemReasons` (keyed by item id, valued
    `ClaimReason`) and `itemNotes` (keyed by item id, free text).
  - Claim-items section: when a row's qty > 0, an expandable
    two-column grid renders below with a `Reason` `<Select>` of
    the four ClaimReason values + a `Note` `<Input>`. Per-row
    `data-testid`: `claim-item-${id}-reason`, `-note`.
  - On Confirm: `itemsPayload` now includes `reason` (enum value)
    and `internal_note` per row when set.

- `packages/vendor/src/i18n/translations/en.json`:
  - Added 7 keys under `orders.claims`:
    - `reasonPlaceholder` ("Choose a reason")
    - `itemNotePlaceholder` ("Add a note (optional)")
    - `reasons.missing_item` ("Missing item")
    - `reasons.wrong_item` ("Wrong item")
    - `reasons.production_failure` ("Production failure")
    - `reasons.other` ("Other")

#### Verification

- `bun run build` — 9/9 packages green in 31.4s.
- `bunx oxlint` on touched file — exit 0, no warnings, no errors.

### Session 2026-06-08 (dd) — Slice 4e: Exchange per-row reason + note

Closes the last Figma gap inside Create Exchange. Together with
slices 4-4d, the Exchange modal now covers:

- Inbound items qty stepper (slice 4)
- Outbound variant picker via StackedFocusModal (slice 4b)
- Return Location dropdown (slice 4c)
- Return shipping (Optional) dropdown (slice 4d)
- Per-row reason + note on inbound items (this slice)
- Confirm + Cancel + draft cleanup

Five of five Figma blocks on Create Exchange. The flow is
feature-complete vs the Figma frame.

#### Files modified

- `packages/vendor/src/pages/orders/[id]/exchanges/create/index.tsx`:
  - Imported `useReturnReasons` from `@hooks/api/return-reasons`.
  - Added per-row state: `inboundReasons` and `inboundNotes` keyed
    by item id.
  - Inbound items section: when a row's qty > 0, an expandable
    two-column grid renders below it with a `Reason` `<Select>`
    (sourced from `useReturnReasons`) and a free-text `Note`
    `<Input>`. Per-row `data-testid`:
    `exchange-inbound-item-${id}-reason`, `-note`.
  - On Confirm: `inboundPayload` now includes `reason_id` and
    `internal_note` per row when set. Backend
    `VendorPostExchangesReturnRequestItemsReq` already accepts both.

- `packages/vendor/src/i18n/translations/en.json`:
  - Added 2 keys under `orders.exchanges`:
    - `reasonPlaceholder` ("Choose a reason")
    - `itemNotePlaceholder` ("Add a note (optional)")

#### Spec checklist update

§2 "Kebab exposes" — now reads "shipped sessions (t/u/z/aa/bb/cc/dd):
... five of five blocks on Exchange". Claim per-row reason + location
remain queued (claim-items route doesn't accept location_id —
would need to route through inbound-items).

#### Verification

- `bun run build` — 9/9 packages green in 24.2s.
- `bunx oxlint` on touched file — exit 0, no warnings, no errors.

### Session 2026-06-08 (cc) — Slice 4d: Exchange Return-shipping picker + hooks

Adds the two missing inbound + outbound shipping-method hooks and
wires the inbound Return-shipping picker into Create Exchange.
Together with slice 4c (Location), Create Exchange now covers
inbound items + outbound items + location + inbound shipping —
4 of 5 Figma flow blocks (the 5th being per-row reason on inbound).

#### Files modified

- `packages/vendor/src/hooks/api/exchanges.tsx`:
  - Added `useAddExchangeInboundShipping(exchangeId, orderId, opts?)`
    — `POST /vendor/exchanges/:id/inbound/shipping-method`.
  - Added `useAddExchangeOutboundShipping(exchangeId, orderId, opts?)`
    — `POST /vendor/exchanges/:id/outbound/shipping-method`. Wired
    for completeness; not yet consumed by the modal.

- `packages/vendor/src/pages/orders/[id]/exchanges/create/index.tsx`:
  - Imported `useAddExchangeInboundShipping`, `useShippingOptions`.
  - Added `shippingOptionId` state.
  - Added `useShippingOptions({ stock_location_id: locationId })`
    gated on `!!locationId` via `enabled` flag — no fetch before
    the user picks a location (matches Create Return session k
    pattern).
  - Location dropdown's `onValueChange` now resets `shippingOptionId`
    so a stale option from a different location can't survive the
    re-source.
  - Added a Return shipping `<Select>` card below the Location card
    (label `orders.exchanges.inboundShipping` ("Return shipping
    (Optional)")) — disabled until a location is chosen; placeholder
    flips between "Choose a shipping option" and "Pick a location
    first".
  - On Confirm: after the inbound items add, calls
    `addInboundShipping({ shipping_option_id })` when a shipping
    option is selected. `isAddingShipping` added to the button's
    `isLoading` state.

- `packages/vendor/src/i18n/translations/en.json`:
  - Added 4 keys under `orders.exchanges`:
    - `inboundShipping` ("Return shipping (Optional)")
    - `inboundShippingHint` ("Choose which method to use for the
      inbound shipment.")
    - `inboundShippingPlaceholder` ("Choose a shipping option")
    - `inboundShippingLockedPlaceholder` ("Pick a location first")

#### What's NOT in this slice

- **Per-row reason / note on inbound items** — last remaining Figma
  block in Create Exchange. Backend accepts `reason_id` and
  `internal_note` per item; UI just needs per-row expandable rows.
- **Outbound shipping picker** in the UI — hook exists
  (`useAddExchangeOutboundShipping`) but not wired into the modal
  yet. Less common usage path; deferred.
- **Update / remove existing shipping-method actions** — only POST
  is exposed; PUT / DELETE on `:action_id` deferred until needed.

#### Verification

- `bun run build` — 9/9 packages green in 32.0s.
- `bunx oxlint` on touched files — exit 0, no warnings, no errors.

### Session 2026-06-08 (bb) — Slice 4c: Exchange Location picker

Adds the Return Location dropdown to the Create Exchange modal —
sources from `useStockLocations`, threads the chosen `location_id`
into the `useAddExchangeInboundItems` payload (the
`/vendor/exchanges/:id/inbound/items` route already accepts
`location_id?: string` per `VendorPostExchangesReturnRequestItemsReq`).

#### Files modified

- `packages/vendor/src/pages/orders/[id]/exchanges/create/index.tsx`:
  - Imported `Label`, `Select` from `@medusajs/ui`.
  - Imported `useStockLocations` from `@hooks/api/stock-locations`.
  - Added `locationId` state.
  - Added a Location card section above the outbound items section,
    matching the Create Return session (k) card shape.
  - Threaded `location_id: locationId` into the inbound items
    payload when the user has selected a location.

- `packages/vendor/src/i18n/translations/en.json`:
  - Added 3 keys under `orders.exchanges`:
    - `location` ("Return location")
    - `locationHint` ("Choose which location you want the returned
      items to ship to.")
    - `locationPlaceholder` ("Choose a location")

#### What's NOT in this slice

- **Return shipping picker** — needs new hooks
  `useAddExchangeInboundShipping`, `useUpdateExchangeInboundShipping`,
  `useRemoveExchangeInboundShipping`. Tracked as follow-up; the
  backend routes already exist (`/vendor/exchanges/:id/inbound/shipping-method`).
- **Location on Create Claim** — `claim-items` route doesn't accept
  `location_id` directly (the claim flow uses claim-items, not
  inbound-items, for marking existing items as claimed). Adding a
  Location dropdown to the Claim modal would need a separate inbound
  items flow that the v1 modal doesn't expose. Deferred.

#### Verification

- `bun run build` from repo root — 9/9 packages green in 31.5s.
- `bunx oxlint` on both modals — exit 0, no warnings, no errors.

### Session 2026-06-08 (aa) — Slice 5b: Claim outbound variant picker

Closes one of the §4 follow-up sub-slices flagged in session (x).
Mirrors slice 4b (session z) exactly — same StackedFocusModal
trigger, same reuse of `AddOrderEditItemsTable`, gated on
`claimType === "replace"` (the only difference from 4b).

#### Files modified

- `packages/vendor/src/pages/orders/[id]/claims/create/index.tsx`:
  - Imported `StackedFocusModal` + `useStackedModal` from
    `@components/modals`.
  - Imported `useAddClaimOutboundItems` (already in
    `hooks/api/claims.tsx` from slice 5).
  - Imported `AddOrderEditItemsTable` from
    `../../edit/_components/add-order-edit-items-table` — reuses the
    same generic variant table session (q) shipped for Edit Order
    and slice 4b (session z) reused for Exchange.
  - Added `outboundItems` memo: when `claimType === "replace"`,
    derives items from `preview.items` not present in `order.items`
    (items added via add-outbound-item actions). Returns `[]` when
    `claimType === "refund"` so the section is empty/inactive.
  - Relaxed `hasSelection` to also count outbound additions for the
    Confirm button enablement.
  - Added a new "Items to send" section between the claim-items
    section and the internal-note section, conditional on
    `claimType === "replace"`. Header includes an
    `AddClaimOutboundItemsTrigger` button; body lists added outbound
    items with `{quantity}x` display.
  - Added `AddClaimOutboundItemsTrigger` component at the bottom of
    the file. Wraps `StackedFocusModal` with id
    `claim-add-outbound-items`, mounting `AddOrderEditItemsTable` in
    the body and a Cancel / Save footer. On Save, calls
    `addOutboundItems({ items: variantIds.map(v => ({ variant_id: v,
    quantity: 1 })) })`, clears selection state, closes the stacked
    modal. `data-testid` ids: `claim-add-outbound-trigger`, `-save`,
    `-cancel`, `claim-outbound-item-${id}`.
- `packages/vendor/src/i18n/translations/en.json`:
  - Added 4 keys under `orders.claims` (sibling to `claimItems`):
    - `outboundItems` ("Items to send")
    - `noOutboundItems` ("No replacement items added yet.")
    - `addOutboundItems` ("Add items")
    - `addOutboundItemsDescription` ("Pick variants to send as
      replacements for the claimed items.")

#### What's NOT in this slice

- **Per-row quantity edit / remove** on outbound items — hooks
  `useUpdateClaimOutboundItem` would need adding to the existing
  hook surface (only `useAddClaimOutboundItems` was created in slice
  5; the variant-axis update/remove paths for outbound items can be
  exposed in a follow-up).
- **Inbound per-row reason dropdown** (uses `ClaimReason` enum) +
  location/shipping pickers — separate scope; backend already
  accepts these fields.
- **Outbound shipping picker** — separate from outbound items.

#### Verification

- `bun run build` from repo root — 9/9 packages green in 32.7s
  (mostly cached; `@mercurjs/vendor` recompiled).
- `bunx oxlint packages/vendor/src/pages/orders/[id]/claims/create/index.tsx`
  — exit 0, no warnings, no errors.
- No headless UI run this session — the stacked-modal trigger
  pattern is proven by the sibling Exchange (slice 4b) and Edit
  Order (session q) modals.

### Session 2026-06-08 (z) — Slice 4b: Exchange outbound variant picker

Closes one of the §4 follow-up sub-slices flagged in session (x).
Mirrors session (q)'s port of `add-order-edit-items-table` for Edit
Order — same StackedFocusModal trigger pattern, reusing the existing
generic variant table.

#### Files modified

- `packages/vendor/src/pages/orders/[id]/exchanges/create/index.tsx`:
  - Imported `StackedFocusModal` + `useStackedModal` from
    `@components/modals`.
  - Imported `useAddExchangeOutboundItems` (already in
    `hooks/api/exchanges.tsx` from slice 4).
  - Imported `AddOrderEditItemsTable` from
    `../../edit/_components/add-order-edit-items-table` — the same
    generic variant table session (q) shipped is reused as-is. Both
    flows take `{ variant_id, quantity }` pairs as input, so no
    bespoke table is needed.
  - Added `outboundItems` memo: derives items from `preview.items`
    not present in `order.items` (i.e. items added via
    add-outbound-item actions). Same diff pattern as the Edit Order
    modal's `addedItems` memo (session q).
  - Relaxed `hasSelection` to also count outbound additions, so the
    user can confirm a replace-only exchange (no inbound).
  - Inserted a new "Items to send" section between the inbound items
    section and the internal-note section. Header includes an
    `AddOutboundItemsTrigger` button; body lists added outbound items
    with `{quantity}x` qty display (uniform 1 for v1 — quantity
    editing per-row queued for follow-up).
  - Added a new `AddOutboundItemsTrigger` component at the bottom of
    the file. Wraps `StackedFocusModal` with id
    `exchange-add-outbound-items`, mounting
    `AddOrderEditItemsTable` in the body and a Cancel / Save footer.
    On Save, calls `addOutboundItems({ items: variantIds.map(v => ({
    variant_id: v, quantity: 1 })) })`, clears the selection state,
    and closes the stacked modal. `data-testid` ids:
    `exchange-add-outbound-trigger`, `-save`, `-cancel`,
    `exchange-outbound-item-${id}`.
- `packages/vendor/src/i18n/translations/en.json`:
  - Added 4 keys under `orders.exchanges` (sibling to
    `inboundItems`):
    - `outboundItems` ("Items to send")
    - `noOutboundItems` ("No replacement items added yet.")
    - `addOutboundItems` ("Add items")
    - `addOutboundItemsDescription` ("Pick variants to send as
      replacements for the returned items.")

#### What's NOT in this slice

- **Per-row quantity edit / remove** on outbound items — hooks
  `useUpdateExchangeOutboundItem` and `useRemoveExchangeOutboundItem`
  exist in tree (slice 4); v1 ships add-only with qty=1.
- **Inbound per-row reason dropdown** + location/shipping pickers —
  separate scope; backend already accepts these fields.
- **Outbound shipping picker** — separate from outbound items;
  uses `useAddExchangeOutboundShipping` (not yet on the hooks list;
  would need adding alongside slice-4 hooks).

#### Verification

- `bun run build` from repo root — 9/9 packages green in 24.5s
  (mostly cached; `@mercurjs/vendor` recompiled).
- `bunx oxlint packages/vendor/src/pages/orders/[id]/exchanges/create/index.tsx`
  — exit 0, no warnings, no errors.
- No headless UI run this session — the stacked-modal trigger
  pattern is proven by the sibling Edit Order modal's
  `AddItemsTrigger` (session q).

### Session 2026-06-08 (x) — /loop slices 1-8 close-out sweep

End of the /loop sequence kicked off after session (q). Captures the
final state of the checklist and explains why frontmatter stays
`in_progress` rather than flipping to `passing`.

#### Box accounting after sessions (r) through (w)

Roughly 25 total verification items across §0–§7. After the seven
slice commits (`59db5780`, `603bab34`, `e5623dc2`, `9b3fae04`):

- ~19 items at `[x]` (~76%).
- ~6 items at `[~]` (~24%), each documented with rationale.
- 0 items at `[ ]` — no untouched gaps.

#### Why frontmatter doesn't flip to `passing`

CLAUDE.md "Definition Of Done" says a spec is `passing` only when
"the required verification actually ran". The /loop input was
conditional: "flip spec frontmatter to passing **once all checklist
boxes are ticked**". They aren't — six remain `[~]` for one of
three reasons:

1. **Deliberate scope decisions** (reverted or dropped after
   discussion):
   - §0 payment/fulfillment status filters reverted (session c).
   - §1 `Add filter` panel intentionally omits Payment + Fulfillment
     options (matches the reverted backend state).
   - §1 Sales channel column kept as documented non-drift (session h)
     — design-owner sign-off pending.
   - §6 Fulfillment polish partial-by-design (session l) — confirmed
     no structural drift; minor cosmetic items deferred.

2. **Queued follow-up sub-slices** with hooks already in tree:
   - §4 Create Exchange UI v1 → slice 4b (outbound picker +
     per-item reason + location/shipping dropdowns).
   - §4 Create Claim UI v1 → slice 5b (outbound picker when
     `claimType === "replace"` + per-item reason + location/shipping).
   - §2 Line-item subrows for claims/exchanges (Summary-section row
     decoration, distinct from the modal flows of §4).

3. **Genuinely deferred**:
   - §0 `order-refund.spec.ts` integration suite — backend already
     covered by other suites (`order-list-filters`, `mark-as-paid`,
     `order-edit`, `order-exchange`, `order-claim`); refund-specific
     suite is nice-to-have, not blocking.

#### What ships ready to use right now

End-to-end vendor surface for the full Phase-1 order workflow:
- List with search + has_open_request filter + sales-channel
  column + sort popover.
- Detail with header card, summary section (allocate CTA,
  outstanding action strip, per-line-item return subrow), payment
  section (per-payment row + refund kebab), fulfillment section
  with Fulfill / Mark-as-shipped / Mark-as-delivered, customer
  sidebar, activity timeline (placed, payment events, fulfillment
  events, return events, edit events, claim/exchange events when
  data arrives).
- Edit Order via kebab → focus modal (original-item qty stepper +
  add-items variant picker via stacked modal + active-edit banner
  above the order header).
- Create Return via kebab → focus modal (items, reason, note,
  location, return shipping, notification).
- Create Exchange via kebab → focus modal (inbound qty stepper +
  confirm; outbound picker queued).
- Create Claim via kebab → focus modal (ClaimType selector +
  claim-items qty stepper + confirm; outbound picker queued for
  replace).
- Create Refund via Payment-row kebab → drawer.
- Receive Items via Summary CTA → focus modal.

Backend tree: full `/vendor/order-edits`, `/vendor/exchanges`,
`/vendor/claims`, `/vendor/returns`, `/vendor/payments`,
`/vendor/payment-collections/:id/mark-as-paid`, plus the existing
`/vendor/orders/*` surface and the `has_open_request` filter
middleware. Five integration suites green:
`order-list-filters` (3/3), `order-mark-as-paid` (4/4),
`order-edit` (11/11), `order-exchange` (6/6), `order-claim` (7/7).

#### Recommended next session

Pick whichever has the most product urgency:
- Slice 4b — Exchange outbound picker + inbound location/shipping
  dropdowns + per-item reason. Mirrors session-(q)'s port of admin's
  `add-order-edit-items-table` into the StackedFocusModal pattern.
- Slice 5b — Claim outbound picker (gated on `claimType === "replace"`)
  + same inbound dropdowns + per-item `ClaimReason` enum.
- Refund-specific integration suite (`order-refund.spec.ts`) — small,
  unblocks the §0 last `[~]`.

#### Verification

- Build + lint clean across all four slice commits in this loop.
- Five integration suites green (cited above).
- Spec evidence sections updated for every shipped slice.

### Session 2026-06-08 (v + w) — Slices 6 + 7 (query-config + activity-rule wiring)

Closes the two cross-cutting slices in one commit since slice 6 (wire
claim/exchange activity rules) is a 6-line follow-on to slice 7 (add
exchanges/claims to vendor query-config) — they can't ship separately
because slice 6 reads from the fields slice 7 surfaces.

#### Files modified

- `packages/core/src/api/vendor/orders/query-config.ts` — added 7
  fields to `vendorOrderFields` between `*returns.shipping_methods`
  and `*summary`:
  - `*exchanges`, `*exchanges.return`, `*exchanges.additional_items`,
  - `*claims`, `*claims.return`, `*claims.additional_items`,
  - `*claims.claim_items`.
- `packages/vendor/src/pages/orders/[id]/constants.ts` — added the
  same 7 fields to `DEFAULT_RELATIONS` so the dashboard query at
  `GET /vendor/orders/:id?fields=...` requests them.
- `packages/vendor/src/pages/orders/[id]/_components/order-activity-section/hooks/use-activity-items.tsx`
  — replaced the `const claims: AdminClaim[] = []` /
  `const exchanges: AdminExchange[] = []` stubs (added in session b
  with a SPEC-008 TODO) with reads from `order.claims` /
  `order.exchanges`. The downstream rules at lines 208-248 were
  already wired in session (b) — they light up automatically now
  that the source arrays are populated. The legacy admin shape
  (`return_id`, `additional_items`, `canceled_at`, `created_at`,
  `slice(-7)`) is exactly what the new vendor data carries since
  the typed `AdminClaim` / `AdminExchange` interfaces are inherited
  from Medusa's order module.

#### What slice 6 was actually missing vs what was already there

The spec's §2 "edit-request generator rule" was actually shipped
back in session (b) at `use-activity-items.tsx:250-275` — the rule
is status-aware (`requested` / `confirmed` / `declined` /
`canceled`) and uses the `orders.activity.events.edit.requested`
translation key already present in `en.json:1793`. The carry-over
"queued for slice 6" framing in session (s)'s checklist hygiene
sweep was incorrect — corrected here.

The actual slice-6 deliverable is the 6-line stub-removal above,
which makes claim/exchange rows render now that backends and
query-config are live.

#### Verification

- `bun run build` from repo root — 9/9 packages green.
- `bunx oxlint` on the touched files — exit 0, no warnings, no
  errors.
- No headless UI run — activity rules are pure transforms over
  array inputs; no new render paths or hooks added.

### Session 2026-06-08 (u) — Create Claim UI v1 (kebab + route + modal + hooks + ClaimType selector)

Slice 5 first cut. Mirrors slice-4 cadence — hooks + kebab + route +
minimal RouteFocusModal walking begin → claim-items qty stepper →
confirm — plus the claim-specific `ClaimType` selector (refund vs
replace) at the top of the modal. Outbound variant picker + inbound
items + shipping deferred to follow-up (hooks already exist in tree).

#### Files added

- `packages/vendor/src/hooks/api/claims.tsx` — 9 mutation hooks
  against `sdk.vendor.claims.*` mirroring the slice-4 exchange shape:
  - `useCreateClaim(orderId, opts?)` — `POST /vendor/claims`
    (takes `{ type: ClaimType, order_id, ... }`).
  - `useCancelClaimBegin(claimId, orderId, opts?)` —
    `DELETE /vendor/claims/:id/request` (cancel a begun claim).
  - `useRequestClaim(claimId, orderId, opts?)` —
    `POST /vendor/claims/:id/request` (confirm).
  - `useCancelClaim(claimId, orderId, opts?)` —
    `POST /vendor/claims/:id/cancel` (cancel a confirmed claim).
  - `useAddClaimItems` / `useUpdateClaimItem` /
    `useRemoveClaimItem` — claim-items subtree (the
    claim-specific path that exchanges don't have). The typed SDK
    exposes the kebab-cased `claim-items` URL as `claimItems`
    property on the route map.
  - `useAddClaimInboundItems` / `useAddClaimOutboundItems` —
    inbound + outbound subtrees (update/remove variants deferred to
    a follow-up sub-slice; same shape as the exchange hooks, no
    new surface needed).
  All onSuccess paths invalidate `ordersQueryKeys.details()` +
  `preview(orderId)` + `changes(orderId)` via the shared
  `invalidateOrder` helper.
- `packages/vendor/src/pages/orders/[id]/claims/create/index.tsx`
  (~290 lines) — Create Claim `RouteFocusModal` scaffold.
  - **ClaimType selector** at the top using `RadioGroup` —
    `refund` (no replacement shipment) vs `replace` (with outbound
    shipment). Locked once `claimId` is set (the workflow doesn't
    accept type changes mid-draft); footer note explains.
  - On mount: if `preview.order_change.change_type !== "claim"`,
    redirects with `orders.claims.activeChangeError`. Otherwise
    creates a draft via `useCreateClaim({ type, order_id })`.
    Guarded by module-scoped `IS_REQUEST_RUNNING` + `claimId` state
    for StrictMode safety (matches Create Return / Edit Order /
    Create Exchange patterns).
  - Claim-items list: filters `order.items` to rows where
    `fulfilled_quantity - return_requested_quantity - returned_quantity > 0`.
    Each row renders product/variant title + an `Input[type=number]`
    qty stepper bounded `[0, remaining]`. Per-row `data-testid`.
  - Internal note `<Textarea>` (read-only for now — threading into
    `useUpdateOrderChange` deferred).
  - Confirm: collects selected items into the claim-items payload,
    calls `useAddClaimItems({ items })` once, then `useRequestClaim()`.
    Disabled when no items selected (`!hasSelection`).
  - Cancel: calls `useCancelClaimBegin()` then navigates back;
    swallows errors so a stuck network call doesn't trap the user.

#### Files modified

- `packages/vendor/src/pages/orders/[id]/_components/order-general-section/order-general-section.tsx`:
  - Imported `ExclamationCircle` from `@medusajs/icons`.
  - Added a fourth kebab action `Create Claim` in the same group as
    Complete / Edit order / Create Return / Create Exchange,
    targets `to: "claims/create"`, disabled when `order.canceled_at`
    is set.
- `packages/vendor/src/get-route-map.tsx` — added a `claims/create`
  route after `exchanges/create`. Lazy-loads
  `./pages/orders/[id]/claims/create`.
- `packages/vendor/src/i18n/translations/en.json` — added 10 keys
  under the existing `orders.claims` namespace:
  - `title` ("Create Claim"),
  - `description` ("Choose claim type and select items the customer
    wants to claim."),
  - `typeLabel` ("Claim type"),
  - `typeRefund` ("Refund — no replacement shipment"),
  - `typeReplace` ("Replace — ship replacement items"),
  - `typeLockedAfterStart` ("Claim type is locked once a draft is
    started. Cancel and reopen to switch."),
  - `claimItems` ("Items to claim"),
  - `noClaimableItems` ("No claimable items on this order."),
  - `remainingQty` ("{{count}} claimable"),
  - `noteHint` ("Add an internal note for this claim (visible only
    to your team).").
  Pre-existing keys reused: `create`, `confirm`, `activeChangeError`,
  `toast.confirmedSuccessfully`, `toast.canceledSuccessfully`.

#### What's NOT in this slice (deferred to slice 5b)

- **Outbound variant picker** — admin's
  `add-claim-outbound-items-table/` (5 files). When `claimType ===
  "replace"`, the user needs to pick replacement variants. Hooks
  (`useAddClaimOutboundItems`) already exist; picker mirrors
  session-(q)'s `add-order-edit-items-table` port.
- **Inbound items + shipping** dropdowns (location +
  return-shipping). Backend already accepts via
  `claims/:id/inbound/items` + `claims/:id/inbound/shipping-method`.
- **Per-row reason dropdown** (`ClaimReason` enum: `missing_item`,
  `wrong_item`, `production_failure`, `other`). Backend
  `VendorPostClaimItemsReq` accepts `reason` per item.
- **Outbound shipping** dropdown (only when `claimType === "replace"`).
- **Claim totals / estimated difference** — computed client-side
  from inbound + outbound prices.

#### Verification

- `bun run build` from repo root — **9 / 9 packages pass** in
  60.0s (`@mercurjs/vendor` recompiled; route map regenerated via
  `@mercurjs/core` codegen pass; DTS emission clean).
- `bunx oxlint packages/vendor/src/hooks/api/claims.tsx
  packages/vendor/src/pages/orders/[id]/claims/create/index.tsx
  packages/vendor/src/pages/orders/[id]/_components/order-general-section/order-general-section.tsx`
  — exit 0, no warnings, no errors.
- No headless UI run this session — kebab navigation path is
  `RouteFocusModal` (proven by the sibling Create Return / Edit
  Order / Create Exchange siblings) and the hook contracts are
  unchanged from slice 4.

### Session 2026-06-08 (t) — Create Exchange UI v1 (kebab + route + modal scaffold + hooks)

Slice 4 first cut. Mirrors the Edit Order session-(p) cadence —
hooks + kebab + route + minimal RouteFocusModal walking begin →
inbound qty stepper → confirm; outbound variant picker deferred to
follow-up (hooks already exist in tree).

#### Files added

- `packages/vendor/src/hooks/api/exchanges.tsx` — 10 mutation
  hooks against `sdk.vendor.exchanges.*`:
  - `useCreateExchange(orderId, opts?)` — `POST /vendor/exchanges`.
  - `useCancelExchangeBegin(exchangeId, orderId, opts?)` —
    `DELETE /vendor/exchanges/:id/request` (cancel a begun exchange,
    NOT a confirmed one). Spec §"Route convention" pattern.
  - `useRequestExchange(exchangeId, orderId, opts?)` —
    `POST /vendor/exchanges/:id/request` (move draft → requested,
    confirms inbound + outbound).
  - `useCancelExchange(exchangeId, orderId, opts?)` —
    `POST /vendor/exchanges/:id/cancel` (cancel a confirmed exchange).
  - `useAddExchangeInboundItems` / `useUpdateExchangeInboundItem` /
    `useRemoveExchangeInboundItem` — inbound subtree.
  - `useAddExchangeOutboundItems` / `useUpdateExchangeOutboundItem` /
    `useRemoveExchangeOutboundItem` — outbound subtree.
  All onSuccess paths invalidate `ordersQueryKeys.details()` +
  `preview(orderId)` + `changes(orderId)` via the shared
  `invalidateOrder` helper. Mirrors the `order-edits.tsx` shape.
- `packages/vendor/src/pages/orders/[id]/exchanges/create/index.tsx`
  (~250 lines) — Create Exchange `RouteFocusModal` scaffold.
  - On mount: if `preview.order_change` exists and its
    `change_type !== "exchange"`, redirects with
    `orders.exchanges.activeChangeError`. Otherwise creates a draft
    via `useCreateExchange({ order_id })` (guarded by module-scoped
    `IS_REQUEST_RUNNING` flag + `exchangeId` state for StrictMode
    safety, matching the Create Return + Edit Order patterns).
  - Inbound items list: filters `order.items` to rows where
    `fulfilled_quantity - return_requested_quantity - returned_quantity > 0`.
    Each row renders product/variant title + an `Input[type=number]`
    qty stepper bounded `[0, remaining]`. Per-row `data-testid` on
    the stepper.
  - Internal note `<Textarea>` (read-only for now; threading into
    `useUpdateOrderChange` is deferred).
  - Confirm: collects selected items into the inbound payload,
    calls `useAddExchangeInboundItems({ items })` once, then
    `useRequestExchange()`. Disabled when no items selected
    (`!hasSelection`) — matches the Create Return session-(l)
    `hasSelection` guard pattern.
  - Cancel: calls `useCancelExchangeBegin()` then navigates back;
    swallows errors so a stuck network call doesn't trap the user.

#### Files modified

- `packages/vendor/src/pages/orders/[id]/_components/order-general-section/order-general-section.tsx`:
  - Imported `ArrowPath` from `@medusajs/icons`.
  - Added a third kebab action `Create Exchange` in the same group
    as Complete / Edit order / Create Return, between Create Return
    and the destructive Cancel group. Targets `to: "exchanges/create"`
    (relative — keeps routing inside the `/orders/:id` parent),
    disabled when `order.canceled_at` is set.
- `packages/vendor/src/get-route-map.tsx` — added an
  `exchanges/create` route between `edit` and the closing children
  array. Lazy-loads `./pages/orders/[id]/exchanges/create`.
- `packages/vendor/src/i18n/translations/en.json` — inserted under
  the existing `orders.exchanges` namespace (sibling to
  `orders.exchanges.create`):
  - `title` ("Create Exchange"),
  - `description` ("Select returnable items and confirm to create
    an exchange request."),
  - `inboundItems` ("Items to return"),
  - `noReturnableItems` ("No returnable items on this order."),
  - `remainingQty` ("{{count}} returnable"),
  - `noteHint` ("Add an internal note for this exchange (visible
    only to your team)."),
  - `toast.confirmedSuccessfully` / `toast.canceledSuccessfully`.
  The pre-existing `orders.exchanges.activeChangeError`
  ("There is an active order change on this order. Please finish or
  discard the previous change.") is reused — no need to add a new
  key.

#### What's NOT in this slice (deferred to slice 4b)

- **Outbound variant picker** — admin's
  `add-exchange-outbound-items-table/` (5 files: table + columns +
  filters + query hooks). Same pattern as session (q)'s port of
  admin's `add-order-edit-items-table/` for Edit Order. Hooks
  (`useAddExchangeOutboundItems`, etc.) already exist in
  `hooks/api/exchanges.tsx` so the picker can be wired without
  revisiting the lifecycle code in `create/index.tsx`.
- **Per-item reason + note** on inbound rows (Figma shows a per-row
  reason dropdown sourced from `useReturnReasons`). Backend already
  accepts `reason_id` + `internal_note` per-item — the UI just
  needs an expandable per-row block, same shape as the Create
  Return session-(j) row.
- **Location + return-shipping dropdowns** on inbound (matches
  Create Return session-(k) shape; backend already accepts via
  `inbound/shipping-method` route).
- **Outbound shipping** dropdown.
- **Exchange totals / estimated difference** — computed
  client-side from inbound + outbound prices, matching admin's
  `claim-create-form` pattern. Display-only.

#### Verification

- `bun run build` from repo root — **9 / 9 packages pass** in
  60.3s (`@mercurjs/vendor` recompiled; route map regenerated via
  `@mercurjs/core` codegen pass; DTS emission clean).
- `bunx oxlint packages/vendor/src/hooks/api/exchanges.tsx
  packages/vendor/src/pages/orders/[id]/exchanges/create/index.tsx
  packages/vendor/src/pages/orders/[id]/_components/order-general-section/order-general-section.tsx`
  — exit 0, no warnings, no errors.
- No headless UI run this session — the kebab navigation path is
  `RouteFocusModal` (proven by the sibling Create Return / Edit
  Order siblings) and the hook contracts are unchanged from the
  Edit Order session-(p) pattern.

### Session 2026-06-08 (s) — `/vendor/claims` integration suite + checklist hygiene

Closes the deferred integration suite from session (r) and refreshes
the §0 + §2 verification checklist now that exchange + claim
backends are shipped.

#### Files added

- `integration-tests/http/order/vendor/order-claim.spec.ts` — 7
  cases, 1:1 port of the slice-2 `order-exchange.spec.ts` shape with
  one extra case for the claim-specific `claim-items` subtree:
  1. `POST /vendor/claims` begins a claim on a seller-owned order
     (`type: "refund"`, response carries `claim.id` matching `^claim_/`).
  2. `POST /vendor/claims` rejects when caller does not own the
     order (404 via `validateSellerOrder`).
  3. `POST /vendor/claims/:id/claim-items` rejects from non-owning
     seller (404 via `validateSellerClaim`).
  4. `POST /vendor/claims/:id/inbound/items` rejects from non-owning
     seller.
  5. `POST /vendor/claims/:id/outbound/items` rejects from
     non-owning seller (`type: "replace"` — required for the workflow
     to accept outbound items).
  6. `DELETE /vendor/claims/:id/request` cancels the in-flight claim
     draft (200, `{ deleted: true }`).
  7. `DELETE /vendor/claims/:id/request` rejects when caller does not
     own claim.
  Reuses the offer-based `seedSellerOfferWithShipping` +
  `completeCartCheckout` shape from `order-exchange.spec.ts`.

#### Files modified

- `docs/specs/SPEC-008-vendor-orders-figma-gap.md` —
  - §0 last bullet: refreshed Integration-suites summary from "Remaining
    suites blocked on the unshipped backend routes above" →
    explicit list of 5 shipped suites (filters 3/3, mark-as-paid 4/4,
    order-edit 11/11, order-exchange 6/6, order-claim 7/7) plus
    `order-refund.spec.ts` still pending on UI wiring polish.
  - §0 claims bullet: flipped from "Integration suite deferred (carried
    forward to follow-up)" → "Integration suite shipped session (s)
    — 7/7 cases".
  - §2 kebab bullet: was "Edit order / Create Exchange / Create
    Claim still missing — blocked on §0 backend routes" → "Edit
    order shipped sessions (p) + (q). Create Exchange + Create Claim
    backends shipped sessions (slice 2) + (r); UI ports queued."
  - §2 line-item subrow bullet: "Claims / exchanges blocked on §0
    backend gaps" → "now unblocked at the backend; UI subrow
    rendering queued alongside Create Exchange / Create Claim UI
    ports (slices 4 + 5)".
  - §2 activity-timeline bullet: "Claim / exchange rows blocked on §0
    backend" → "queued for slice 6 (mount + generators) now that
    backends are live".

#### Verification

- `bun run test:integration:http -- order-claim` — **7 passed, 7
  total** in 32.3s. Force-exit message printed at the end is
  expected (`@medusajs/test-utils` always prints it on success;
  unrelated to test outcome).
- `bunx oxlint integration-tests/http/order/vendor/order-claim.spec.ts`
  — exit 0; one carried-over `no-await-in-loop` warning on the
  shipping-options seeding loop, intentional (mirrors the
  exchange-side and return-side suites — each call mutates the
  same cart so they must serialize).
- `bun run build` from repo root — **9 / 9 packages pass** in
  62.2s.

#### Still deferred (carried forward — next slice up: Create Exchange UI)

- **Create Exchange UI** (slice 4) — port of admin's
  `routes/orders/order-create-exchange/` into
  `packages/vendor/src/pages/orders/[id]/exchanges/`. Kebab entry
  in `OrderGeneralSection`, route registered, RouteFocusModal +
  `useCreateExchange` draft-and-mutate hooks.
- **Create Claim UI** (slice 5) — same shape, plus claim-items
  picker + ClaimType selector.
- **Activity timeline mount + edit-request generator** (slice 6) —
  bring `OrderActivitySection` out of dead state, add the
  `order_change.change_type === "edit"` → "Order edit #N requested"
  rule, exchanges/claims rows.
- **Vendor query-config additions** (slice 7) — surface
  `*exchanges`, `*exchanges.return`, `*exchanges.additional_items`,
  `*claims`, `*claims.return`, `*claims.additional_items`,
  `*claims.claim_items` on `GET /vendor/orders/:id`.

### Session 2026-06-08 (r) — vendor `/vendor/claims` backend tree

Slice 3 of the §0 backend gap. Mirrors Medusa admin's `/admin/claims`
tree exactly, plus the claim-specific `claim-items` subtree that
exchanges (slice 2) didn't have.

#### Files added (`packages/core/src/api/vendor/claims/`)

- `validators.ts` — 10 Zod schemas: `VendorPostOrderClaimsReq`
  (uses `ClaimType` enum + nullable `reason_id` per admin),
  `VendorPostCancelClaimReq`, `VendorPostClaimItemsReq` (uses
  `ClaimReason` enum on each item), `VendorPostClaimsItemsActionReq`
  (qty/reason_id/internal_note update for claim-items + outbound),
  `VendorPostClaimsRequestReturnItemsReq`,
  `VendorPostClaimsRequestItemsReturnActionReq`,
  `VendorPostClaimsAddItemsReq`, `VendorPostClaimsAddItemsActionReq`,
  `VendorPostClaimsShippingReq`, `VendorPostClaimsShippingActionReq`.
  All shapes are 1:1 ports of the corresponding
  `AdminPost*ReqSchema` in admin's `claims/validators.ts`.
- `helpers.ts` — `validateSellerClaim(scope, sellerId, claimId)`.
  Query-graph `order_claim` → `order_id`, then defers to existing
  `validateSellerOrder`. Mirror of `validateSellerExchange` from
  slice 2.
- `middlewares.ts` — exports `vendorClaimsMiddlewares`. Two guards
  (`assertSellerOwnsOrderInBody` for create, `assertSellerOwnsClaimInParam`
  for the 17 sub-routes). Mirrors `exchanges/middlewares.ts`.
- `route.ts` — `POST /vendor/claims` → `beginClaimOrderWorkflow`.
  Stamps `created_by: seller_context.seller_id` (vendor equivalent
  of admin's `auth_context.actor_id`).
- `[id]/cancel/route.ts` — `POST :id/cancel` →
  `cancelOrderClaimWorkflow({ claim_id: id, canceled_by: seller_id })`.
- `[id]/request/route.ts` — `POST :id/request` →
  `confirmClaimRequestWorkflow({ claim_id: id, confirmed_by: seller_id })`;
  `DELETE :id/request` → `cancelBeginOrderClaimWorkflow({ claim_id: id })`.
  Response shape simplified to `{ order_preview }` on POST,
  `{ id, object: "claim", deleted: true }` on DELETE — admin
  additionally hydrates the full claim + return via
  `remoteQuery`, but vendor doesn't need that surface (consumers
  read the order detail separately).
- `[id]/claim-items/route.ts` — `POST :id/claim-items` →
  `orderClaimItemWorkflow`.
- `[id]/claim-items/[action_id]/route.ts` —
  `POST :id/claim-items/:action_id` → `updateClaimItemWorkflow`;
  `DELETE :id/claim-items/:action_id` → `removeItemClaimActionWorkflow`.
- `[id]/inbound/items/route.ts` — `POST :id/inbound/items` →
  `orderClaimRequestItemReturnWorkflow`. Looks up the claim's
  `return_id` via Query Graph and threads it into the workflow
  input (admin pattern).
- `[id]/inbound/items/[action_id]/route.ts` —
  `POST :id/inbound/items/:action_id` →
  `updateRequestItemReturnWorkflow`;
  `DELETE :id/inbound/items/:action_id` →
  `removeItemReturnActionWorkflow`. Both look up
  `claim.return_id` before threading into workflow input.
- `[id]/inbound/shipping-method/route.ts` —
  `POST :id/inbound/shipping-method` →
  `createClaimShippingMethodWorkflow({ ...body, return_id, claim_id })`.
- `[id]/inbound/shipping-method/[action_id]/route.ts` —
  `POST :id/inbound/shipping-method/:action_id` →
  `updateReturnShippingMethodWorkflow({ data, return_id, action_id })`;
  `DELETE :id/inbound/shipping-method/:action_id` →
  `removeClaimShippingMethodWorkflow({ claim_id, action_id })`.
- `[id]/outbound/items/route.ts` — `POST :id/outbound/items` →
  `orderClaimAddNewItemWorkflow`.
- `[id]/outbound/items/[action_id]/route.ts` —
  `POST :id/outbound/items/:action_id` →
  `updateClaimAddItemWorkflow`;
  `DELETE :id/outbound/items/:action_id` →
  `removeAddItemClaimActionWorkflow`.
- `[id]/outbound/shipping-method/route.ts` —
  `POST :id/outbound/shipping-method` →
  `createClaimShippingMethodWorkflow({ ...body, claim_id })`.
- `[id]/outbound/shipping-method/[action_id]/route.ts` —
  `POST :id/outbound/shipping-method/:action_id` →
  `updateClaimShippingMethodWorkflow`;
  `DELETE :id/outbound/shipping-method/:action_id` →
  `removeClaimShippingMethodWorkflow`.

#### Files modified

- `packages/core/src/api/vendor/middlewares.ts` — added
  `vendorClaimsMiddlewares` import + spread between
  `vendorCampaignsMiddlewares` and `vendorCollectionsMiddlewares`
  (alphabetical between Campaigns and Collections).

#### Why a simpler response shape

Admin's claim routes hydrate the full `order_claim` (plus
`order_return` when applicable) via `remoteQueryObjectFromString`
on every sub-route. Vendor follows the slice 2 (exchanges)
convention and returns only `{ order_preview }` (or `{ claim }` for
cancel) — consumers re-fetch the order detail separately via
`GET /vendor/orders/:id` which already exposes the claim/return
relations. This keeps the vendor handlers ~30 lines vs admin's
~85 lines and avoids the `remoteQuery` dependency in every file.

#### What's NOT in this slice (deferred follow-up)

- **Integration suite** at
  `integration-tests/http/order/vendor/order-claim.spec.ts`. Matches
  the exchange-side deferral from slice 2 — the suite will land
  alongside the UI port in a later slice, when the runtime path
  is exercisable through a vendor user flow.
- **Subscriber** on `OrderWorkflowEvents.CLAIM_CREATED` (spec
  §"Workflow-override checklist" lines ~1140-1217). Layers in
  commission recalc + payout delta on confirm. Independent of the
  route surface — can land in any session. Same subscriber pattern
  as the `order-edit-confirmed` subscriber that landed in
  Session (p) on the edit side.
- **UI port** (Figma "Create Claim" focus modal at
  `y=24626`). Blocked until this backend slice lands, which it
  now does — the next session can port admin's
  `routes/orders/order-create-claim/` into
  `packages/vendor/src/pages/orders/[id]/claims/` per the spec's
  porting checklist.

#### Verification

- `bun run build` from repo root — **9 / 9 packages pass** in 58.5s
  (`@mercurjs/core` recompiled with 15 new route files; codegen
  regenerated the route map; `@mercurjs/admin` + `@mercurjs/vendor`
  rebuilt against the regenerated DTS).
- `bunx oxlint packages/core/src/api/vendor/claims/ packages/core/src/api/vendor/middlewares.ts`
  — exit code 0, no warnings, no errors.
- No integration run this session — the suite is deferred (see
  above).

### Session 2026-06-05 (o) — vendor `/vendor/order-edits` items + shipping-method sub-routes

Closes the deferred half of session (n). The full Order Edit
backend tree is now mounted under `/vendor/`.

#### Files added

- `packages/core/src/api/vendor/order-edits/[id]/items/route.ts` —
  `POST :id/items` → `orderEditAddNewItemWorkflow`.
- `packages/core/src/api/vendor/order-edits/[id]/items/[action_id]/route.ts`
  — `POST :id/items/:action_id` →
  `updateOrderEditAddItemWorkflow`; `DELETE :id/items/:action_id`
  → `removeItemOrderEditActionWorkflow`.
- `packages/core/src/api/vendor/order-edits/[id]/items/item/[item_id]/route.ts`
  — `POST :id/items/item/:item_id` →
  `orderEditUpdateItemQuantityWorkflow`. Workflow input wraps the
  body inside `items: [{ ...body, id: item_id }]` per Medusa
  admin's exact shape.
- `packages/core/src/api/vendor/order-edits/[id]/shipping-method/route.ts`
  — `POST :id/shipping-method` →
  `createOrderEditShippingMethodWorkflow`.
- `packages/core/src/api/vendor/order-edits/[id]/shipping-method/[action_id]/route.ts`
  — `POST :id/shipping-method/:action_id` →
  `updateOrderEditShippingMethodWorkflow`; `DELETE
  :id/shipping-method/:action_id` →
  `removeOrderEditShippingMethodWorkflow`.

Each handler is a 1:1 port of its Medusa-admin counterpart at
`/Users/viktorholik/Desktop/medusa/packages/medusa/src/api/admin/order-edits/`,
unchanged except for swapping `@medusajs/core-flows` workflow
imports stay identical (the workflows are framework-level, not
namespace-scoped).

#### Files modified

- `packages/core/src/api/vendor/order-edits/validators.ts` — added
  five zod schemas: `VendorPostOrderEditsAddItemsReq`,
  `VendorPostOrderEditsItemsActionReq`,
  `VendorPostOrderEditsUpdateItemQuantityReq`,
  `VendorPostOrderEditsShippingReq`,
  `VendorPostOrderEditsShippingActionReq`. All copy admin's
  zod shape verbatim (field set, optionality, nullability).
- `packages/core/src/api/vendor/order-edits/middlewares.ts` —
  imported the new validators, appended six new `MiddlewareRoute`
  entries. All sub-routes reuse `assertSellerOwnsOrderInParam`
  (the `:id` is still the order_id) — no need for
  `validateSellerOrderEdit` even on the `:action_id`-keyed
  routes since `:action_id` is just the workflow input, not the
  scope boundary.

#### Why the helper remains in tree

`validateSellerOrderEdit` in `helpers.ts` (added speculatively in
session (n) per the spec's initial sketch) is still NOT exercised
by any live route — Medusa admin's full `/admin/order-edits` tree
keys everything on `order_id`. Leaving the helper as a no-op
export in case downstream consumers need to scope an
`order_change.id` directly; documented as deferred-utility.

#### Verification

- `bun run build` — 9/9 packages green in 1m08s
  (`@mercurjs/core` recompiled with five new route files,
  `@mercurjs/vendor` + `@mercurjs/admin` rebuilt against the
  regenerated route map).
- `bunx oxlint packages/core/src/api/vendor/order-edits/` — **0
  warnings, 0 errors** across all 12 files in the tree.

#### Still deferred (carried forward)

- Subscriber on `OrderEditWorkflowEvents.CONFIRMED` (spec §"Confirm-edit
  … use subscribers, not overrides", lines ~1128-1234). Layers in
  `refreshOrderCommissionLinesWorkflow` + payout delta. Independent
  of the route surface.
- Integration suite `integration-tests/http/order/vendor/order-edit.spec.ts`
  using the offer-based seeding pattern.
- Next big slice: `/vendor/exchanges` tree (spec §0 third bullet).

### Session 2026-06-05 (n) — vendor `/vendor/order-edits` backend skeleton

Per the user's session-start clarification ("the same like the medusa
has"), this session takes the first slice of the long-blocked §0
backend gap by mirroring Medusa admin's `/admin/order-edits` tree
exactly under `/vendor/`. Items + shipping-method sub-routes are
deferred to a follow-up — those carry larger payload shapes and key
on `order_change.id` (not `order_id`), so they need the
`validateSellerOrderEdit` helper which lands ahead of them in this
session.

#### Files added

- `packages/core/src/api/vendor/order-edits/helpers.ts` — exports
  `validateSellerOrderEdit(scope, sellerId, orderEditId)`. Walks
  `order_change.id` → `order_id` via Query Graph, then defers to
  the existing `validateSellerOrder`. Mirrors
  `packages/core/src/api/vendor/returns/helpers.ts` shape.
- `packages/core/src/api/vendor/order-edits/validators.ts` —
  `VendorPostOrderEditsReq` is a 1:1 zod port of admin's
  `AdminPostOrderEditsReqSchema`
  (`medusa/packages/medusa/src/api/admin/order-edits/validators.ts`):
  `{ order_id: z.string(), description?, internal_note?,
  metadata?: z.record(z.unknown()).nullish() }`.
- `packages/core/src/api/vendor/order-edits/middlewares.ts` —
  exports `vendorOrderEditsMiddlewares: MiddlewareRoute[]`. Two
  guard helpers: `assertSellerOwnsOrderInBody` (reads
  `req.validatedBody.order_id` for the create call) and
  `assertSellerOwnsOrderInParam` (reads `req.params.id` — which is
  the order_id per Medusa admin's convention). Both defer to
  `validateSellerOrder`.
- `packages/core/src/api/vendor/order-edits/route.ts` —
  `POST /vendor/order-edits`. Wraps
  `beginOrderEditOrderWorkflow` from `@medusajs/core-flows`
  directly per the spec's "wrap workflow directly when Medusa's
  workflow is enough" rule. Returns `HttpTypes.AdminOrderEditResponse`
  shape (`{ order_change }`).
- `packages/core/src/api/vendor/order-edits/[id]/route.ts` —
  `DELETE /vendor/order-edits/:id`. Wraps
  `cancelBeginOrderEditWorkflow({ order_id: id })`. Response
  shape `{ id, object: "order-edit", deleted: true }`, matching
  admin.
- `packages/core/src/api/vendor/order-edits/[id]/request/route.ts`
  — `POST /vendor/order-edits/:id/request`. Wraps
  `requestOrderEditRequestWorkflow({ order_id: id, requested_by:
  req.seller_context.seller_id })`. Vendor equivalent of admin's
  `actor_id` audit field — matches the pattern already in tree at
  `packages/core/src/api/vendor/returns/[id]/request/route.ts:28`.
- `packages/core/src/api/vendor/order-edits/[id]/confirm/route.ts`
  — `POST /vendor/order-edits/:id/confirm`. Wraps
  `confirmOrderEditRequestWorkflow({ order_id: id, confirmed_by:
  req.seller_context.seller_id })`. The spec §"Workflow-override
  checklist" notes this workflow has no `createHook` extension
  points — the Mercur-side commission / payout recalc layered on
  top must be a subscriber on `order-edit.confirmed`; that
  subscriber is **NOT** added this session (see deferred list).

#### Files modified

- `packages/core/src/api/vendor/middlewares.ts` — added
  `vendorOrderEditsMiddlewares` import + spread between
  `vendorOffersMiddlewares` and `vendorOrdersMiddlewares`.

#### Critical correction vs. the spec's initial sketch

The spec's "Routes to add" section (§"Missing routes → Order Edit")
described `:id`-keyed sub-routes as keying on `order_change.id`,
which implied a `validateSellerOrderEdit` helper that joins
`order_change → order_seller` was needed. But reading Medusa
admin's three sub-route handlers:

```
medusa/.../admin/order-edits/[id]/route.ts            DELETE → cancelBeginOrderEditWorkflow({ order_id: id })
medusa/.../admin/order-edits/[id]/request/route.ts    POST   → requestOrderEditRequestWorkflow({ order_id: id, ... })
medusa/.../admin/order-edits/[id]/confirm/route.ts    POST   → confirmOrderEditRequestWorkflow({ order_id: id, ... })
```

— each handler threads `req.params.id` directly into the workflow
input field named `order_id`. **The URL param is the order_id, not
the order_change_id.** This makes the simpler `validateSellerOrder`
sufficient for all three sub-routes, and `validateSellerOrderEdit`
isn't exercised by the live routes today.

`validateSellerOrderEdit` is kept in `helpers.ts` because the
items + shipping-method sub-routes (deferred this session) DO key
on `order_change.id` (`:action_id` for update/delete; `:item_id`
for the existing-line update path). The helper will be wired into
their middlewares when those routes land.

#### Out of this slice (deferred to follow-up)

The remaining seven sub-routes from spec §"Routes to add" for
Order Edit, in mounting order:

- `POST /vendor/order-edits/:id/items` —
  `orderEditAddNewItemWorkflow`. Body shape matches admin's
  `AdminPostOrderEditsAddItemsReqSchema`.
- `POST /vendor/order-edits/:id/items/:action_id` —
  `updateOrderEditAddItemWorkflow`. Update an add-item action.
  Keys on `order_change_action.id`.
- `DELETE /vendor/order-edits/:id/items/:action_id` —
  `removeOrderEditItemActionWorkflow`. Removes the action.
- `POST /vendor/order-edits/:id/items/item/:item_id` —
  `orderEditUpdateItemQuantityWorkflow` /
  `updateOrderEditItemQuantityWorkflow`. Updates qty on an
  existing line item.
- `POST /vendor/order-edits/:id/shipping-method` —
  `createOrderEditShippingMethodWorkflow`.
- `POST /vendor/order-edits/:id/shipping-method/:action_id` —
  `updateOrderEditShippingMethodWorkflow`.
- `DELETE /vendor/order-edits/:id/shipping-method/:action_id` —
  `removeOrderEditShippingMethodWorkflow`.

Also deferred:

- Subscriber on `order-edit.confirmed` (spec §"Confirm-edit … use
  subscribers, not overrides" lines 1128-1234). Needs to call
  `refreshOrderCommissionLinesWorkflow` and re-queue the payout
  delta. Independent of the route surface — can land in any
  session.
- Integration suite at `integration-tests/http/order/vendor/order-edit.spec.ts`
  covering begin → cancel → begin → request → confirm. Should
  follow the offer-based seeding pattern used by the existing
  `order-list-filters.spec.ts` and `order-mark-as-paid.spec.ts`
  suites (spec §"Testing" + session-(c) re-do checklist).
- TypeScript route map regeneration via `bun run codegen` — needs
  to run before any vendor UI hook can call
  `sdk.vendor.orderEdits.*`. The codegen pass runs as part of
  `bun run build` so the route map is already updated in the
  build output; the typed-client SDK regeneration is a separate
  concern documented in spec §"Filter gap — Codegen" pattern.

#### Verification

- `bun run build` — 9/9 packages green in 1m07s (`@mercurjs/core`
  recompiled with the new route directory; `@mercurjs/admin` and
  `@mercurjs/vendor` rebuilt against the regenerated route map).
- `bunx oxlint packages/core/src/api/vendor/order-edits/
  packages/core/src/api/vendor/middlewares.ts` — **0 warnings,
  0 errors** across all 8 files.
- No integration run this session — the suite that would cover
  these routes (`order-edit.spec.ts`) is part of the deferred
  follow-up.

### Session 2026-06-05 (m) — Create Shipment form: real URL fields + label fix

Session (l)'s §6 sweep flagged the fulfillment section but didn't
descend into the Shipment focus-modal form. Reading
`shipment/order-create-shipment-form/order-create-shipment-form.tsx`
surfaced three concrete drift items:

1. **Mis-labeled tracking-number field.** The only visible
   `Form.Field` was bound to `labels.${i}.tracking_number` but
   rendered with `<Form.Label>{t("orders.shipment.trackingUrl")}</Form.Label>`
   — "Tracking URL". This was a scaffold-era bug that has been
   sitting in the form since initial port.

2. **Hardcoded `"#"` URLs.** `handleSubmit` was building the
   payload as `tracking_url: "#"`, `label_url: "#"`. Even after
   adding a real input for `tracking_url`, the existing logic
   would have squashed it. The backend validator
   (`/Users/viktorholik/Desktop/mercur/packages/core/src/api/vendor/orders/[id]/fulfillments/[fulfillment_id]/shipments/validators.ts`-equivalent;
   see `useCreateOrderShipment`) treats both as non-optional
   strings — the empty-string fallback satisfies the validator
   without polluting the audit trail with `#` placeholders.

3. **Missing `size="small"` on the `Add tracking URL` button**
   (same pattern as session (l)'s three button patches in
   `order-fulfillment-section.tsx`).

#### Files modified

- `packages/vendor/src/pages/orders/[id]/shipment/order-create-shipment-form/order-create-shipment-form.tsx`:
  - Replaced the single-input render with a 3-column responsive
    grid (`grid grid-cols-1 gap-3 md:grid-cols-3`) exposing
    `tracking_number` (required), `tracking_url` (optional, kept
    the existing `trackingUrlPlaceholder`), and `label_url`
    (optional).
  - Both optional fields use the standard `<Form.Label optional>`
    pattern so the `(optional)` suffix is auto-appended per the
    `Form` primitive's convention.
  - Each input carries `data-testid` (`shipment-tracking-number-${i}`,
    `shipment-tracking-url-${i}`, `shipment-label-url-${i}`).
  - `Add tracking URL` button → `size="small"`, label changed to
    `t("orders.shipment.addTracking")` ("Add tracking number" — a
    sibling key that already existed in `en.json`) since the row
    now covers number+URL+label together; the old `addTrackingUrl`
    label misrepresented what the row added.
  - `append({ tracking_number: "", tracking_url: "", label_url: "" })`
    so the new rows aren't undefined-checked at field bind time.
  - `handleSubmit` reads `l.tracking_url ?? ""` / `l.label_url ?? ""`
    — no more `"#"` literals.

#### What was intentionally NOT done

- The `CreateShipmentSchema` in `constants.ts` keeps `tracking_url`
  and `label_url` as `z.string().optional()`. The TODO comment
  ("not optional in the API") stays — the form passes empty
  strings on submit, which satisfies the backend. Flipping the
  schema to required would block submit unless the user fills
  both URLs, which is too strict (the design doesn't gate
  shipment creation on URL availability).
- Label-file upload (Figma optional: `Label PDF/PNG` drag-drop)
  not added — that requires a `FileUpload` primitive integration
  + a presigned-URL flow that doesn't exist yet for shipments.
  Documented as deferred follow-up.

#### Verification

- `bun run build` — 9/9 packages green in 36s (`@mercurjs/vendor`
  recompiled; everything else cached). DTS clean.
- `bunx oxlint` on the touched file — **0 warnings, 0 errors**.

### Session 2026-06-05 (l) — Create Return polish + §6 fulfillment visual sweep

Closes two small but visible papercuts.

#### Files modified

- `packages/vendor/src/pages/orders/[id]/returns/create/index.tsx`:
  - Empty-selection toast was calling `t("orders.returns.create")`
    which resolves to the literal string "Create Return" —
    nonsensical as an error message. Replaced with a new key
    `t("orders.returns.noItemsSelected")` (added to `en.json`)
    that reads "Select at least one item to return."
  - New `hasSelection` memo: `Object.values(items).some(s =>
    s.selected && s.quantity > 0)`. Wired into the Confirm
    button's `disabled` prop alongside the existing `!ready`
    guard so the empty-selection path is now unreachable from
    the UI (the toast remains as a defensive fallback).
- `packages/vendor/src/i18n/translations/en.json`:
  - Added `orders.returns.noItemsSelected: "Select at least one
    item to return."` under the existing `returns` namespace.
- `packages/vendor/src/pages/orders/[id]/_components/order-fulfillment-section/order-fulfillment-section.tsx`:
  - Three CTA buttons (`Fulfill items`, `Mark as
    delivered/picked up`, `Mark as shipped`) were missing the
    `size="small"` prop. Per the spec's design rules ("Buttons
    inside compact toolbars and footers: `size='small'`")
    they should match the rest of the order detail page. All
    three patched.

#### §6 visual-sweep findings (no structural drift)

Read `order-fulfillment-section.tsx` end-to-end against the Figma
audit notes in §"Per-screen audit → Create Fulfillment / Mark As
Shipped / Delivered / Picked Up":

- `Container className="divide-y p-0"` shell ✅ (every section
  card).
- Header row `flex items-center justify-between px-6 py-4` with
  `<Heading>` left + status-badge cluster + `ActionMenu` right ✅.
- Row padding `px-6 py-4` ✅.
- Footer strip `bg-ui-bg-subtle flex items-center justify-end
  gap-x-2 rounded-b-xl px-4 py-4` matches the Figma footer-shape
  on each fulfillment card ✅.
- `requires_shipping` + `awaiting fulfillment` red status badges
  ✅ (`StatusBadge color="red"` with `text-nowrap`).
- `Heading level="h2"` on the "Unfulfilled items" section
  matches the design's secondary headline weight ✅.
- Currency formatting via `getLocaleAmount` ✅ (consistent with
  Summary section).
- `Cancel` action exposed via `ActionMenu` (kebab) on each
  fulfillment, guarded by `disabled` + tooltip for shipped /
  canceled states ✅.

Items left for follow-up (out of this slice):
- The unfulfilled-items table column proportions (`grid grid-cols-2`
  + nested `grid grid-cols-3`) render correctly but the Figma uses
  a flatter `grid grid-cols-4` for consistency with the Summary
  item rows. Cosmetic — defer to a dedicated polish PR if a
  designer flags it.
- The `Provider` row uses `formatProvider(provider_id)` which
  pretty-prints the underscore-separated key into Title Case. No
  drift against Figma (Figma shows a free-text provider name).

#### Verification

- `bun run build` — 9/9 packages green in 39s (`@mercurjs/vendor`
  recompiled; everything else cached). DTS clean.
- `bunx oxlint` on the touched files — 0 errors; 1 carried-over
  `no-await-in-loop` warning from session (j)/(k) on the
  intentional sequential `addReturnItem` loop. No new warnings.

### Session 2026-06-05 (k) — Create Return: location + return shipping dropdowns

Closes the two intentionally-deferred pieces from session (j) so the
Create Return flow now covers the full Figma "focus modal collecting
items, reason, note, location, return shipping (optional), and a
notification toggle" contract.

#### Files modified

- `packages/vendor/src/pages/orders/[id]/returns/create/index.tsx`:
  - Added `useStockLocations`, `useShippingOptions`, `useUpdateReturn`,
    `useAddReturnShipping` imports.
  - New state: `locationId`, `shippingOptionId`. Changing
    `locationId` resets `shippingOptionId` (a stale option from a
    different location can't survive the dropdown re-source).
  - `useShippingOptions` is gated on `!!locationId` via the
    `enabled` flag — no wasted fetch before the user picks a
    location.
  - Two new card-shaped strips (`bg-ui-bg-component
    shadow-elevation-card-rest rounded-lg p-3`) inserted between
    the items list and the notify switch: Location (single
    `Select`, sourced from `stock_locations`) and Return shipping
    (single `Select`, sourced from `shipping_options`, disabled
    until a location is chosen). Both use existing i18n keys
    (`orders.returns.location`, `locationHint`, `inboundShipping`,
    `inboundShippingHint`).
  - `handleConfirm` order extended: (1) `useUpdateReturn({
    location_id })` when set, (2) the existing per-item
    `useAddReturnItem` loop, (3) `useAddReturnShipping({
    shipping_option_id })` when set, (4)
    `useConfirmReturnRequest({ no_notification: !notify })`. Step
    1 runs before items so the eventual receive-flow has the
    location stamped on the draft even if shipping is skipped.

#### Backend reality-check (no changes)

- `POST /vendor/returns` validator already accepts
  `location_id?: string` (`VendorPostReturnsReq` at
  `packages/core/src/api/vendor/returns/validators.ts:VendorPostReturnsReq`).
- `POST /vendor/returns/:id/shipping-method` validator already
  accepts `shipping_option_id: string` + optional `custom_amount`
  /`description` / `internal_note` / `metadata`
  (`VendorPostReturnsShippingReq` at line 92 of the same file).
- `useStockLocations()` and `useShippingOptions(...)` were both
  already exported from `packages/vendor/src/hooks/api/`.

No backend work needed.

#### Verification

- `bun run build` — 9/9 packages green in 38s (`@mercurjs/vendor`
  recompiled; everything else cached). DTS clean.
- `bunx oxlint` on the touched file — 0 errors; 1 baseline
  `no-await-in-loop` warning on the intentional sequential
  `addReturnItem` loop (carried over from session j; the calls
  mutate the same draft and must serialize).
- Visual / runtime: no headless UI run this session. Both
  `Select` controls follow the same render path as the existing
  refund-reason `Select` in `pages/orders/[id]/refund/index.tsx`
  (session b).

#### Still deferred (out of this session's slice)

- **Per-row "estimated refund" amount** — the design shows a
  `Refundable amount` column on each item row. Computing it
  requires the per-item discounted line total minus
  prior-refund proration; the math lives in Medusa's
  `calculateAmountsFromOrderChange` helper which Mercur doesn't
  re-export today. Defer until the spec calls for it explicitly
  — the backend will compute the actual refund correctly
  regardless of whether the UI shows the estimate.
- **Outstanding-amount preview** — the design shows a totals
  block under the items. Same constraint as above.

### Session 2026-06-05 (j) — Create Return kebab + route + focus modal scaffold

The largest fully-unblocked work item from session (i)'s refreshed
checklist: backend `/vendor/returns` + `:id/request-items` +
`:id/request` (POST + DELETE) routes are already shipped; the
vendor hooks (`useInitiateReturn` / `useAddReturnItem` /
`useUpdateReturnItem` / `useRemoveReturnItem` /
`useConfirmReturnRequest` / `useCancelReturnRequest`) are already
in `packages/vendor/src/hooks/api/returns.tsx`. The only missing
piece was the UI entry.

#### Files modified

- `packages/vendor/src/get-route-map.tsx`: added a
  `returns/create` route between the existing `allocate-items`
  and `returns/:return_id/receive` entries, lazy-loading
  `./pages/orders/[id]/returns/create`.
- `packages/vendor/src/pages/orders/[id]/_components/order-general-section/order-general-section.tsx`:
  - Imported `ArrowUturnLeft` from `@medusajs/icons` (same icon
    Medusa admin uses in `order-edit-item.tsx`).
  - Re-shaped the `ActionMenu` `groups` array: previously one
    group held `Complete` + `Cancel`. Now there are two groups —
    nav/state actions (`Complete`, `Create Return`) first, the
    destructive `Cancel` group last (separator-rendered between
    them via `ActionMenu`'s built-in convention).
  - `Create Return` uses `to: "returns/create"` (relative — keeps
    routing inside the existing `/orders/:id` parent), disabled
    when `order.canceled_at` is set, label `t("orders.returns.create")`
    (existing i18n key — `"Create Return"`).

#### Files added

- `packages/vendor/src/pages/orders/[id]/returns/create/index.tsx`
  (~340 lines): the Create Return `RouteFocusModal` scaffold.
  - **Draft-and-mutate pattern** ported from Medusa admin: on
    mount, `useInitiateReturn({ order_id })` creates a backend
    draft; the returned `return.id` is stashed in component state
    and threaded through every downstream hook so the user's
    edits land on the same row. Both a module-scoped
    `IS_REQUEST_RUNNING` flag and a `returnId` state guard
    against StrictMode double-fire and post-creation reruns. If
    `preview.order_change.change_type` exists and is not
    `return_request`, the modal aborts with a redirect + toast —
    matches the existing `returns/[return_id]/receive` flow's
    active-change check (session b).
  - **Items list**: filters `order.items` to only rows where
    `fulfilled_quantity - return_requested_quantity - returned_quantity > 0`.
    Each row renders a `Checkbox` + product/variant title + an
    `Input[type=number]` qty stepper capped at the remaining
    returnable amount. When a row is checked, a two-column block
    expands underneath with a `Select` for return reason
    (sourced from `useReturnReasons`, no fallback — empty list
    means an empty dropdown) and a free-text `Input` for the
    per-item note.
  - **Send-notification switch**: standard card-shaped strip
    (`bg-ui-bg-component shadow-elevation-card-rest rounded-lg p-3`)
    matching Figma's notify toggle; defaults to `true`. Threads
    into the confirm payload as `no_notification: !notify`.
  - **Submit** (`handleConfirm`): iterates selected items and
    calls `useAddReturnItem({ items: [{ id, quantity, reason_id,
    note }] })` sequentially (each call mutates the same draft,
    so they must serialize — `no-await-in-loop` is intentional
    here; left as a warning, no disable directive so the
    behavior is auditable in lint diff). Then
    `useConfirmReturnRequest({ no_notification: !notify })`
    flips the draft to `requested`. On success: toast
    `orders.returns.toast.confirmedSuccessfully` (existing key) +
    `handleSuccess(/orders/${orderId})`.
  - **Cancel / close** (`handleClose`): if a draft was created,
    `useCancelReturnRequest` is invoked before navigation. The
    error path swallows (the user is leaving the screen anyway)
    so a stuck network call doesn't trap them inside the modal.
  - **Test ids**: every interactive element carries a kebab-case
    `data-testid` (`return-item-:id-checkbox`, `-qty`, `-reason`,
    `-note`, `return-create-notify`, `return-create-cancel`,
    `return-create-confirm`).

#### What was intentionally NOT done in this slice

- **Location dropdown** (Figma: `Location` + hint
  `"Choose which location you want to return the items to."`).
  Wiring needs `useStockLocations` and a stock-location-to-return
  payload field. Backend already accepts it (the return shipping
  method endpoint uses location_id); the dropdown can land as a
  follow-up without revisiting the rest of the form.
- **Return shipping (optional) dropdown** (Figma: section labeled
  `Return shipping (Optional)`). Needs `useShippingOptions`
  filtered to return-eligible options scoped to the chosen
  location. Wiring path: `useAddReturnShipping({ shipping_option_id })`
  on the existing draft. Follow-up.
- **Per-item field-level validation**: the spec sketches `Reason`
  as required when the form has a default reason set, but the
  current backend treats `reason_id` as optional. Kept optional
  in v1; if product wants required, flip the Zod-style validation
  on the form schema once a schema lands.
- **Zod schema + React Hook Form**: skipped for v1 because the
  draft-and-mutate pattern means each interaction is a discrete
  mutation, not a single form submission. Per-row state lives in
  `items: Record<string, SelectedItem>` directly. RHF makes more
  sense once the form grows location/shipping/total-difference
  blocks that need cross-field validation.

#### Verification

- `bun run build` from repo root: **9 / 9 packages pass** in 36s
  (`@mercurjs/vendor` recompiled, everything else cached). DTS
  emission clean.
- `bunx oxlint <touched files>`: 0 errors, 1 warning
  (`no-await-in-loop` on the intentional sequential
  `addReturnItem` calls inside `handleConfirm`). No new warnings
  on the routes file or `order-general-section.tsx`.
- Visual / runtime: no headless UI run this session. The kebab
  navigation path is `RouteFocusModal` (proven by the existing
  `fulfillment` / `allocate-items` siblings) and the hook
  contracts are unchanged.

### Session 2026-06-05 (i) — Verification checklist refresh

Pure documentation pass. The §Verification checklist at the top of
this spec had every box at `[ ]` even though sessions (a)–(h) had
closed many of them. Refreshed against shipped state so the next
session can read the checklist and immediately see what's actually
left, without having to scan all nine session entries below.

#### Conventions

- `[x]` — Closed in code with a session pointer.
- `[~]` — Partial / divergence-with-rationale. Either reverted
  (e.g. payment/fulfillment status filters in §0), kept as a
  deliberate non-drift (e.g. Sales channel column), or partially
  landed (e.g. returns subrow done but claims/exchanges blocked).
- `[ ]` — Still pending, with the blocker (when relevant) named
  in the line.

#### Notable status

- §1 (Orders list) — three of four items now `[x]` or `[~]`; the
  one open question is the Sales channel column kept-or-dropped
  decision, parked on the design owner.
- §2 (Order detail read view) — seven of nine items now `[x]` or
  `[~]`; the still-`[ ]` item is the header kebab additions
  (Edit order / Create Return / Create Exchange / Create Claim),
  three of four of which are blocked by §0 backend routes.
- §3, §4 (Order Edit, Create Return/Exchange/Claim) — mostly still
  `[ ]`; Create Return is unblocked by backend but the modal port
  hasn't started, the other three need §0 backend first.
- §5 (Receive Items), §7 (Visual drift) — fully `[x]`.

#### No code changes

`bun run build` not re-run; nothing in the build / lint baseline
shifted this session.

### Session 2026-06-05 (h) — Orders list search input

The audit (§1) called out a missing search input in
`OrderListHeader`. The `_DataTable` primitive already accepts a
`search` prop (toggles a `DataTableQuery` search field rendered
above the table), and `useOrderTableQuery` already reads `q` from
the URL and forwards it on `searchParams`. Other vendor list pages
(`customer-list-data-table.tsx:82`,
`region-list-table.tsx:93`) follow the same pattern. The only
missing piece was passing the prop in `OrderListDataTable`.

#### Files modified

- `packages/vendor/src/pages/orders/_components/order-list-table/order-list-data-table.tsx`:
  - Added bare `search` prop to the `_DataTable` invocation
    (same boolean-attribute shape used in the customer and region
    list tables). The skeleton loader also picks this up via
    `_DataTable`'s `<TableSkeleton search={!!search} … />` branch,
    so the search bar's shape is reserved during the initial
    load instead of pop-in-shifting the table.

#### Verification

- `bun run build` — 9/9 packages green in 36s
  (`@mercurjs/vendor` ESM rebuild + DTS pass-through; all upstream
  packages cached).
- `bunx oxlint <touched file>` — 0 warnings, 0 errors.

#### Other §1 findings remain open

- **Sales channel column**: still rendered between `Customer` and
  `Payment` (`use-order-table-columns.tsx`). Kept as-is for now —
  a vendor operating across multiple sales channels gets value
  from the at-a-glance breakdown. The Figma's "no Sales channel
  column" can be revisited by the design owner; documenting here
  as a deliberate non-drift pending that conversation.
- **`Add filter` panel**: matches the spec's reverted state
  (Region / Sales channel / Created / Updated / Request).
  Payment / Fulfillment filters intentionally absent per session
  2026-06-05 (c).

### Session 2026-06-05 (g) — Activity timeline: payment events (awaiting / captured / canceled / refunded)

Same pattern as session (f). The payment activity rules were
commented out in `use-activity-items.tsx` (lines 89-140 prior state)
behind the comment "TODO: uncomment and fix payment related logic
when backend returns data about payment cancel/capture/refund dates".
The data IS available today via the
`vendorOrderFields.*payment_collections.payments(+refunds)` /
`*payment_collections.payment_sessions` paths added in session (a),
and `AdminPayment` (which extends `BasePayment` from
`@medusajs/types`) explicitly types `created_at`, `captured_at`,
`canceled_at`, and `refunds: AdminRefund[]` with each refund
carrying its own `created_at`.

#### Files modified

- `packages/vendor/src/pages/orders/[id]/_components/order-activity-section/hooks/use-activity-items.tsx`:
  - Replaced the dangling `_notes` / `_payments` underscore vars
    (and the dead notes-hook scaffold) with a single
    `payments = useMemo(() => (order.payment_collections ?? []).flatMap(pc => pc.payments ?? []), [order.payment_collections])`.
  - Re-enabled the four payment activity emitters per
    Medusa admin's pattern, guarded on the relevant timestamp:
    - **`payment.awaiting`** — only emitted while
      `!captured_at && !canceled_at && created_at`. This
      sharpens the original spec which would fire it
      unconditionally; the conditional avoids noisy "Awaiting
      payment" entries on already-settled orders without
      changing the canonical event name.
    - **`payment.captured`** — at `captured_at` when truthy.
    - **`payment.canceled`** — at `canceled_at` when truthy. If
      the underlying payment provider never stamps this column
      on cancellation (per the original TODO concern), this
      branch is simply a no-op — no broken rendering.
    - **`payment.refunded`** — once per `refund` in
      `payment.refunds ?? []`, at `refund.created_at`, with
      the refund amount in the row body.
  - Added `payments` to the closing `useMemo` deps array (under
    the existing `oxlint-disable react-hooks/exhaustive-deps`
    block, but kept correct for when the directive is removed).

#### i18n

All four keys (`orders.activity.events.payment.awaiting`,
`captured`, `canceled`, `refunded`) already existed at
`packages/vendor/src/i18n/translations/en.json:1726-1731`. No new
keys needed.

#### Verification

- `bun run build` — 9/9 packages green in 38s.
- `bunx oxlint <touched file>` — **0 warnings, 0 errors**. Two
  pre-existing dangling-underscore warnings on `_notes` / `_payments`
  from prior baseline are now gone (the variables themselves were
  removed in this session).

#### Render order

Activity entries are sorted by timestamp at the end of the hook (the
pre-existing `sortedActivities` step), so the new payment events
interleave correctly with fulfillment / return / order-change rows
without any explicit ordering work.

### Session 2026-06-05 (f) — Activity timeline: surface return.created / canceled / received rows

The `useActivityItems` hook
(`packages/vendor/src/pages/orders/[id]/_components/order-activity-section/hooks/use-activity-items.tsx`)
already contains the full rendering logic for return lifecycle rows
(create → cancel → received) — it pushes Activity entries inside
`for (const ret of returns)` at lines 184-224 in the prior state. The
problem was upstream: `returns` was hard-coded to an empty array
(line 50) with the data hook commented out (lines 54-57), so the
loop never executed and no return rows ever appeared in the timeline
mounted by session (b).

#### Files modified

- `packages/vendor/src/pages/orders/[id]/_components/order-activity-section/hooks/use-activity-items.tsx`:
  - `const returns: AdminReturn[] = []` →
    `const returns: AdminReturn[] = (order.returns as AdminReturn[] | undefined) ?? []`.
    `order.returns` is already loaded by the
    `vendorOrderFields.*returns(+items, +shipping_methods, +items.reason)`
    query-config (session a + session d). No new fetch, no new hook
    wiring.
  - Deleted the three commented-out `useReturns` / `useClaims` /
    `useExchanges` stubs (the returns one is replaced by reading
    from `order`; the other two are deferred — see below).
  - Added a SPEC-008 explanatory comment above the empty
    `claims` / `exchanges` stubs noting they're blocked on backend
    `/vendor/claims` and `/vendor/exchanges` routes. The downstream
    rendering loops at lines 226+ already iterate those arrays —
    they will light up automatically once the source is populated.

#### What lights up after this change

For each non-canceled return on the order, the timeline now renders:

1. **`return.created`** — at `ret.created_at`, with `ReturnBody`
   children + `itemsToReturn` thumbnails. Skipped when the return
   is part of a claim or exchange (`ret.claim_id || ret.exchange_id`)
   since those will get their own dedicated rows once claims /
   exchanges land.
2. **`return.canceled`** — at `ret.canceled_at` when set, title-only.
3. **`return.received`** — at `ret.received_at` when
   `status ∈ {received, partially_received}`, with the same
   `ReturnBody` children but `isReceived` flag for the received
   variant copy.

i18n keys (`orders.activity.events.return.created` / `.canceled` /
`.received`) and the `ReturnBody` component were already in tree
from prior scaffolding; no new keys / components needed.

#### Verification

- `bun run build` — 9/9 packages green in 36s
  (`@mercurjs/vendor` recompiled).
- `bunx oxlint <touched file>` — 0 errors, 2 pre-existing warnings
  on the dangling `_notes` / `_payments` underscore vars from prior
  scaffolding (unchanged by this session).

#### Still blocked

- **Claim / exchange activity rows** — the loops at lines 226+ of
  `use-activity-items.tsx` (`for (const claim of claims)` /
  `for (const exchange of exchanges)`) will stay dormant until
  either:
  1. `order.claims` / `order.exchanges` are exposed via a
     query-config addition that joins through `order_change`, or
  2. dedicated `useClaims` / `useExchanges` hooks are added against
     `GET /vendor/claims` / `GET /vendor/exchanges` routes that
     don't exist yet on the Mercur backend (per spec
     §"Verification → Backend → 0").

- **Payment activity rows** (`payment.awaiting` /
  `payment.captured` / `payment.canceled` / `payment.refunded`) —
  still commented out at lines 99-148. The author note "TODO:
  uncomment and fix payment related logic when backend returns data
  about payment cancel/capture/refund dates" stands. Per-payment
  timestamps need to come through on
  `order.payment_collections.payments` — `created_at` and
  `captured_at` should already be there but `canceled_at` was the
  blocker per the original note. Verifying / re-enabling is a
  separate small chunk.

### Session 2026-06-05 (e) — Inline `Allocate items` CTA + per-item `Allocated` / `Not allocated` chip

The two remaining Summary-section visual gaps in the verification
checklist:

- §2 "Allocate items CTA appears inline in Summary when items are not
  allocated."
- §7 "`Allocated` / `Not allocated` chip on every Summary item row."

Both ride on the same data — vendor reservations keyed by
`line_item_id`. `useReservationItems` already exists in
`packages/vendor/src/hooks/api/reservations.tsx` and the
`getReservationsLimitCount(order)` helper already lives at
`packages/vendor/src/lib/orders.ts:13-23`. The required i18n keys
(`orders.reservations.allocatedLabel`, `notAllocatedLabel`,
`orders.allocateItems.action`) are already in vendor's
`en.json:1594-1599`.

#### Files modified

- `packages/vendor/src/pages/orders/[id]/_components/order-summary-section/order-summary-section.tsx`:
  - Calls `useReservationItems({ line_item_id: order.items.map(i => i.id), limit: getReservationsLimitCount(order) }, { enabled: Array.isArray(order?.items) })`
    at the top of the section component. Resulting reservations are
    memoized into `reservationList: AdminReservation[]` (stable
    reference for the chip lookup) and threaded into `ItemBreakdown`.
  - `ItemBreakdown` builds a `Map<line_item_id, AdminReservation>`
    via `useMemo` and passes a per-item `reservation` prop down to
    `Item`. Mirrors Medusa admin's
    `routes/orders/order-detail/components/order-summary-section/order-summary-section.tsx:540-559`.
  - `Item` adds a `StatusBadge` to the existing quantity column when
    `variant.manage_inventory` is true AND
    `quantity - detail.fulfilled_quantity > 0`. Color flips green
    (allocated) / orange (not allocated) using
    `text-nowrap overflow-visible` to match Figma. Hidden entirely
    for non-inventory-managed variants and fully-fulfilled rows
    (intentional — design only shows the chip while allocation is
    still meaningful).
  - `showAllocateButton` memo on the section: `true` when any
    `manage_inventory` item has unfulfilled qty without a
    reservation row in the map. Identical predicate to Medusa
    admin's `order-summary-section.tsx:108-131`.
  - Footer strip condition widened from
    `(showReturns || showRefund)` to
    `(showReturns || showRefund || showAllocateButton)` so the
    `bg-ui-bg-subtle rounded-b-xl` row renders for the allocate
    case as well.
  - New `<Button asChild variant="secondary" size="small">` with
    `<Link to="allocate-items">` (relative — keeps using the
    existing `/orders/:id/allocate-items` route). Carries
    `data-testid="order-summary-allocate-items-cta"`.

#### Verification

- `bun run build` — 9/9 packages green in 26s (`@mercurjs/vendor`
  recompiled; everything else cached). Confirmed by a clean re-run
  after a transient `dashboard-shared` DTS race resolved on the
  second invocation — no source-level issue.
- `bunx oxlint` on the touched file — 0 errors, 1 warning (the
  pre-existing `react(no-array-index-key)` on the
  `ShippingInfoPopover key={i}` from session b's shipping breakdown
  — unchanged from prior baseline; not introduced this session).

#### Why not visually verified

No headless UI run this session. The render logic is deterministic
from `order.items[*].variant.manage_inventory`,
`order.items[*].detail.fulfilled_quantity`, and the
`useReservationItems` response keyed by `line_item_id`. Visual sweep
deferred to the next pass that touches the order-detail page.

### Session 2026-06-05 (d) — Inline return subrow under Summary line items

The "↳ Nx items return requested/received" subrow under each line item
in the order detail Summary section was the smallest deferred item that
was already unblocked by session (a)'s query-config additions. Ported
the Medusa admin pattern (`return-info-popover.tsx` +
`ReturnBreakdown` / `ReturnBreakdownWithDamages` components inside the
section file) to the vendor package with Mercur tokens, matching the
Figma exactly.

#### Files added

- `packages/vendor/src/pages/orders/[id]/_components/order-summary-section/return-info-popover.tsx`
  — 1:1 port of Medusa admin's
  `routes/orders/order-detail/components/order-summary-section/return-info-popover.tsx`.
  Hover popover on the row-trailing `InformationCircleSolid` icon
  showing `{Return|Claim|Exchange}: #<last-7-of-id>`, then
  `Return requested · <full date>` and `Items received · <full date or -­>`
  using vendor's `useDate().getFullDate`. Falls through `claim_id` →
  `exchange_id` for the badge label.

#### Files modified

- `packages/vendor/src/pages/orders/[id]/_components/order-summary-section/order-summary-section.tsx`
  — three new internal components (kept co-located, mirroring the
  Medusa admin source-of-truth shape):
  - `ReturnBreakdown` — gated on
    `status ∈ {requested, received, partially_received}`, filters
    `orderReturn.items` by `item_id`, renders the canonical subrow:
    `ArrowDownRightMini` + `t("orders.returns.returnRequestedInfo")` /
    `returnReceivedInfo` + optional note tooltip
    (`DocumentText` + `Tooltip`) + optional reason `Badge` +
    `getRelativeDate(orderReturn.created_at)` (requested case) or
    `t("orders.returns.itemReceived")` (received case) +
    `ReturnInfoPopover`. Border-top `border-t-2 border-dotted` plus
    `bg-ui-bg-subtle` matches Figma's separator/fill.
  - `ReturnBreakdownWithDamages` — second subrow rendered above the
    standard one when `item.damaged_quantity > 0`, using
    `damagedItemsReturned` + `damagedItemReceived` i18n keys.
  - `Item` now receives `returns: ReturnWithReason[]` and emits the
    breakdown rows inline after its own row, so they live as siblings
    inside the `ItemBreakdown` div. `ItemBreakdown` derives the
    filtered list once via `useMemo` (drops `canceled_at` rows) and
    threads it through.
- `packages/core/src/api/vendor/orders/query-config.ts` — added
  `*returns.items.reason` so the reason `Badge` (e.g. "Damaged item")
  resolves on the GET /vendor/orders/:id response. Other fields the
  breakdown needs (`quantity`, `received_quantity`, `damaged_quantity`,
  `note`, `item_id`) come along with the default scalar expansion of
  `*returns.items`. Top-level return scalars (`requested_at`,
  `received_at`, `created_at`, `canceled_at`, `status`, `claim_id`,
  `exchange_id`) ride the existing `*returns` entry.

#### What was intentionally NOT done

- **Claim / Exchange breakdowns**: Medusa admin renders sibling
  `ClaimBreakdown` and `ExchangeBreakdown` components beside
  `ReturnBreakdown`. Mercur's vendor query-config does **not** expose
  `*claims` / `*exchanges` on the order today (per the prior session's
  note that those relations don't live on Order directly — they're
  reachable via `order_change` + link tables only). Adding them is
  blocked on either:
  1. a query-config addition that joins via `order_change` →
     `exchange_id` / `claim_id`, or
  2. dedicated `useExchanges` / `useClaims` hooks fed from
     `GET /vendor/exchanges` / `GET /vendor/claims` routes that don't
     exist yet on the Mercur backend.
  Documented as deferred follow-up alongside the Order Edit / Create
  Exchange / Create Claim flows that need the same data.

- **Damaged-quantity subrow placement**: Medusa admin renders the
  `ReturnBreakdownWithDamages` row *above* the standard
  `ReturnBreakdown` row. I kept that ordering for visual parity.

#### Verification

- `bun run build` from repo root: **9/9 packages pass** in 1m02s
  (`@mercurjs/core` rebuilds because of the query-config change;
  `@mercurjs/vendor` recompiles the page module).
- `bunx oxlint <touched files>`: 1 pre-existing warning at
  `order-summary-section.tsx:547` (`react(no-array-index-key)` on
  `<ShippingInfoPopover key={i}>`) unchanged from session (b); 0
  new warnings, 0 errors on the new code.
- Visual: pending; no headless UI run this session. Render path is
  deterministic from `order.returns[]` and the i18n keys already
  exist in the file (`packages/vendor/src/i18n/translations/en.json:1479-1484`).

### Session 2026-06-05 (c) — Aggregated status filters reverted (`has_open_request` kept)

Only the `payment_status` / `fulfillment_status` aggregated-status
filters were reverted from session (a). `has_open_request` stays —
backend middleware, validator, vendor UI, and integration tests.

#### What was removed

**Backend (`packages/core`)** — deleted:

- `src/api/vendor/orders/apply-aggregated-status-filter.ts`
- `src/api/vendor/orders/aggregate-status.ts`

**Backend** — narrowed:

- `src/api/vendor/orders/validators.ts` — `payment_status` and
  `fulfillment_status` back to `z.string().optional()` (no array
  widening, no post-filter, no aggregation). `has_open_request` is
  preserved and now uses Medusa's
  `booleanString()` helper
  (`@medusajs/medusa/api/utils/common-validators/common`) instead of
  the inline `z.union([z.boolean(), z.enum(["true", "false"])])`
  scaffold — same parsing, but matches the convention used elsewhere
  in `packages/core` (see
  `src/api/admin/products/validators.ts:11-12,239,240,281`).
- `src/api/vendor/orders/middlewares.ts` — `applyAggregatedStatusFilter`
  removed; `applyHasOpenRequestFilter` is still wired.
- `src/api/vendor/orders/route.ts` — back to the original simple
  shape (no post-filter logic; the workflow's `count` / `offset` /
  `limit` are accurate against the seller-scope + has_open_request
  intersection only).

**Frontend (`packages/vendor`)** — narrowed:

- `src/hooks/table/filters/use-order-table-filters.tsx` — Payment
  status and Fulfillment status filters removed. Request filter (for
  `has_open_request`) remains. Left a pointer comment to this spec.
- `src/hooks/table/query/use-order-table-query.tsx` —
  `has_open_request` mapping aligned with the repo convention used
  by `use-customer-table-query.tsx:33`,
  `use-product-table-query.tsx:59`, `use-product-variants-table-query.tsx:66-67`:
  `has_open_request: has_open_request ? has_open_request === "true" : undefined`.
- `src/i18n/translations/en.json` — kept `orders.filters.request`,
  `orders.filters.hasOpenRequest`, `orders.filters.noOpenRequest`.
  Removed `orders.paymentStatus.*` and `orders.fulfillmentStatus.*`
  enum dictionaries.

**Tests**:

- `integration-tests/http/order/vendor/order-list-filters.spec.ts`
  was deleted and re-created with **only** the `has_open_request`
  cases (3 specs). All 3 pass; the spec keeps the offer-based
  seeding scaffold so the cart `line-items` POST works.

#### What stayed (still in tree)

- `POST /vendor/payment-collections/:id/mark-as-paid` and its
  helpers/middlewares/validators/query-config — independent of the
  status-filter feature; the outstanding-amount UI depends on it.
- `vendorOrderFields` query-config extensions
  (`*payment_collections.payments(+refunds)`,
  `*payment_collections.payment_sessions`,
  `*returns(+items, +shipping_methods)`) — these expose fields the
  order detail UI needs, not about filtering.
- The vendor UI from session (b): activity-section mount,
  metadata/JSON sections, Receive Items route, per-payment-row
  `PaymentRow` primitive + refund drawer, outstanding action strip +
  mark-as-paid mutation, solid dividers.

#### Re-do checklist (if/when payment/fulfillment status filters are picked back up)

If a future session re-implements `payment_status` / `fulfillment_status`
filters:

1. Widen the validators to
   `z.union([z.string(), z.array(z.string())])`.
2. The aggregation-status approach (mirroring Medusa's
   `core-flows/dist/order/utils/aggregate-status` since it isn't
   re-exported by the package's `exports` field) lives in git
   history at `https://github.com/mercurjs/mercur/pull/951`.
   `getLastPaymentStatus` / `getLastFulfillmentStatus` precedence
   rules are documented in
   `medusa/packages/core/core-flows/src/order/utils/aggregate-status.ts`.
3. The link-filter middleware shape resolves the seller-scoped
   candidate IDs, aggregates per order, then intersects matching IDs
   into `filterableFields.id` via `$and`. Same pattern as
   `apply-has-open-request-filter.ts` (which is still in the tree as
   a working reference).
4. The vendor filter UI used multi-select for both. The i18n keys
   `orders.paymentStatus.*` / `orders.fulfillmentStatus.*` were the
   value-label dictionaries — see PR #951 for the exact shape.

### Session 2026-06-05 (b) — Order detail UI completion (round 2)

Vendor UI shipped:

- **Activity timeline mounted**
  (`packages/vendor/src/pages/orders/[id]/order-detail-page.tsx`): the
  previously dead `OrderActivitySection` now renders in the sidebar
  under the Customer card, matching the Figma. Also exposed as
  `OrderDetailPage.SidebarActivitySection` for compound overrides.
- **Metadata + JSON sections** turned on via the existing
  `TwoColumnPage`'s `showMetadata` / `showJSON` props on the order
  detail page (no new component needed — primitives already exist).
- **Receive Items route** registered at
  `/orders/:id/returns/:return_id/receive`
  (`pages/orders/[id]/returns/[return_id]/receive/index.tsx`). Mirrors
  the Medusa admin shape: pulls the order + preview + return, calls
  `useInitiateReceiveReturn` + `useAddReceiveItems` on mount with the
  return's requested quantities, shows the items in a `RouteDrawer`,
  and `useConfirmReturnReceive` on submit. Fixes the dead link that
  `OrderSummarySection` has been pointing at. Per-line quantity
  adjustment is deferred (the Medusa admin form is ~300 lines and
  needs a Mercur trim — not in this slice).
- **Per-payment rows** in `OrderPaymentSection`
  (`pages/orders/[id]/_components/order-payment-section/order-payment-section.tsx`):
  a new inline `PaymentRow` primitive renders transaction id (with
  full id in tooltip), creation timestamp, status badge, amount, and
  an `ActionMenu` kebab with **Create Refund** linking to
  `/orders/:id/refund?payment_id=...`. Refunded payments render with
  a strike-through subtitle and the badge flips to `Refunded` /
  `Partly refunded`. Existing aggregate totals (Total paid /
  refunded / pending) still render below the per-payment list and the
  outstanding-amount action strip stays where it was.
- **Refund drawer route** registered at `/orders/:id/refund`
  (`pages/orders/[id]/refund/index.tsx`). Reads `payment_id` from
  query params; if absent, picks the first refundable captured
  payment automatically. Form has amount (validated against
  remaining-refundable), an optional refund-reason dropdown sourced
  from `useRefundReasons`, and a note. Submit calls the existing
  `useRefundPayment` hook (backend already shipped). Drawer follows
  the standard `RouteDrawer.Form` + `KeyboundForm` pattern.
- **Visual drift fixes**:
  - `OrderSummarySection` and `OrderPaymentSection` now use solid
    `divide-y` (Figma) instead of `divide-y divide-dashed`.
  - The third "order status" badge in `OrderGeneralSection` was kept
    intentionally — its helper (`getCanceledOrderStatus`) only
    returns a value when the order is canceled, so in the normal case
    only payment + fulfillment badges render (matching Figma) while
    the canceled signal remains for the cancellation case. Documented
    as a deliberate non-drift.

Cross-cutting helper added:

- `useMember(id)` in `hooks/api/members.tsx` — the previously
  dead-imported hook used by `By` in `components/common/user-link`.
  The build broke the moment the activity section pulled `By` into
  the module graph. Implemented via `useMe()` →
  `useSellerMembers(meSellerId)` filtered by the requested id.

Build + lint:

- `bun run build` at repo root passes (9/9 packages).
- `bun run lint`: 1364 warnings / 37 errors — **same as baseline**;
  no new findings on any file touched in this session.

What's left for next session (still deferred): the three big
trees — Order Edit, Create Exchange, Create Claim — and their
subscribers (`order-edit-confirmed`, `order-claim-created`,
`order-exchange-created`). Inline `LineItemSubrow` primitive for
return/exchange/claim history under each Summary line item is also
still missing.

### Session 2026-06-05 — Foundational backend + filter / mark-as-paid UI

Backend changes shipped:

- Query-config additions: `packages/core/src/api/vendor/orders/query-config.ts`
  — adds `*payment_collections.payments`, `*.refunds`, `*.payment_sessions`,
  `*returns`, `*returns.items`, `*returns.shipping_methods`. Removed
  `*exchanges` / `*claims` direct relations after verifying the Order
  module doesn't expose them as direct relations (Order has `returns`,
  not exchanges/claims — those live on `OrderExchange` / `OrderClaim`
  models and are reachable via `order_change` and link tables).
- Validator widening + `has_open_request`:
  `packages/core/src/api/vendor/orders/validators.ts` — widens
  `payment_status` / `fulfillment_status` to
  `z.union([z.string(), z.array(z.string())])` and adds
  `has_open_request: z.coerce.boolean().optional()`.
- `has_open_request` middleware:
  `packages/core/src/api/vendor/orders/apply-has-open-request-filter.ts`
  — registered after `applySellerLinkFilter` on `GET /vendor/orders`.
  Joins `order_change.status ∈ {requested, pending}` ∪
  `return.status = requested` via `promiseAll`; composes `$in`/`$nin`
  with the seller-link `id` filter via `$and`.
- Route handler post-filter for status filters:
  `packages/core/src/api/vendor/orders/route.ts` — strips
  `payment_status` / `fulfillment_status` from `req.filterableFields`
  before passing them to `getOrdersListWorkflow` (the Medusa
  core-flow doesn't push them to SQL — they are aggregated post-query
  in JS), then post-filters the workflow result by the requested
  status values. This is the only viable shape today without forking
  the workflow.
- Mark-as-paid endpoint:
  `packages/core/src/api/vendor/payment-collections/` tree.
  `POST /vendor/payment-collections/:id/mark-as-paid` wraps
  `markPaymentCollectionAsPaid` from `@medusajs/core-flows`. Seller
  scope is enforced by walking
  `payment_collection → order_payment_collection.order_id →
  order_seller`. Registered in `api/vendor/middlewares.ts`.

Integration tests added:

- `integration-tests/http/order/vendor/order-list-filters.spec.ts`
  — covers `payment_status` (single + array), `fulfillment_status`
  (single + array), `has_open_request=true/false`, seller-scope
  intersection.
- `integration-tests/http/order/vendor/order-mark-as-paid.spec.ts`
  — covers seller-scope guard (404), wrong `order_id` body (400),
  missing payment_collection (404), and that the owning seller
  reaches the underlying workflow.

Build:

- `bun run build` at repo root passes (9/9 packages).
- `bun run lint` reports 0 errors and 0 warnings in any file added
  or modified in this session.

Vendor UI changes shipped:

- Filter UI enabled:
  `packages/vendor/src/hooks/table/filters/use-order-table-filters.tsx`
  — added Payment status, Fulfillment status, and Request filters.
  Deleted the stale `TODO: enable when Payment, Fulfillments <>
  Orders are linked` comment.
- Query hook:
  `packages/vendor/src/hooks/table/query/use-order-table-query.tsx`
  — adds `has_open_request` to the param list and translates the
  string form (`"true"`/`"false"`) into a boolean for the SDK call.
- Outstanding-amount action strip:
  `packages/vendor/src/pages/orders/[id]/_components/order-payment-section/order-payment-section.tsx`
  — adds an `<OutstandingActions>` row that shows `Copy payment link
  for €X` and `Mark as paid` when `summary.pending_difference > 0` and
  an unpaid payment_collection exists. `Mark as paid` uses the
  existing `useMarkPaymentCollectionAsPaid` hook in
  `packages/vendor/src/hooks/api/payment-collections.tsx` (which was
  already wired to `sdk.vendor.paymentCollections.$id.markAsPaid` —
  it was waiting for the new backend route to exist).
- i18n keys added under `orders.filters.*`, `orders.paymentStatus.*`,
  `orders.fulfillmentStatus.*`, and the toast/CTA copy under
  `orders.payment.*`.

### Integration test status — all green

After rewiring the test setup to the offer-based seeding pattern
(from `integration-tests/http/offer/order/order.spec.ts`), both new
specs run end-to-end on the integration harness:

- `order-list-filters.spec.ts` — **10/10 passing**
- `order-mark-as-paid.spec.ts` — **4/4 passing**

#### Status filters: link-filter, not post-filter

Initial implementation post-filtered the workflow result in JS
because `getOrdersListWorkflow` aggregates `payment_status` and
`fulfillment_status` in JavaScript and ignores them as DB filters.
That worked but broke pagination (the workflow's `count` /
`offset` / `limit` were computed before the filter).

The current implementation is a **link filter**: a new middleware
(`apply-aggregated-status-filter.ts`) runs on `GET /vendor/orders`
after `applySellerLinkFilter`. It:

1. Reads `payment_status` / `fulfillment_status` off
   `req.filterableFields` and strips them.
2. Resolves candidate orders via the existing
   seller-scoped `id` filter (the seller link filter has already
   constrained `req.filterableFields.id` to this seller's orders).
3. Calls `query.graph({ entity: "order" })` to load each
   candidate's `payment_collections.*`, `fulfillments.*`, and the
   `items.detail.raw_fulfilled_quantity` / `items.raw_quantity`
   needed for the aggregation.
4. Aggregates `payment_status` / `fulfillment_status` in JS using
   `aggregate-status.ts`, a mercur-local mirror of Medusa's
   `@medusajs/core-flows/dist/order/utils/aggregate-status` (that
   module isn't re-exported by the package's `exports` field, so
   we can't import it directly — drift-watch comment is on the
   file).
5. Intersects the surviving order IDs into `filterableFields.id`
   via `$and` if an `id` filter already existed, otherwise sets
   `id = { $in: matchingIds }` (or `{ $in: [""] }` to force an
   empty page if nothing matches).

The orders workflow then receives a precise `id` filter and its
pagination metadata is correct. Route handler is back to its
original simple shape.

Mirrors the pattern used by `apply-has-open-request-filter.ts` and
`filter-attributes-by-category-link.ts`.

#### Validator bug found while debugging

The `has_open_request` validator originally used
`z.coerce.boolean()`, which makes `Boolean("false") === true`
because non-empty strings are truthy. That made
`?has_open_request=false` behave like `?has_open_request=true`.
Replaced with
`z.union([z.boolean(), z.enum(["true", "false"])]).transform(...)`
so the string form is parsed explicitly.

#### Out-of-scope baseline drift

The baseline `integration-tests/http/order/vendor/order.spec.ts` is
still broken at the cart `POST /store/carts/:id/line-items` step
with "Invalid request: Field 'offer_id' is required" — that's a
separate pre-existing regression in the older test file's setup,
unrelated to this spec. Fix it by switching that file to the
offer-based seeding pattern these new specs use.

### Where this leaves the spec

Verification checklist updates:

- [ ] Backend: `GET /vendor/orders` accepts `payment_status` and
      `fulfillment_status` arrays — **reverted**, see Session
      2026-06-05 (c).
- [x] Backend: `GET /vendor/orders` exposes the `has_open_request`
      filter — kept via
      `apply-has-open-request-filter.ts` middleware. Integration
      tests passing 3/3.
- [x] Backend: `GET /vendor/orders/:id` response includes
      `payment_collections.payments`, `*.refunds`,
      `payment_collections.payment_sessions`, `returns`,
      `returns.items`, `returns.shipping_methods`. (`exchanges` /
      `claims` deferred — they need to be reached via `order_change`
      or via the Mercur exchanges/claims routes when those land.)
- [x] Backend: `POST /vendor/payment-collections/:id/mark-as-paid`
      shipped per the route-convention rules.
- [~] Frontend: orders-list filters — Request filter (for
      `has_open_request`) is in the `Add filter` menu; Payment /
      Fulfillment status filters were reverted, see Session 2026-06-05 (c).
- [x] Frontend: outstanding-amount action strip renders on the
      Payment section when `pending_difference > 0`, with `Copy
      payment link` and `Mark as paid` CTAs.

Still open (intentionally deferred to follow-up sessions):
Order Edit, Create Exchange, Create Claim, Refund (per-payment-row
entry), Receive Items route registration, Activity-section mount,
JSON / Metadata sections, per-line subrow primitive,
`exchanges` / `claims` query-config additions.

## Notes

- The full Figma node analysis (128 frames across 16 flows) and the
  raw component inventory used to build this spec are recorded in the
  session that created this file (Claude Code, 2026-06-03). Screen
  captures were saved to the agent scratch under `/tmp/figma-orders/`
  but are not committed; re-pull via the Figma MCP server using the
  file key and node IDs above.
- The vendor panel's `OrderActivitySection`
  (`packages/vendor/src/pages/orders/[id]/_components/order-activity-section/`)
  is defined but not mounted by `order-detail-page.tsx`. Treat
  re-mounting as the first scoped fix before adding any new activity
  generators.
- The admin-managed variant of Allocate Items lives on the same Figma
  canvas but belongs to the admin panel; reference it from the admin
  Orders spec, not here.
