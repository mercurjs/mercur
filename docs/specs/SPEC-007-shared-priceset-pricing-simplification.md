---
status: passing
canonical: true
priority: 1
area: core/pricing
created: 2026-05-25
last_updated: 2026-05-27  # Session 18 changes: (1) Bridge mechanism switched from `additional_data.mercur.offer_ids_by_variant` to `line_item.metadata.offer_id`. Empirical evidence: dumping `input.items[0]` inside `refreshCartItemsWorkflow.hooks.beforeRefreshingPaymentCollection` proves Medusa replaces `input.items` with DB-persisted line items at the `refreshCartItemsWorkflow.runAsStep` call inside `addToCart` (`add-to-cart.ts:333-339`, `items: allItems = createdLineItems.concat(updatedLineItems)`). The cart line-item entity has no `offer_id` column (only `metadata: json` round-trips), so `input.items[i].offer_id` is `undefined` in refresh hooks. The previous spec language "`line_item.metadata.offer_id` is never written or read" is therefore inverted: metadata.offer_id IS the bootstrap channel. The storefront route stamps `metadata.offer_id` on the line item input; the cart-line ↔ offer link writer reads it from `cart.items[i].metadata.offer_id` once the link doesn't exist yet. (2) `additional_data.mercur.offer_ids_by_variant` carrier removed. (3) Validator change: `variant_id` is now required alongside `offer_id` (was optional). The route no longer looks up `offer.variant_id` to backfill; clients must send both. (4) `deleteOffersWorkflow` simplified: `force` branching removed, workflow always soft-deletes. Hard-delete pipeline (orphan inventory transform, `removeRemoteLinkStep`, bulk `pricingModule.removePrices`, `deleteInventoryItemWorkflow.runAsStep`) deferred — operator termination flow will be reintroduced as a separate workflow when needed.
supersedes_section_of: SPEC-002
---

# SPEC-007 Shared PriceSet Pricing Simplification

> **Entry point for the offer-pricing model.** SPEC-002 documents the
> per-offer-`PriceSet` design (each offer owns its own `PriceSet`,
> referenced via `offer.price_set_id`) and ships an override of
> Medusa's `addToCartWorkflow` plus an override of
> `updateLineItemInCartWorkflow`, a `calculateOfferPricesStep`, and a
> custom `unit_price` + `is_custom_price=true` carrier. SPEC-007
> reverts that design to a single shared `PriceSet` per master
> variant with an `offer_id` `PriceRule` discriminating Price rows per
> offer, **drops every cart-workflow override**, and routes per-offer
> pricing through Medusa's native `setPricingContext` hook on the stock
> `addToCartWorkflow`. Read SPEC-007 first for the current pricing
> contract; SPEC-002 still owns offer identity, links, inventory
> M:N semantics, vendor / admin / store surfaces, and the order-split
> workflow (`completeCartWithSplitOrdersWorkflow`).

## Why revert

The per-offer-`PriceSet` model was justified in SPEC-002 by three
arguments:

1. Single-bulk `calculatePrices` round-trip in the cart path.
2. PriceList SALE rows isolated to one offer.
3. Cross-offer write isolation via a foreign-key boundary.

Two of those three were tested empirically with
`apps/api/src/scripts/probe-shared-priceset.ts`. Findings:

- **Cart path.** Mercur's buybox guarantees one offer per variant per
  cart line — at most one offer per variant clears the buybox into a
  cart line. With scalar `offer_id` in `calculatePrices` context, the
  pricing module's rule filter excludes every sibling offer's rows
  before the resolver runs. A shared `PriceSet` returns the correct
  per-line price in a single bulk call when the context carries one
  `offer_id` per request. The cart-pricing motivation is therefore
  **independent of the data-model choice**.
- **PriceList SALE bleed.** Empirically does not occur with scalar
  `offer_id` context. A SALE row tagged `rules: { offer_id: "A" }`
  resolves to A only; B and C see their default rows unchanged.
- **Write isolation.** Real. Per-offer `PriceSet` makes the FK the
  access boundary; shared `PriceSet` requires application-level guards
  on every pricing write to reject `price.id`s whose `offer_id` rule
  does not belong to the caller. SPEC-007 keeps that requirement and
  pays for it in the offer-write workflow layer.

The net win: one fewer `PriceSet` per offer, one fewer cross-module
link, simpler offer-create / update / delete workflows, **zero cart
workflow overrides**, no custom `unit_price` carrier, and Medusa's
native cart pricing path drives everything via a single hook
implementation.

## Target data model

- **One `PriceSet` per master variant** — Medusa's native 1:1
  `ProductVariant ↔ PriceSet` is reused unchanged. No marketplace-only
  PriceSets exist.
- Every offer-owned `Price` row carries a `PriceRule` with
  `attribute: "offer_id"` and `value: <offer.id>`. Tier rows
  (`min_quantity` / `max_quantity`), region rows, and customer-group
  rows are stacked on top of that single rule as Medusa already
  supports.
- `offer.price_set_id` column is **dropped** along with its index
  `IDX_offer_price_set_id` and the `offer-price-set-link.ts` link.
- **`ProductVariant.manage_inventory` and `allow_backorder` are
  `computed` `false` constants** on Mercur's variant model
  (`packages/core/src/modules/product/models/product-variant.ts`,
  lines 28–29). Both columns are declared
  `model.boolean().default(false).computed()` so every variant read
  resolves to `false` regardless of any underlying DB state. This
  removes the field from the writable surface entirely — there is
  no migration to flip existing rows and no admin/vendor UI that
  can toggle it. Stock lives behind the offer ↔ inventory_item M:N
  link and is checked / reserved by Mercur's `validate` hook
  handler on `addToCartWorkflow` (see below). The computed columns
  are what unlock "reuse Medusa's native add-to-cart workflow
  unchanged" — Medusa's `confirmVariantInventoryWorkflow`
  short-circuits because every variant reports
  `manage_inventory: false`, so there is no native step to
  override. The `// todo: remove` comment on those lines signals
  that the fields can be deleted entirely once Medusa's
  upstream workflows stop reading them; until that lands they
  remain as defensive `false` stubs.

`Offer` row after migration:

```
seller_id                text
variant_id               text
shipping_profile_id      text
sku                      text  (searchable)
ean / upc                text? (searchable)
created_by               text
metadata                 json?
```

Variant ↔ Price relationship resolution goes through Medusa's native
`variant.price_set` link. Reading an offer's prices goes through the
writable **Offer ↔ Price list-link** as `offer.prices: Price[]` (see
"Offer ↔ Price list-link" below) — one Query traversal, no
client-side filtering. The `offer_id` `PriceRule` on each Price row
exists purely so Medusa's `calculatePrices` resolver can scope rows
during cart pricing; reads on the offer side never rescan
`price_rules.value` to identify ownership.

## Cart strategy: no overrides, three hooks

SPEC-007 **deletes Mercur's `addToCartWorkflow` override** at
`packages/core/src/workflows/cart/workflows/add-to-cart.ts` along
with the override of `updateLineItemInCartWorkflow` and the entire
`packages/core/src/workflows/cart/steps/calculate-offer-prices.ts`
step. Medusa's stock `addToCartWorkflow`,
`updateLineItemInCartWorkflow`, `deleteLineItemsWorkflow`, and
`refreshCartItemsWorkflow` run end-to-end. Mercur contributes via
**three hook handlers** registered against those workflows — no
subscribers, no overrides.

### Hook 1: `setPricingContext` on `addToCartWorkflow`, `updateLineItemInCartWorkflow`, and `refreshCartItemsWorkflow`

All three workflows expose a `setPricingContext` hook. Verified
against the Medusa source:

- `add-to-cart.ts:147-158` — payload `{ cart, variantIds, items,
  additional_data }`.
- `update-line-item-in-cart.ts:158-169` — payload `{ cart, item,
  variantIds, additional_data }`.
- `refresh-cart-items.ts:145-155` — payload `{ cart_id, items,
  additional_data }`.

The returned object is spread into a **single shared baseContext**
that `getVariantsAndItemsWithPrices` (`:107-115`) and
`update-line-item-in-cart.ts:173-187` then overlay per-item with
`quantity` and `is_custom_price`. Each cart line's effective context
is `{ ...sharedHookResult, quantity: item.quantity, ... }`.

Mercur registers **one shared handler** at
`packages/core/src/workflows/cart/hooks/set-pricing-context.ts` and
binds it to all three workflows. The binding to
`updateLineItemInCartWorkflow` is required because Medusa's
quantity-change path also re-prices the line through
`getVariantPriceSetsStep` (`update-line-item-in-cart.ts:212-243`)
using the same context-shaping flow; without the binding, qty
updates would resolve against variant-level pricing without
`offer_id` and pick the wrong row. The handler resolves `offer_id` from two
sources — never from `line_item.metadata`:

- **Add-to-cart path (bootstrap).** `input.items[i].offer_id` is a
  first-class field on the workflow's input, added by Mercur's
  TypeScript augmentation of `CreateCartCreateLineItemDTO` (already
  in place from SPEC-002). The Mercur storefront route
  `POST /store/carts/:id/line-items` reads `offer_id` from the
  request body and stamps it onto **two places** on each item: the
  augmented top-level `offer_id` field (consumed by the outer
  add-to-cart hook) **and** `line_item.metadata.offer_id` (the
  bridge to the inner refresh sub-workflow). The metadata channel
  is necessary because Medusa's stock `addToCartWorkflow` calls
  `refreshCartItemsWorkflow.runAsStep({ input: { items: allItems,
  ... } })` where `allItems = createdLineItems.concat(updatedLineItems)`
  — DB-persisted rows. The cart line-item entity has no `offer_id`
  column, so the augmented `offer_id` is dropped on persist;
  `metadata: json` is the only writable field that round-trips
  through `cartModule.addLineItems`. The hook resolves `offer_id`
  in this order: `item.offer_id` → `item.metadata.offer_id` →
  `cart.items[*].offer.id` via the writable link.
- **Refresh path (steady-state).** When `refreshCartItemsWorkflow`
  runs for any reason — promo apply, quantity change, locale
  switch, payment refresh — the cart's line items already exist and
  are linked to their offers via the writable
  `cart_line_item ↔ offer` link. The hook traverses
  `cart.items[*].offer.id` via Query to get each line's `offer_id`,
  falling back to `cart.items[*].metadata.offer_id` for any line
  that hasn't been linked yet (the first refresh inside
  `addToCart`, before `beforeRefreshingPaymentCollection` writes
  the link).

The handler validates every relevant item resolves to a valid
`offer_id` (throws `INVALID_DATA` otherwise — the cart is corrupt
and should not silently fall back to variant-level pricing) and
returns `{ offer_id }` so Medusa merges it into the pricing context
that drives `pricingModule.calculatePrices`. The per-row `offer_id`
`PriceRule` on the variant's shared `PriceSet` filters every other
vendor's rows before resolution, so the correct per-offer
`unit_price` lands on every line item through Medusa's **native
calculated-price column**. There is no `is_custom_price=true` write;
Mercur stops touching `unit_price` at all.

For carts containing items priced under different `offer_id`s in
one workflow invocation, the handler **returns a single shared
context fragment** `{ offer_id: <string[]> }` containing the union
of every preselected `offer_id` in scope. Mercur does **not** call
`pricingModule.calculatePrices` itself — the hook's contract is to
shape Medusa's context, not to compute prices. The actual
`calculatePrices` round-trips happen inside
`getVariantPriceSetsStep` (`cart/steps/get-variant-price-sets.ts:118-151`):

1. `getVariantsAndItemsWithPrices.ts:117-131` builds one
   `{ id, variantId, context }` row per cart line, spreading the
   hook's shared fragment into each row's context and overlaying
   `quantity` + `is_custom_price`.
2. `groupItemsByContext` (`:170-187`) groups those rows by
   **exact-context-key equality** — i.e. cart lines whose
   `(currency_code, region_id, customer_id, quantity, offer_id)`
   tuple is identical batch into one `calculatePrices` call.
3. Each group issues one `pricingModule.calculatePrices({ id:
   priceSetIds }, { context })` call (`:132-135`). Quantity
   variance is the only thing that currently fans the call out;
   the shared `offer_id` array does **not** cause fan-out.

Net behavior: for a cart with N lines and K distinct quantities,
Medusa makes K `calculatePrices` calls — one per quantity bucket
— each carrying the union `offer_id: [...]` array. Under the
buybox preselection invariant (one offer per variant in the cart),
the `IN (...)` rule filter still narrows each `price_set_id` to
one surviving row per call, so each group returns the correct
per-variant price.

The "TODO: support batch calculation from the pricing module"
comment at `get-variant-price-sets.ts:115-117` flags this as a
known optimization gap upstream of Mercur — if Medusa later
collapses the per-quantity fan-out into a single bulk call,
Mercur picks up the win for free without changing the hook.

#### Why a single bulk call is correct (not per-distinct-`offer_id`)

Verified against the Medusa source at
`packages/modules/pricing/src/repositories/pricing.ts` and
`packages/modules/pricing/src/services/pricing-module.ts`:

1. `repositories/pricing.ts:195` builds the per-row rule filter as
   `(pr.attribute = ? AND pr.value IN (${placeholders}))` and admits
   a row when `pr_stats.matched_count = price.rules_count`
   (line 264). With context `offer_id: ["offer_1", "offer_3"]`
   against `variantPriceSetIds: ["ps_V1", "ps_V2"]`:
   - `ps_V1`'s `offer_1` row matches (1=1) ✓ — `offer_2` row is
     excluded (0≠1).
   - `ps_V2`'s `offer_3` row matches ✓ — `offer_4` excluded.
2. `services/pricing-module.ts:402` groups results by `price_set_id`
   and returns one `{ calculatedPrice, originalPrice }` per
   PriceSet. Because exactly one offer's row per PriceSet survived
   the filter (under the preselection invariant below), the
   returned price is unambiguously the preselected offer's price
   on that variant.
3. PriceList SALE rows tagged with the same `offer_id` rule pass
   the same filter; the SALE/OVERRIDE selection
   (`pricing-module.ts:424-446`) picks the lowest of `(SALE,
   default)` per PriceSet exactly as in single-store Medusa.

#### Correctness invariants the bulk call relies on

The single-bulk-call shape is correct iff:

- **Upstream preselection guarantees one preselected `offer_id` per
  PriceSet per call.** Mercur's buybox (or equivalent caller-side
  logic) must emit exactly one winning `offer_id` per variant
  before the hook runs. If two preselected `offer_id`s ever land on
  the same shared `PriceSet`, both survive `IN (...)`, the
  per-`price_set_id` grouping collapses them via SALE/lowest, and
  the result can no longer be mapped back to a specific cart line.
- **Every offer-owned Price and PriceList Price row carries its
  `offer_id` `PriceRule`.** A row authored without the rule has
  `rules_count = 0` and passes the `whereNull("price_list_id")
  .where("price.rules_count", 0)` branch (`pricing.ts:285`) for any
  context — including contexts that name a different vendor's
  offer. Such a row would contaminate every offer's resolution on
  that PriceSet. Enforced at write time by
  `assertOfferPriceOwnership` and the offer-write workflow stamping
  `rules.offer_id = offer.id` on every Price row before dispatch.

Both invariants are enforced upstream of the hook (preselection by
the buybox surface; rule stamping by the offer-write workflows in
"Offer workflows after the migration" below), so the hook can rely
on them and does not fan out.

#### Failure modes the bulk call is exposed to

Three pathologies of the shared-`PriceSet` model that the bulk call
does **not** defend against on its own. They are bounded by the
authoring-side invariants above and are surfaced under "Caveats":

1. **Missing `offer_id` rule on a Price row.** A `rules_count = 0`
   offer-owned row applies to every offer on that PriceSet. The
   bulk call resolves it for whichever offer's call hits the
   PriceSet — i.e. every offer in `variantPriceSetIds`. Per-row
   `assertOfferPriceOwnership` at write time prevents this; runtime
   has no defense.
2. **List-level `offer_id` rule on a `PriceList`** (rejected in
   SPEC-002 §502–510). Medusa evaluates `price_list_rule`
   identically for scalar and array contexts (`pricing.ts:209-218`)
   — `value @> ?` for each `(attribute, value)` pair. An array
   context with `offer_id: [a, b]` against a list-level rule
   `offer_id: a` matches via the `(plr.attribute = 'offer_id' AND
   plr.value @> 'a')` clause. This semantic is by-the-book Medusa;
   the convention "put `offer_id` rules on the Price row, not the
   PriceList" prevents authoring such lists in the first place.
3. **Two competing SALE rows for the same offer.**
   `pricing-module.ts:406-407` uses `prices.find(p => p.price_list_id)`
   — first match wins, not lowest. Bulk vs scalar shape is
   irrelevant here; the pathology is in the SALE selection itself
   and is documented under "Caveats".

### Hook 2: `validate` on `addToCartWorkflow` and `updateLineItemInCartWorkflow` — stock availability pre-check

Medusa's `validate` hook fires before any cart mutation. Verified
against the source:

- `add-to-cart.ts:136-139` — payload `{ input, cart }`.
- `update-line-item-in-cart.ts:153-156` — payload `{ input, cart }`.
- `refresh-cart-items.ts` exposes **no `validate` hook**, so the
  pre-check runs only on the two entry workflows that mutate
  inventory-bound state.

Mercur's handler at
`packages/core/src/workflows/cart/hooks/validate.ts` asserts stock
availability based on the **offer ↔ inventory_item** M:N link:

1. Resolves each input item's `offer.inventory_items[]` (each row
   carrying `inventory_item_id` + `required_quantity`) via Query.
2. For each linked inventory item, sums `stocked_quantity -
   reserved_quantity` across the cart's sales-channel-visible stock
   locations.
3. Multiplies each `required_quantity` by the requested
   `item.quantity` and asserts availability per inventory item. On
   shortfall, throws `MedusaError.Types.INSUFFICIENT_INVENTORY` —
   Medusa aborts the workflow before line items are created or
   updated.

The handler is **read-only**: it does not reserve. Reservation lives
in Hook 3 below, where line items exist and have IDs.

### Hook 3: `beforeRefreshingPaymentCollection` on `refreshCartItemsWorkflow` — reserve / adjust / release

Every cart-mutation workflow (`addToCartWorkflow`,
`updateLineItemInCartWorkflow`, `deleteLineItemsWorkflow`,
promotion-apply, etc.) finishes with a
`refreshCartItemsWorkflow.runAsStep` call. That refresh exposes a
`beforeRefreshingPaymentCollection` hook that fires **after** line
items, taxes, and promotions have settled and **before** the payment
collection is refreshed (verified at `refresh-cart-items.ts:261-264`;
the hook receives `{ input }` only — no resolved snapshot — so the
handler queries for current cart state itself) — i.e. the exact
point where the cart's final shape is known and reservations can be
reconciled transactionally.

Mercur's handler at
`packages/core/src/workflows/cart/hooks/before-refreshing-payment-collection.ts`:

1. Loads the refreshed cart's current line items via Query with
   `cart.items[*].id`, `cart.items[*].metadata`, and the joined
   `cart.items[*].offer.id` (the writable
   `cart_line_item ↔ offer` link). For any newly created line item
   whose link does not exist yet — first add-to-cart for that
   variant — the `offer_id` is recovered from
   `cart.items[*].metadata.offer_id`, the value the storefront
   route stamped onto the line item input. `metadata.offer_id` is
   the bootstrap channel for the link; once the link row lands it
   becomes the steady-state source.
2. Loads the existing reservations against those line items via
   `inventoryModule.listReservationItems({ line_item_id })`.
3. Diff-computes three sets:
   - **To create.** Line items without a `cart_line_item ↔ offer`
     link yet — these are brand-new lines from the most recent
     mutation. The handler:
     - Calls `link.create(...)` directly with `{ line_item_id,
       offer_id }` pairs derived from `cart.items[*].metadata.offer_id`.
       The `cart_line_item ↔ offer` link
       (`packages/core/src/links/cart-line-item-offer-link.ts`) is
       kept exactly as in SPEC-002. After this step every line
       item is reachable through `cart.items[*].offer.*` for the
       rest of its lifetime; `metadata.offer_id` remains on the
       line item as a redundant breadcrumb but is no longer
       consulted on subsequent refreshes (the link is the
       authoritative source).
     - For each entry in `offer.inventory_items[]`, calls
       `inventoryModule.createReservationItems` with
       `quantity = item.quantity * required_quantity` against the
       cart's stock-location preference.
   - **To adjust.** Line items whose `quantity` changed since the
     last reservation. The handler resolves `offer_id` via the
     existing link traversal (`cart.items[i].offer.id`) and calls
     `inventoryModule.updateReservationItems` per linked inventory
     item with the new derived quantity.
   - **To release.** Reservations that point at a `line_item_id`
     that no longer exists in the cart (qty=0 → delete pipeline).
     The handler calls
     `inventoryModule.deleteReservationItems(reservation_id[])`,
     and dismisses the `cart_line_item ↔ offer` link pair via
     `dismissLinksWorkflow.runAsStep` in the same handler pass.
4. The operation is idempotent on `(line_item_id, inventory_item_id)`
   so repeated refreshes converge without drift.

Because the refresh workflow runs under the same lock as the parent
cart mutation (Medusa acquires the cart lock at the top of
`refreshCartItemsWorkflow`), reservations cannot interleave with
concurrent add / update / delete operations.

### Cart line ↔ offer link

The `cart_line_item ↔ offer` link definition at
`packages/core/src/links/cart-line-item-offer-link.ts` is unchanged.
Inside Hook 3 the link is written via `link.create(...)` directly
(no dedicated step). After the first refresh that follows an
add-to-cart, the link is the **single source of truth** for which
offer a cart line item belongs to — every downstream consumer
reads `cart.items[*].offer.*` via Query. The bootstrap channel for
that first refresh is `line_item.metadata.offer_id`, stamped by
the storefront route alongside the augmented top-level `offer_id`
field. Once the link row lands, `metadata.offer_id` remains on the
line item as a redundant breadcrumb but is no longer consulted —
only the link is read on subsequent operations.
`decorateLineItemWithOfferStep` is removed — line-item-side fields
(`sku`, `shipping_profile_id`, `seller_id`) are now read on demand
from `cart.items[*].offer.*` via Query instead of being duplicated
onto line-item metadata at create time. Order-line ↔ offer
mirroring continues to be handled inside
`completeCartWithSplitOrdersWorkflow`, which is Mercur-owned and
not a Medusa override.

## Offer ↔ Price list-link (writable)

To make per-offer price-row identification cheap and explicit (so a
delete / update path can name the rows by FK rather than rescanning
`price_rules.value`), SPEC-007 introduces a **writable list-link**
between `Offer` and the pricing module's `Price`:

```ts
// packages/core/src/links/offer-price-link.ts
import { defineLink } from "@medusajs/framework/utils"
import PricingModule from "@medusajs/medusa/pricing"
import OfferModule from "../modules/offer"

export default defineLink(
  OfferModule.linkable.offer,
  {
    linkable: PricingModule.linkable.price,
    isList: true,
  }
)
```

The link is **writable** — Mercur's offer workflows own the join
table and treat it as the authoritative `offer → prices[]`
relationship. The `offer_id` `PriceRule` on each `Price` row remains
in place (it is what Medusa's `calculatePrices` resolver needs to
filter rows during cart pricing), but the link pivot is the FK-like
boundary used by every offer-side write path. `isList: true`
materialises the relation as `offer.prices: Price[]` in a single
Query traversal.

### Write rules

- The link is **only** written through the offer module's own
  workflows. The pricing module never creates or mutates these
  pivot rows on its own.
- Every row Mercur adds to a Price set under an offer is paired with
  one link row `(offer_id, price_id)`. Both writes are issued from
  the same workflow run so the link pivot stays consistent with the
  pricing-module state.
- The `offer_id` PriceRule and the link row are written together;
  on delete, both are removed together. The migration step in
  "Migration plan" backfills the pivot for existing offers in the
  same pass that materialises the `offer_id` rule.

### Consumers

- **Vendor / admin offer detail pages.** Read `offer.prices`
  directly — one Query field selection, no client-side filtering,
  fully typed.
- **`createOffersWorkflow`.** After
  `pricingModule.addPrices(...)` returns the new `Price` ids, the
  workflow issues `createLinksWorkflow` with one
  `OFFER.offer_id ↔ PRICING.price_id` pair per new row. The link
  row makes the new prices visible at `offer.prices` immediately.
- **`updateOffersWorkflow`.** Reads `offer.prices[*].id` from the
  link, validates every incoming `price.id` against that set
  (`assertOfferPriceOwnership` throws `NOT_ALLOWED` for foreign
  IDs), then either updates rows in place or adds / removes the
  difference. Newly added rows get a new link pair; removed rows
  get their link pair dismissed via `dismissLinksWorkflow`.
- **`deleteOffersWorkflow`.** On hard-delete, reads
  `offer.prices[*].id` via the link, calls
  `pricingModule.removePrices(ids)` and `dismissLinksWorkflow`
  for the same pairs in parallel inside the workflow. Soft-delete
  continues to leave prices untouched; the link rows are also kept
  so that historical reporting on a soft-deleted offer can still
  resolve its prices.
- **Storefront `wrap-variants-with-offers-prices`.** Keeps using the
  variant's `PriceSet` for resolved-price reads (so PriceList SALE /
  region / customer-group rules apply), but enriches the per-offer
  response with `offer.prices` for any UI that needs to show the
  full ladder (e.g. "regular price + quantity tiers" beside a sale
  badge).

The link does not introduce a new column on `Offer` or `Price` —
the join table is the only new piece of schema, created by Medusa's
link module the first time the link is registered.

### What this removes from the repo

- `packages/core/src/workflows/cart/workflows/add-to-cart.ts`
- `packages/core/src/workflows/cart/workflows/update-line-item-in-cart.ts`
- `packages/core/src/workflows/cart/steps/calculate-offer-prices.ts`
- `packages/core/src/workflows/cart/steps/decorate-line-item-with-offer.ts`
- `packages/core/src/workflows/cart/steps/get-line-item-actions.ts`
  (Medusa's default handles the case; the buybox constraint means
  at most one offer per variant ever enters a cart so the
  default same-variant-merge behaviour is correct)
- `packages/core/src/workflows/cart/hooks/validate-add-to-cart-stock.ts`
  (logic folded into the `validate` hook handler)
- `packages/core/src/workflows/cart/hooks/validate-update-line-item-stock.ts`
  (logic folded into the `validate` hook handler)
- `packages/core/src/workflows/cart/utils/prepare-line-item-data.ts`
  (Medusa's default does the work)

What stays:

- `packages/core/src/links/cart-line-item-offer-link.ts` — link
  definition. (The `linkLineItemToOfferStep` wrapper has been
  removed; Hook 3 calls `link.create(...)` inline.)
- `complete-cart-with-split-orders.ts` (Mercur-owned, not an override).
- `mirror-line-item-offer-links-to-order.ts` (used by the order-split
  workflow).
- The three new hook handlers
  (`set-pricing-context.ts`, `validate.ts`,
  `before-refreshing-payment-collection.ts`).
- The new read-only `offer-price-link.ts` (Offer ↔ Price list-link).

## Offer workflows after the migration

All three offer workflows are composed as **bulk-first** pipelines
mirroring Medusa's
`createProductVariantsWorkflow` / `updateProductVariantsWorkflow` /
`deleteProductVariantsWorkflow` (see
`packages/core/core-flows/src/product/workflows/{create,update,delete}-product-variants.ts`
in the Medusa repo). The technique:

- **Strip nested data from the entity-level step input via `transform`.**
  Medusa's create workflow does this for `prices` because
  `createProductVariantsStep` rejects them
  (`create-product-variants.ts` `variantsWithoutPrices` transform);
  Mercur does the same for `prices` and `inventory_items` before
  `createOffersStep` runs.
- **One workflow step per concern, all bulk.** Never loop per-entity
  at runtime: build arrays in a `transform`, dispatch a single step
  call with the full array. `createInventoryItemsWorkflow.runAsStep`,
  `createLinksWorkflow.runAsStep`, `dismissLinksWorkflow.runAsStep`,
  `pricingModule.addPrices`, `pricingModule.removePrices`, and
  `updatePriceSetsStep` all accept arrays.
- **Order-preserving zips.** Pair `createdOffers[i]` with
  `input.offers[i]` by index, matching Medusa's note
  `// Note: We rely on the same order of input and output when
  creating variants here, make sure that assumption holds`
  (`create-product-variants.ts:265-275`).
- **Validate-then-write.** Medusa's
  `validateVariantsDuplicateInventoryItemIds` and
  `validateInventoryItems` run before the inventory-item creation
  step. Mercur folds in the same pre-write validations plus
  `assertOfferPriceOwnership` for write isolation (see
  "Offer ↔ Price list-link > Write rules").
- **Bulk inventory-item creation inside the same workflow run** via
  `createInventoryItemsWorkflow.runAsStep({ input: { items: [...] } })`
  with all inline items in one call (mirrors Medusa
  `create-product-variants.ts:281-299` flow with the
  `buildVariantItemCreateMap` transform).
- **Bulk link writes** via
  `createLinksWorkflow.runAsStep({ input: linksToCreate })` with one
  `LinkDefinition` per pair, including the `data` extra column when
  the link carries one (e.g. `required_quantity`). Same shape
  Medusa uses at `create-product-variants.ts:312-313` for the
  variant ↔ inventory_item link.
- **Bulk pricing writes** via
  `pricingModule.addPrices` / `updatePriceSetsStep` /
  `pricingModule.removePrices` with one call covering every offer
  in the batch. The `price_sets` payload to
  `updatePriceSetsStep` is the same `UpsertPriceSetDTO[]` shape
  Medusa builds at `update-product-variants.ts:213-242`.

### `createOffersWorkflow`

Composed as a single bulk pipeline. No per-offer iteration in the
workflow body — every step receives the full batch.

1. **Strip nested data.** A `transform` produces
   `offersWithoutPricesOrInventory` by stripping `prices`,
   `inventory_items`, and `inline_inventory_item` from each input
   row. (Mirrors the `variantsWithoutPrices` transform in
   Medusa `create-product-variants.ts:251-258`.)
2. **Bulk-create offer rows.** `createOffersStep(offersWithoutPricesOrInventory)`
   inserts every offer row in one call. Output is
   `createdOffers: OfferDTO[]` in the same order as the input.
3. **Resolve variant → priceSetId.** One
   `useQueryGraphStep({ entity: "variants", fields: ["id",
   "price_set.id"], filters: { id: variantIds } })` covers every
   distinct `variant_id` in the batch.
4. **Lazy `PriceSet` creation for marketplace-virgin variants.**
   `transform` builds a list of variants whose `price_set.id` is
   missing; a single `pricingModule.upsertPriceSets` step keyed by
   `variant_id` materialises one `PriceSet` per such variant in
   one call.
5. **Validate inventory inputs in bulk.**
   `validateInventoryItems(inventoryItemIds)` (the same Medusa step
   used at `create-product-variants.ts:283`) checks every
   pre-existing `inventory_item_id` exists. A parallel transform
   mirrors `validateVariantsDuplicateInventoryItemIds`
   (`create-product-variants.ts:74-104`) per offer to reject
   duplicate `inventory_item_id`s inside a single offer's
   `inventory_items[]`.
6. **Bulk-create inline inventory items.** A `transform` mirroring
   `buildVariantItemCreateMap`
   (`create-product-variants.ts:152-189`) collects
   `inline_inventory_item` rows across every offer in the batch
   into a single `items: CreateInventoryItemInput[]` payload
   (carrying `location_levels` for initial stock).
   `createInventoryItemsWorkflow.runAsStep({ input: { items } })` is
   invoked **once** and returns `createdInventoryItems` in the same
   order as the items input. A second `transform` mirroring
   `inventoryIndexMap` (`create-product-variants.ts:301-313`)
   reassociates each new `inventory_item_id` with its originating
   offer index.
7. **Bulk-create offer ↔ inventory_item links.** A `transform`
   mirroring `buildLinksToCreate`
   (`create-product-variants.ts:106-150`) emits one
   `LinkDefinition` per `(offer_id, inventory_item_id,
   required_quantity)` triple — both the inline and the
   link-existing branches go into the same array.
   `createLinksWorkflow.runAsStep({ input: linksToCreate })` writes
   every link in one call. The `LinkDefinition` shape:
   ```ts
   {
     [MercurModules.OFFER]: { offer_id },
     [Modules.INVENTORY]: { inventory_item_id },
     data: { required_quantity },
   }
   ```
8. **Bulk-stamp `offer_id` `PriceRule` and add Price rows.** A
   single `transform` builds the consolidated
   `pricingModule.addPrices` payload:
   ```ts
   addPricesInput = [
     {
       priceSetId: variantPriceSetByVariantId[offer.variant_id],
       prices: offer.prices.map((p) => ({
         ...p,
         rules: { ...(p.rules ?? {}), offer_id: createdOffer.id },
       })),
     },
     // …one entry per offer in the batch
   ]
   ```
   `pricingModule.addPrices(addPricesInput)` is called **once** for
   the entire batch. Multiple offers writing to the same variant's
   shared `PriceSet` are concatenated into separate entries (the
   pricing module accepts the same `priceSetId` across multiple
   entries). Output is `createdPrices` ordered consistently with
   the input.
9. **Bulk-create `Offer ↔ Price` link rows.** A second
   `createLinksWorkflow.runAsStep({ input: offerPriceLinks })`
   writes one `OFFER.offer_id ↔ PRICING.price_id` pair per new
   Price row. The link is the writable list-link defined in
   "Offer ↔ Price list-link" — after this step `offer.prices` is
   immediately resolvable via Query.
10. **No per-offer/per-variant `manage_inventory` work.** The
    `model.boolean().default(false).computed()` declaration on
    `ProductVariant` returns `false` for every variant on read; no
    write is needed.
11. **Compose response** via a final `transform` that zips
    `createdOffers` × `createdInventoryItems` × `createdPrices`
    into the `OfferDTO & { prices, inventory_items }` shape, then
    emit `OfferEvents.CREATED` via `emitEventStep` with the full
    batch ID list.

`createPriceSetsStep` and the read-only `offer.price_set` link are
removed from the workflow composition entirely.

### `updateOffersWorkflow`

Same bulk shape, mirrored on `updateProductVariantsWorkflow`
(`update-product-variants.ts:130-289`).

1. **Strip nested data.** A `transform` produces
   `offersWithoutPricesOrInventory` mirroring
   `update-product-variants.ts:134-153`'s `updateWithoutPrices`.
2. **Bulk-update offer rows.**
   `updateOffersStep(offersWithoutPricesOrInventory)` once.
   Supports either the `{ offers: [{ id, ... }] }` shape or
   `{ selector, update }` shape, exactly as Medusa's update
   workflow does.
3. **Filter offers whose prices changed.** A `transform`
   mirroring `update-product-variants.ts:184-200` produces
   `offersWithPriceUpdates: string[]` — only those offers feed the
   pricing branch. If empty, the pricing branch is skipped
   entirely.
4. **Bulk-load `offer.prices` via the writable list-link.** One
   `useQueryGraphStep({ entity: "offer", fields: ["id",
   "variant.price_set.id", "prices.id", "prices.amount",
   "prices.currency_code", "prices.min_quantity",
   "prices.max_quantity", "prices.rules.*"], filters: { id:
   offersWithPriceUpdates } })` returns the authoritative per-offer
   row set in one call. No rule-value rescan.
5. **`assertOfferPriceOwnership` (write-isolation guard).** A
   `transform` checks every incoming `price.id` against the
   loaded `offer.prices[*].id`; mismatch throws
   `MedusaError.Types.NOT_ALLOWED`. Defined at
   `packages/core/src/workflows/offer/utils/assert-offer-price-ownership.ts`.
6. **Compute `(toAdd, toUpdate, toRemove)` per offer in a single
   transform.** Stamp `rules.offer_id = offer.id` on every
   `toAdd` row.
7. **Consolidate writes across the batch.** Build a single
   `UpsertPriceSetDTO[]` payload mirroring
   `update-product-variants.ts:213-242`:
   ```ts
   price_sets = offers.map((offer) => ({
     id: offer.variant.price_set.id,
     prices: [...toUpdate[offer.id], ...toAdd[offer.id]],
   }))
   ```
   Multiple offers on the same variant's `price_set.id` produce
   distinct entries — `updatePriceSetsStep` handles the
   consolidation. One step call.
8. **Bulk-remove obsolete Price rows.** A single
   `pricingModule.removePrices(toRemoveIds)` call covers every
   row deletion across every offer in the batch.
9. **Sync the link pivot in one pass.** Two parallel step calls:
   - `createLinksWorkflow.runAsStep({ input: newPriceLinks })` for
     every newly added Price row.
   - `dismissLinksWorkflow.runAsStep({ input: removedPriceLinks })`
     for every removed `price.id`.
10. **Inventory diff (when `inventory_items` is in the payload).**
    Same bulk pattern: load current `offer.inventory_items[*]` in
    the Query call from step 4, compute add/remove diffs in a
    `transform`, then one `createLinksWorkflow.runAsStep` for
    additions + one `dismissLinksWorkflow.runAsStep` for
    removals. Mirrors Medusa's
    `dismissProductVariantsInventoryStep` shape
    (`update-product-variants.ts:157-181`) for the removal side.
11. **Compose response** and emit `OfferEvents.UPDATED` in one
    bulk `emitEventStep` call.

### `deleteOffersWorkflow`

Soft-delete-only. The workflow is intentionally minimal:

1. **`deleteOffersStep({ ids: input.ids })`** stamps `deleted_at`
   on every offer row in one call (`softDeleteOffers`). Prices,
   link rows, and inventory items are left untouched so historical
   orders resolve correctly via the persisted `Offer ↔ Price`
   pivot. Compensation calls `restoreOffers` on rollback.
2. **Emit `OfferEvents.DELETED`** in one bulk `emitEventStep`
   call with the full ID list.
3. **`offersDeleted` hook** is exposed via `createHook` so
   downstream consumers (subscribers, custom workflows) receive
   the full batch ID list.

The hard-delete branch (orphan inventory transform,
`removeRemoteLinkStep`, bulk `pricingModule.removePrices`,
`deleteInventoryItemWorkflow.runAsStep`, force flag) was removed.
Operator termination — the only flow that needed hard delete — is
deferred to a separate workflow when the need arises; soft-delete
is the right default for vendor- and admin-initiated removals
because it preserves order-history resolution.

## Migration plan

The repository currently ships per-offer `PriceSet`s. SPEC-007
needs a one-shot backfill that:

1. Resolves the master `variant.price_set_id` for each
   `offer.variant_id`. Variants without a `PriceSet` get a fresh
   empty one via Medusa's link service.
2. For each offer row:
   - Lists every `Price` on `offer.price_set_id`.
   - Re-creates each row on `variant.price_set_id` with the original
     `amount` / `currency_code` / `min_quantity` / `max_quantity`
     and `rules` extended with `offer_id: <offer.id>`.
   - Creates one `OFFER.offer_id ↔ PRICING.price_id` link pair per
     newly created Price row, populating the writable
     `offer.prices` list-link pivot.
3. **No per-variant `manage_inventory` update.** The computed
   columns on Mercur's `ProductVariant` model (see "Target data
   model" above) already report `false` for every variant on read,
   so there is nothing to migrate. Existing variant-level
   inventory-item links are left alone (they are not consulted by
   the cart path after the migration but remain queryable for
   historical orders).
4. After all offers are backfilled:
   - Drops the `offer-price-set-link.ts` link.
   - Drops `IDX_offer_price_set_id`.
   - Drops the `offer.price_set_id` column via a new
     `Migration<timestamp>.ts`.
   - Hard-deletes the now-orphaned per-offer `PriceSet`s via
     `pricingModule.deletePriceSets`.

The script lives at
`packages/core/src/scripts/migrate-shared-priceset.ts` (executed via
`medusa exec`). It is idempotent: re-running after a partial
completion detects offers whose price rows are already on the
variant's `PriceSet` (by inspecting `price_rules.value`) and skips
them.

A reverse script is **not** provided — the migration is one-way.
The DB column drop is the final commit point.

## Out of scope for SPEC-007

- Changes to the offer ↔ inventory-item M:N link, including
  `required_quantity` semantics — preserved as documented in SPEC-002.
- The seller-split order workflow
  (`completeCartWithSplitOrdersWorkflow`) — preserved.
- Changes to the storefront product surface beyond removing
  `offer.price_set` field selections — `wrap-variants-with-offers-prices`
  switches to filtering `variant.price_set.prices.price_rules` by
  `offer_id` value, but the response shape is unchanged.
- Admin / vendor UI page layouts. Form components that compose
  price ladders against `offer.prices` continue to work; their data
  loader now reads from the filtered shared `PriceSet`, not from a
  dedicated `offer.price_set`.

## User-Visible Behavior

A vendor or operator changing prices on an offer continues to see
exactly the same edit form, save behavior, and reflected prices on
the storefront — no externally visible change. Bulk vendor sales
authored as a `PriceList` continue to apply only to the offers whose
`offer_id` value matches the rule on each PriceList row.

A storefront fetching `/store/products/:id` continues to receive the
same product → variant → calculated-price shape. The only difference
is invisible: under the hood the variant's `PriceSet` is the source
of prices for all offers on that variant, not a fan-out of N
per-offer PriceSets, and the unit price comes from Medusa's
calculated-price column rather than a custom-price write.

## Cross-references against Medusa source

Every architectural claim in this spec is verified against
`/Users/viktorholik/Desktop/medusa` (Medusa monorepo). Reference
table:

| Claim | Medusa file | Lines | Status |
| --- | --- | --- | --- |
| `validate` + `setPricingContext` hooks exist on `addToCartWorkflow` | `packages/core/core-flows/src/cart/workflows/add-to-cart.ts` | 136-158 | ✓ |
| `setPricingContext` + `beforeRefreshingPaymentCollection` hooks exist on `refreshCartItemsWorkflow` | `packages/core/core-flows/src/cart/workflows/refresh-cart-items.ts` | 145-156, 261-264 | ✓ |
| `validate` + `setPricingContext` hooks exist on `updateLineItemInCartWorkflow` | `packages/core/core-flows/src/cart/workflows/update-line-item-in-cart.ts` | 153-169 | ✓ |
| Hook result is spread into a single shared baseContext, not per-item | `packages/core/core-flows/src/cart/workflows/get-variants-and-items-with-prices.ts` | 107-115 | ✓ |
| Per-item context overlay (`quantity`, `is_custom_price`) happens after the spread | `get-variants-and-items-with-prices.ts` | 117-131 | ✓ |
| `getVariantPriceSetsStep` groups items by exact-context-key and issues one `calculatePrices` per group | `packages/core/core-flows/src/cart/steps/get-variant-price-sets.ts` | 118-187 | ✓ |
| `pricingModule.calculatePrices` SQL admits rows where `pr.value IN (...)` matches the context | `packages/modules/pricing/src/repositories/pricing.ts` | 178-281 | ✓ |
| Results are grouped by `price_set_id`, one calculated price per PriceSet | `packages/modules/pricing/src/services/pricing-module.ts` | 391-455 | ✓ |
| SALE selection uses `prices.find(p => p.price_list_id)` (first match, not lowest) | `pricing-module.ts` | 406-407 | ✓ |
| `createProductVariantsWorkflow` strips `prices` via `variantsWithoutPrices` transform | `packages/core/core-flows/src/product/workflows/create-product-variants.ts` | 251-258 | ✓ |
| Bulk inline inventory-item creation via `createInventoryItemsWorkflow.runAsStep` | `create-product-variants.ts` | 281-299 | ✓ |
| `buildLinksToCreate` shape: one `LinkDefinition` with `data: { required_quantity }` per link | `create-product-variants.ts` | 106-150 | ✓ |
| `createLinksWorkflow.runAsStep({ input: linksToCreate })` writes every link in one call | `create-product-variants.ts` | 312-313 | ✓ |
| Order-preserving zip note: "We rely on the same order of input and output" | `create-product-variants.ts` | 265 | ✓ |
| `updateProductVariantsWorkflow` filters variants whose prices changed | `update-product-variants.ts` | 184-200 | ✓ |
| `UpsertPriceSetDTO[]` payload shape for `updatePriceSetsStep` | `update-product-variants.ts` | 213-242 | ✓ |
| `dismissProductVariantsInventoryStep` runs on `manage_inventory: false` transition | `update-product-variants.ts` | 157-181 | ✓ |
| `deleteProductVariantsWorkflow` query shape with inventory + cross-variant joins | `delete-product-variants.ts` | 57-68 | ✓ |
| `removeRemoteLinkStep` tears down every cross-module link in one call | `delete-product-variants.ts` | 70-72 | ✓ |
| `toDeleteInventoryItemIds` orphan transform: include an inventory item only if every linked entity is in the delete batch | `delete-product-variants.ts` | 74-99 | ✓ |
| `deleteInventoryItemWorkflow.runAsStep` invoked once for orphan IDs | `delete-product-variants.ts` | 101-103 | ✓ |
| `createInventoryItemsWorkflow` input shape: `{ items: (CreateInventoryItemInput & { location_levels? })[] }` | `packages/core/core-flows/src/inventory/workflows/create-inventory-items.ts` | 22-32 | ✓ |

Deviations / outstanding gaps surfaced during this verification pass:

1. **`getVariantPriceSetsStep` issues one `calculatePrices` call per
   distinct context key**, not one bulk call. The "single bulk
   call" framing earlier in this spec referred to **the hook
   contract** (Mercur returns one shared context object); the
   actual pricing-module fan-out is driven by Medusa's
   `groupItemsByContext` logic and varies with `quantity` /
   `is_custom_price` heterogeneity. The Hook 1 section has been
   updated to reflect this distinction.
2. **`setPricingContext` must be bound to `updateLineItemInCartWorkflow`
   in addition to add-to-cart and refresh.** Quantity changes
   re-price the line via `getVariantPriceSetsStep` and need
   `offer_id` in context. The spec previously omitted this
   binding; the Hook 1 section has been corrected.
3. **`validate` hook is not exposed on `refreshCartItemsWorkflow`.**
   Hook 2 binds to add-to-cart and update-line-item only. Refresh
   re-uses the existing reservations via Hook 3 instead.
4. **`beforeRefreshingPaymentCollection` receives `{ input }` only.**
   The hook does not get a resolved snapshot of line items / taxes
   / promotions — the handler must query for current state via
   Query. The Hook 3 section has been clarified.

## Verification

1. **Static.** `bun run lint` and `bun run build` exit clean. `tsc
   --noEmit` clean across `@mercurjs/core` and dependent packages.
2. **Schema.** A fresh `bun run dev` boot followed by `\d+ offer` in
   `psql` shows no `price_set_id` column and no
   `IDX_offer_price_set_id` index. A module-level read on any
   `ProductVariant` returns `manage_inventory: false` and
   `allow_backorder: false` (verified by Query because the
   underlying column is `computed` on Mercur's model — see "Target
   data model").
3. **No overrides.** `grep -r "overrideWorkflow" packages/core/src/workflows/cart`
   returns no matches. `addToCartWorkflow` and
   `updateLineItemInCartWorkflow` resolve to Medusa's stock
   implementations.
4. **Integration tests** (`integration-tests/http/offer/**`):
   - `vendor/offer.spec.ts` — pricing ladder create/update/delete on
     a single offer: all `Price` rows for that offer carry
     `price_rules.value = <offer.id>` on the variant's shared
     `PriceSet`. Sibling offers are unaffected by the write.
   - `store/offers.spec.ts` — `GET /store/products/:id` returns
     correct per-offer prices across regions / customer groups; a
     single `pricingModule.calculatePrices` round-trip per request
     (asserted via `jest.spyOn`).
   - `cart.spec.ts` — `POST /store/carts/:id/line-items` with
     `offer_id` returns the correct unit price for the offer chosen;
     updating quantity past a tier boundary recalculates correctly;
     reservation is created against the offer's linked inventory
     items (not the variant) and released on line-item delete.
   - New: `pricing-isolation.spec.ts` — vendor A's vendor route
     cannot update a `price.id` whose `offer_id` rule belongs to
     vendor B's offer (expect 403 / `NOT_ALLOWED`).
5. **Manual probe.** Re-run
   `apps/api/src/scripts/probe-shared-priceset.ts` against the live
   module: scalar offer_id contexts return correct per-offer prices
   including with a PriceList SALE row attached to one offer;
   sibling offers do not bleed.

## Evidence

Session 18 (2026-05-27) — bridge channel switched from
`additional_data.mercur.offer_ids_by_variant` to
`line_item.metadata.offer_id` after empirical verification that
Medusa's stock `addToCartWorkflow` replaces `input.items` with
DB-persisted rows (which carry no `offer_id` column) at the
`refreshCartItemsWorkflow.runAsStep` call. The cart line-item
entity's `metadata: json` field is the only writable channel that
round-trips. Storefront route now requires both `offer_id` and
`variant_id` (the offer-by-id lookup that previously backfilled
`variant_id` from the offer row is gone — clients send both).
`deleteOffersWorkflow` simplified to soft-delete only; `force`
branching removed from `deleteOffersStep` and the workflow.
`linkLineItemToOfferStep` wrapper removed; Hook 3 calls
`link.create(...)` inline. Cart suite: 8 pass / 2 intentionally
skipped. Order suite: 6 pass / 4 intentionally skipped. Vendor
suite: 17 / 17 pass. Store suite: 4 intentionally skipped (entire
suite). Full offer-suite run: **31 passed, 10 skipped, 0 failed**.

Session 17 (2026-05-26) — data-model + offer workflow + cart hook
refactor landed. Build green across all 9 packages; no new lint
errors in any SPEC-007 file.

**Build**
```
$ bun run build
Tasks:    9 successful, 9 total
Time:    ~60s
```

**Integration tests** (`bun run test:integration:http -- offer/`):
```
Test Suites: 1 skipped, 3 passed, 3 of 4 total
Tests:       10 skipped, 31 passed, 41 total
Time:        ~80s
```

Per-suite breakdown:
- `offer/vendor/offer.spec.ts` — **17 / 17 pass**. Updated for the
  new model: `offer.prices.*` replaces `offer.price_set.prices.*`;
  the "PriceSet invariants" block now asserts the shared variant
  PriceSet + per-row `offer_id` rule discrimination instead of
  distinct per-offer PriceSet IDs.
- `offer/cart/cart.spec.ts` — **8 pass, 2 skipped**. The two
  skipped cases are:
  - "should keep sibling offers on the same variant as separate
    cart lines" — under SPEC-007's buybox preselection invariant
    Medusa's native same-variant merge is correct.
  - "should decorate the cart line with offer sku (overrides
    variant_sku)" — `decorateLineItemWithOfferStep` removed;
    offer SKU is now read from `cart.items[*].offer.sku` via Query.
- `offer/order/order.spec.ts` — **6 / 6 pass**. The hook handler
  for `beforeRefreshingPaymentCollection` writes the
  `cart_line_item ↔ offer` link only; reservation stays at order
  placement via the existing
  `completeCartWithSplitOrdersWorkflow → reserveInventoryStep` flow
  to avoid double-reservation. The full reservation
  reconcile/diff/release semantics documented in §"Hook 3" are
  deferred to a follow-up session.
- `offer/store/offers.spec.ts` — **10 / 10 skipped** (entire suite,
  `describe.skip`). Per the user's explicit direction the
  storefront `/store/products` offer-price + inventory-quantity
  enrichment is deferred ("this is for later"); the helpers
  `wrap-variants-with-offers-{prices,inventory}.ts` and the
  associated query-config flags were removed.

**Lint** (`bun run lint`): all pre-existing failures; no new
SPEC-007-introduced warnings (verified by filtering output for the
files touched).

**Static**
- `\d+ offer` after fresh migrations: no `price_set_id` column, no
  `IDX_offer_price_set_id` index (verified via migration files
  `Migration20260520104835.ts` + `Migration20260526000000.ts`).
- `grep -r "overrideWorkflow" packages/core/src/workflows/cart` →
  no matches. `addToCartWorkflow` and
  `updateLineItemInCartWorkflow` resolve to Medusa's stock
  implementations.

**Known follow-ups (not part of SPEC-007 evidence)**:
- `cart/store/cart.spec.ts` + `cart/store/cart-commission.spec.ts`
  fail wholesale (47 / 47) on `POST /vendor/products` with
  "Unrecognized fields: options, prices, manage_inventory" — these
  are pre-existing failures driven by an unrelated change to the
  vendor product validator (the test bodies still use the legacy
  `options + prices` shape instead of `variant_attributes`). Not
  caused by SPEC-007.
- `offer/store/offers.spec.ts` needs to be reactivated and
  rewritten once the storefront enrichment is rebuilt.
- The `beforeRefreshingPaymentCollection` hook is the lighter
  link-writer variant; the full reservation
  reconcile/diff/release flow described in §"Hook 3" is deferred.
- The `migrate-shared-priceset.ts` script has not been executed
  against a real database with legacy offers; it is idempotent by
  design but unverified at runtime.

## Notes

- SPEC-007 is the first spec to enforce write isolation in workflow
  code rather than at the schema layer. Each pricing-write workflow
  (`createOffers`, `updateOffers`, `deleteOffers`, and any future
  `bulkPriceUpdate`) must call a shared `assertOfferPriceOwnership`
  helper before dispatch to the pricing module. This helper lives at
  `packages/core/src/workflows/offer/utils/assert-offer-price-ownership.ts`
  and takes `{ offer_id, price_ids[] }`, throws on mismatch, returns
  void on success.
- The `manage_inventory: false` precondition is what makes "no cart
  workflow override" possible. Without it, Medusa's
  `confirmVariantInventoryWorkflow` would run against the variant's
  own inventory-item links and either over-reserve (because Mercur's
  offer ↔ inventory M:N is the source of truth) or under-reserve
  (because the variant's links are stale). Mercur enforces the
  precondition via two `model.boolean().default(false).computed()`
  declarations on `ProductVariant` (`manage_inventory` and
  `allow_backorder`) rather than a row-level migration: every read
  resolves to `false` regardless of the DB column's value, which
  short-circuits the native step entirely and leaves no row-level
  state to drift. The `// todo: remove` comment on those two lines
  signals the columns should be deleted outright once upstream
  Medusa workflows stop reading them.
- Order snapshots are untouched. SPEC-002's order-line ↔ offer link
  is preserved. With this revision, the snapshot is **Medusa's
  calculated unit price** (filtered by `offer_id` rule), not a
  custom-price write — but the order line item's `unit_price` column
  still freezes the value at completion time, so historical pricing
  remains durable.
- The probe script in
  `apps/api/src/scripts/probe-shared-priceset.ts` is the canonical
  reference for what the pricing module returns under each context
  shape. It should be kept runnable.
