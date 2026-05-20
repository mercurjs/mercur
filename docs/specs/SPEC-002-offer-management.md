---
status: in_progress
canonical: true
priority: 2
area: core/offers
created: 2026-05-19
last_updated: 2026-05-20  # foundation landed: offer module (model, service, migration), MercurModules.OFFER, the five cross-module links, the create/update/delete offer workflows, the vendor + admin offer API routes, and the first vendor offer integration test. Cart-integration overrides and inventory-lifecycle additions still pending.
---

# SPEC-002 Offer Management

> **2026-05-20 pricing-architecture migration.** Pricing is no longer
> threaded onto the master variant's shared `PriceSet` with an
> `offer_id` `PriceRule` discriminating per-offer rows. Each offer
> now **owns its own `PriceSet`**, referenced by a `price_set_id`
> column on the offer row and surfaced through a new
> `offer-price-set-link.ts` read-only link.
>
> **Cart-pricing simplification (the whole point of this migration).**
> Mercur does **one** thing in the cart path: inside its same-id
> override of `addToCartWorkflow`, it resolves each input item's
> `offer.price_set_id`, calls
> `pricingModule.calculatePrices({ id: priceSetIds }, { context })`
> once, and writes the result as `unit_price` + `is_custom_price=true`
> on the input items before the rest of Medusa's pipeline runs.
> That single move:
>
> - Skips Medusa's variant→priceset lookup
>   (`getVariantPriceSetsStep`) entirely, so the spec does not need
>   to override `getVariantsAndItemsWithPrices`,
>   `updateLineItemInCartWorkflow`, `refreshCartItemsWorkflow`, or
>   `createCartWorkflow`. Medusa honors the custom unit price on
>   every downstream path: refresh (`get-variants-and-items-with-prices.ts:184-220`
>   short-circuits `isCustomPrice`), qty updates
>   (`update-line-item-in-cart.ts:272-285` keeps `unit_price` and
>   `is_custom_price` when the existing line already has them), and
>   `prepareLineItemData` (`:140-193`) writes the value verbatim.
> - Reduces every cart refresh / qty change to **zero**
>   pricing-module calls. The price is computed once on add and
>   snapshotted onto the cart line until the line is removed.
> - Makes the Store API's product-list pricing the only other place
>   that calls `calculatePrices`, and that call is one bulk request
>   across all visible offers' `PriceSet`s.
>
> Deliberate trade-offs of snapshotting on add:
>
> - Tier pricing (`min_quantity` / `max_quantity` on `Price`)
>   resolves against the **add-time** quantity. A buyer who adds
>   qty 1 at $20 and then ups to qty 50 (where the $15 tier would
>   normally fire) keeps paying $20 until they remove + re-add the
>   line. Acceptable: marketplace vendors typically express one
>   price per offer.
> - Region / currency / customer-group changes mid-cart do **not**
>   reprice existing lines. The storefront treats region/currency
>   as set at cart-creation time; switching either requires the
>   buyer to recreate the cart.
> - PriceList activations / deactivations that fire after a line
>   is added do **not** retroactively reprice that line. Mercur's
>   promotion engine still applies adjustments on top of
>   `unit_price`, so percentage-off promotions continue to work;
>   only PriceList-based base-price changes are frozen.
>
> If any of these become limiting later, a follow-up spec can add a
> targeted "reprice line" endpoint that removes + re-adds the line
> through the same `addToCartWorkflow` path — keeping the simple
> snapshot model intact.
>
> The Notes, Pricing Architecture, F2 create flow, Cart Integration,
> Storefront API, Endpoint Contracts, and Workflows sections below
> all reflect the new shape. The variant's standard Medusa `PriceSet`
> is unused on Mercur cart/store paths; it remains legal as a
> non-marketplace fallback but is never consulted when resolving
> offer prices.

> **2026-05-19 follow-up.** Mercur's overridden product module
> (`packages/core/src/modules/product/`) has **removed**
> `manage_inventory` and `allow_backorder` from the `ProductVariant`
> model (see `Migration20260421093258` for the `manage_inventory`
> drop and `Migration20260422105949` for the `allow_backorder` drop,
> plus the
> `packages/core/src/modules/product/models/product-variant.ts`
> schema). `sku` is **retained** on the variant as a master-catalog
> identifier (with the standard `IDX_product_variant_sku_unique`
> unique partial index intact) and is deliberately separate from
> `offer.sku` (the per-seller vendor identifier — see **Identity
> model: two namespaces**); the offer module never reads
> `variant.sku` as a matching key on writes. The earlier draft of
> this spec assumed `manage_inventory` and `allow_backorder` existed
> and that the offer-create workflow would flip `manage_inventory`
> to `false` per variant. They are now structurally absent.
> **Inventory Lifecycle > Why Mercur owns the lifecycle** and
> **Invariant on offer-attached variants** have been rewritten below
> to reflect the new reality: Medusa's variant-inventory skip-points
> still fire — they trigger on the falsy/undefined value Query
> returns when the column does not exist — but the offer-create
> workflow no longer carries a `dismissProductVariantsInventoryStep`
> migration step, and there is no "one-way door" flag to defend. The
> contract is enforced by the schema itself. `patch-medusa.ts`
> (`packages/cli/src/utils/patch-medusa.ts`) gains the additional
> defensive workflow-field patches documented under
> **patch-medusa.ts: required additions for variant field removal**
> so Query calls inside upstream Medusa core-flows do not raise on
> the now-missing field paths
> (`items.variant.manage_inventory`,
> `items.variant.allow_backorder`,
> `items.variant.inventory_items.*`). `items.variant.sku` is **not**
> a missing path — `variant.sku` resolves normally and is consumed
> by the upstream Medusa fulfilment-line snapshot fallback
> (`create-fulfillment.ts:202,225`) without patching.


> **2026-05-19 revision.** The place-order path is owned by Mercur's
> existing `completeCartWithSplitOrdersWorkflow`
> (`packages/core/src/workflows/cart/workflows/complete-cart-with-split-orders.ts`)
> — its own name, its own composition, wired by the Mercur Store cart
> route at `POST /store/carts/:id/complete`. Medusa's
> `completeCartWorkflow` is **not** invoked in the Mercur process, and
> the offer module does **not** ship a same-id override of it. Every
> place-order extension this spec describes (validate-place stock check,
> offer-aware reservation, cart-line-item ↔ offer link mirror onto order
> line items) is composed **inline** into
> `completeCartWithSplitOrdersWorkflow` and reuses the `validate` hook
> already declared by that workflow. The same-id `overrideWorkflow`
> mechanism is still used for the upstream Medusa workflows Mercur does
> not own end-to-end: `addToCartWorkflow`, `updateLineItemInCartWorkflow`,
> `createFulfillmentWorkflow`, `cancelOrderWorkflow`,
> `cancelOrderFulfillmentWorkflow`, and
> `confirmReceiveReturnRequestWorkflow`.

This spec owns the **offer** layer: the commercial proposal that binds a
vendor to a specific product variant. It is the canonical contract for how
price, stock, shipping, and the buy button work in a Mercur marketplace.

Offers are deliberately thin. Pricing is delegated to Medusa's `pricing`
module: each offer **owns its own `PriceSet`** (referenced via
`offer.price_set_id`), and all of that offer's `Price` rows live on
that PriceSet directly — no rule-based discrimination against a shared
variant set. The master variant's standard Medusa `PriceSet` is **not**
consulted for marketplace cart or storefront pricing. Logistics are
delegated to Medusa's `fulfillment` module
through `ShippingProfile`. Sellers, variants, and inventory are owned by
their respective modules. The Offer module **does not duplicate** that
state. Reads are resolved via Medusa's Query engine through read-only
module links declared on each FK-shaped column; mutations to a linked
resource go through the owning module's service
(`IPricingModuleService`, `IFulfillmentModuleService`,
`IProductModuleService`, `IInventoryService`, plus Mercur's
`SellerService`). Resolved values are snapshotted onto order lines at
purchase time.

Offers have no status / approval / lifecycle field. An offer either
exists (created, not soft-deleted, with a positive **effective stocked
quantity** — the minimum of `stocked_quantity / required_quantity`
across all of its linked `InventoryItem`s) or it doesn't. A successful
create call makes the offer visible to the storefront immediately —
there is no `draft`, no `pending_validation`, no operator approval
queue.

This spec does not own: master variant identity, product attributes,
fulfilment execution, order placement, payouts, or commission computation.

## Why this exists

In a single-store world, `product → price` is enough — one merchant, one
commercial proposal per variant. In a marketplace, the same variant is
sold by N vendors, each with their own price, stock, and shipping rules.
Those decisions are not properties of "Nike Air Max 90 Black 42." They
are properties of **this vendor's offer to sell that variant**.

Mercur therefore splits the model:

- **Variant (master)** — descriptive identity owned by Medusa's product
  module. Title, options, weight, dimensions, GTIN-class identifiers
  (`ean`, `upc`, `barcode`, `hs_code`). Shared across all vendors.
- **Offer** — commercial proposal owned by Mercur. References one variant,
  one seller, one shipping profile, one price set, and **one or more
  inventory items** through Medusa's writable many-to-many `offer ↔
  inventory_item` link, with `required_quantity` carried on each link
  row — exactly the model Medusa uses to bind `ProductVariant` to
  `InventoryItem` (the `product_variant_inventory_item` link). The
  vendor selects the variant explicitly at offer-create time.
  The offer carries the vendor's own `sku`, and snapshots the variant's
  GTIN-class identifiers (`ean`, `upc`) as denormalized copies for
  vendor-side search and display.

The buy button binds to an **offer**, not a variant. Cart and order lines
carry `offer_id` and snapshot the resolved price at purchase time.

## Identity model: two namespaces

Two distinct identifiers travel with every offer. Mixing them up causes
the most common class of marketplace bugs (duplicated offers, lost stock,
miswired payouts), so the spec names them explicitly.

| Field         | Namespace                      | What it is                                                                                          | Source                              |
| ------------- | ------------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `sku`         | The seller's catalog           | The vendor's own internal ID for this listing. Free-form text the vendor controls.                  | Supplied by the vendor on write     |
| `ean` / `upc` | The universal product registry | GTIN-class identifier (EAN-13, UPC-A, ISBN). Identifies the *physical product* across all vendors.  | Copied from the chosen variant      |

Storefront customers never see `sku`; it exists for the vendor's own
catalog management. `ean`/`upc` belong to the master variant — the offer
holds a denormalized copy snapshotted at create time so vendor-side
search and list rendering don't need to join on every read. The offer
never uses `ean`/`upc` as a matching key on writes.

### Variant selection at create time

The vendor selects the master variant explicitly when creating an offer.
This mirrors the model Medusa uses to bind `ProductVariant` to
`InventoryItem` in `createProductVariantsWorkflow`: the link is created
from a known pair of IDs in the same workflow context, not from
SKU/GTIN string matching. The same idea applies to inventory: the offer
attaches one or more `InventoryItem`s by ID, each through an explicit
link row materialized by Medusa's link module.

Concretely, on every offer write:

1. The vendor's request carries an explicit `variant_id` chosen from the
   master catalog (bulk import flows are out of scope for this revision).
2. The workflow calls
   `productModuleService.retrieveProductVariant(variant_id, ...)` to
   confirm the variant exists, then reads its `ean` and `upc` and copies
   them onto the new offer record.
3. The offer is upserted keyed by `(seller_id, sku)`.

If `variant_id` does not resolve, the workflow fails with a standard
`404 NOT_FOUND` — no offer is created and no variant is auto-created.
Variant creation is owned by the product module; the offer module never
writes to it.

Two sellers may use the same `sku` independently — the uniqueness key is
**scoped to the seller**, not global. One seller can also have multiple
offers on the same variant (each with a distinct `sku`) to express, for
example, different package sizes; that's a vendor catalog decision and
the system does not interpret it.

## Product Scope

The first product scope **includes**:

- `Offer` entity owning identity and the cross-module reference fields
  (variant, seller, shipping profile, **price set**). The offer **owns
  its own `price_set_id`** — see the pricing-architecture section
  below.
- Cross-module references from `Offer` to `ProductVariant`, `Seller`,
  and `ShippingProfile`, plus the offer ↔ `InventoryItem` relationship.
  Reads are resolved by Medusa's Query engine via
  [module links](https://docs.medusajs.com/learn/fundamentals/module-links).
  The `Offer` → singleton-FK references (variant, seller, shipping
  profile) are declared as
  [read-only links](https://docs.medusajs.com/learn/fundamentals/module-links/read-only)
  on each foreign-key-shaped column. The offer ↔ inventory-item
  relationship is a **writable many-to-many link** declared via Medusa's
  internal `defineLink` (not read-only), with an `extraColumns.required_quantity`
  on the link's join table — exactly the same shape Medusa uses for its
  `product-variant-inventory-item` link. The join table is owned and
  managed by Medusa's link module; the offer module does not own a
  separate join entity. Default vendor flows create exactly one link row
  per offer with `required_quantity = 1`; bundle offers attach multiple
  inventory items via additional rows.
- Mutations to a linked resource go through the owning module's service
  (e.g. `IPricingModuleService.addPrices` / `updatePriceSets`,
  `IInventoryService.adjustInventory`). Mutations to the offer ↔
  inventory-item link itself (create row, dismiss row, edit
  `required_quantity`) go through Medusa's link service
  (`remoteLink.create` / `remoteLink.dismiss` / `createLinksWorkflow`).
- **Pricing delegated to the offer's own Medusa `PriceSet`.** Each
  offer owns a dedicated `PriceSet`, referenced by `offer.price_set_id`
  and surfaced through a read-only `offer.price_set` module link.
  Sibling offers on the same variant have entirely independent
  `PriceSet`s — there is no shared ladder and no rule-based
  discrimination. Currency, regional prices (`region_id` PriceRule),
  customer-group prices (`customer_group_id` PriceRule), and quantity
  tiers (`min_quantity` / `max_quantity` columns on `Price`) are
  expressed natively on the offer's own rows. Promotional windows reuse
  Medusa `PriceList`: each list contains `Price` rows that target
  specific offer `PriceSet`s directly. Mercur deliberately does not
  use `PriceListRule { attribute: "offer_id" }` because that would
  reintroduce per-line context variance in the cart and break the
  single-bulk-`calculatePrices` invariant. See the **Pricing
  Architecture** section below.
- Logistics delegated to Medusa `ShippingProfile` (one profile per offer).
  Zones, carriers, and rates live as `ShippingOption` + `ServiceZone`
  records under that profile.
- **Stock delegated to Medusa `InventoryItem` (one or more items per
  offer).** Each offer attaches one or more `InventoryItem`s through
  Medusa's writable `offer ↔ inventory_item` link (each link row
  carries `required_quantity`, default `1`). Stocked quantities and
  per-location levels live on
  `InventoryItem` + `InventoryLevel`. The offer module never stores a
  stock column of its own. The offer's **effective stocked quantity** is
  `MIN(floor(stocked_quantity / required_quantity))` across all linked
  items — the same computation Medusa runs for a variant's availability.
- Vendor-driven offer CRUD, one offer at a time, scoped to the vendor's
  own catalog. Every write carries an explicit `variant_id` selected by
  the vendor from the master catalog.
- Store API surfacing of the **full offers list** per `(variant,
  customer_group, region)` context. The Store API never picks a winner
  — it returns every visible offer in stable order and the storefront
  decides which one to bind the buy button to. Cart writes require an
  explicit `offer_id`; there is no server-side fallback.
- Atomic stock decrement on order placement via the inventory module's
  `adjustInventory(...)` against **each** linked `InventoryItem`, scaled
  by its `required_quantity`, in a single transactional batch.
- Soft-delete; order-line snapshots keep historical references intact.

The first product scope **explicitly excludes** (the simplification pass
in this revision):

- An explicit state machine (`draft`, `pending_validation`, `active`,
  `suspended`, `expired`, etc.). An offer either exists (visible if it
  has stock and isn't soft-deleted) or it doesn't.
- Validity windows (`available_start_date` / `available_end_date`),
  suspension flows, SLA-driven auto-suspension, and operator-initiated
  reactivation. These can be reintroduced in a follow-up spec.
- Warranty, compliance metadata (GPSR, age-gating, ID checks), visibility
  groups, customer-group restrictions, pickup options, and FBM markers.
- Direct price/currency/discount fields on the offer row (all expressed
  through `Price` rows on the offer's own `PriceSet`, referenced by
  `offer.price_set_id`).
- **Offer import.** Vendor-facing bulk catalog upload (CSV/feed imports)
  and high-frequency repricer endpoints are deliberately out of scope for
  this revision. They are valuable workflows for any mature marketplace
  and can be added in a future spec; this revision deliberately keeps the
  surface to single-offer writes so the data model and access patterns
  settle first.

The first product scope also **excludes** functionality owned by adjacent
modules: master variant CRUD, commission/payout computation, returns,
refunds, claims.

## Domain Model

A new core module `offer` lives at `packages/core/src/modules/offer/`
and owns one entity: `Offer`. Foreign-key-shaped columns on `Offer`
(`variant_id`, `seller_id`, `shipping_profile_id`, `price_set_id`)
are **plain text columns**. `price_set_id` references the offer's own
dedicated `PriceSet` in Medusa's pricing module; it is created
together with the offer row and torn down (along with all its `Price`
rows) when the offer is hard-deleted. Soft-delete (the default
delete path) leaves the `PriceSet` and its `Price` rows intact so
historical order-line resolutions still work (see the **Pricing
Architecture** section).
Inventory items are attached through Medusa's link module — the
`offer ↔ inventory_item` link is a writable many-to-many link with an
`extraColumns.required_quantity` on its join table, mirroring Medusa's
`product-variant-inventory-item` link. The join table is owned by
Medusa's link module, not by the Offer module; the offer module never
declares a join entity of its own. The Offer module never writes to
another module's tables directly: reads go through the Query engine
via module links, and mutations go through the owning module's service
(or through Medusa's link service for the link itself).

### Cross-module references

Each singleton foreign-key-shaped column on `Offer` is declared as a
**read-only link** to the owning module's data model (see Medusa's
[read-only module links](https://docs.medusajs.com/learn/fundamentals/module-links/read-only)).
The offer ↔ inventory-item relationship is declared as a **writable
many-to-many** [module link](https://docs.medusajs.com/learn/fundamentals/module-links)
via Medusa's internal `defineLink` helper with `database.extraColumns.required_quantity`
on the join table — the exact same shape Medusa uses for its
`product-variant-inventory-item` link. The link module materializes and
owns the `offer_inventory_item` join table; the offer module declares
the link but does not own the table.

Link definitions live under `packages/core/src/links/` alongside the
rest of Mercur's cross-module links (e.g.
`offer-shipping-profile-link.ts`, `offer-variant-link.ts`,
`offer-seller-link.ts`, `offer-inventory-item-link.ts`,
`offer-price-set-link.ts`), not inside the offer module folder.
`offer-price-set-link.ts` declares a read-only link
`OfferModule.linkable.offer.priceSet ↔ PricingModule.linkable.priceSet`
on the `price_set_id` column so Query can resolve `offer.price_set` /
`offer.price_set.prices` in a single traversal. The naming follows the
existing convention seen in `inventory-item-seller-link.ts`. Each link
exposes the relationship to Medusa's Query engine. Reads — including
the Store API's variant-with-offers response and the vendor/admin
offer endpoints — go through Query and let the framework populate
`seller`, `shipping_profile`, `variant`, `price_set` (and its `prices`
collection), and the `inventory_items` collection (each entry
carrying `inventory_item_id`, `required_quantity`, and the nested
`inventory.location_levels` field chain) transparently from the IDs
on the offer row and the join rows. Writes to the link itself
(attach, detach, change `required_quantity` on the inventory link)
go through Medusa's link service via `createLinksWorkflow` /
`dismissLinksWorkflow`; the offer ↔ price-set link is read-only and
mirrors the `offer.price_set_id` column.

Mutations to a linked resource go through the owning module's service.
Service references are resolved through Medusa's standard module
container (`resolve(Modules.PRICING)`, `resolve(Modules.FULFILLMENT)`,
etc.) inside workflow steps; the offer service itself does not import
other modules' code paths directly.

| Field on Offer                  | Owning module        | Read path                                                          | Mutation path (service)                                                |
| ------------------------------- | -------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `variant_id`                    | Medusa product       | Read-only link `offer.variant` resolved via Query                  | Variant CRUD is **not** an offer concern (product module owns it)      |
| `seller_id`                     | Mercur seller        | Read-only link `offer.seller` resolved via Query                   | Seller CRUD is **not** an offer concern (`SellerService` owns it)      |
| `shipping_profile_id`           | Medusa fulfillment   | Read-only link `offer.shipping_profile` resolved via Query         | `IFulfillmentModuleService.updateShippingProfiles` (when applicable)   |
| `price_set_id`                  | Medusa pricing       | Read-only link `offer.price_set` resolved via Query (each offer owns its own `PriceSet`; its `prices` collection is the offer's full ladder) | `IPricingModuleService.addPrices` / `updatePriceSets` / `removePrices` scoped to `offer.price_set_id` — no `offer_id` `PriceRule` needed. Resolved reads via `calculatePrices({ id: [offer.price_set_id, ...] }, { context })` — `offer_id` is **not** in the context |
| `inventory_items[].inventory_item_id` (link rows, 1..N) | Medusa inventory | Writable many-to-many link `offer.inventory_items` (each entry carries `required_quantity`); resolved via Query | Link CRUD via `createLinksWorkflow` / `dismissLinksWorkflow`; stock via `IInventoryService.adjustInventory` / `retrieveStockedQuantity` per linked item |

Medusa's 1:1 `ProductVariant ↔ PriceSet` pattern is reused **at the
offer level instead of the variant level**: every offer has exactly
one `PriceSet`, and **all** of that offer's prices live as `Price`
rows on it. Sibling offers on the same variant own independent
`PriceSet`s and never see each other's rows. On offer-create the
workflow calls `pricingModuleService.createPriceSets(...)` to
establish the per-offer `PriceSet` and stamps its id onto
`offer.price_set_id`; price edits on that offer call
`pricingModuleService.addPrices(...)` / `updatePriceSets(...)` /
`removePrices(...)` scoped to that `price_set_id`. Tiered pricing is
multiple `Price` rows on the offer's own `PriceSet` using the native
`min_quantity` / `max_quantity` columns. Currency is the
`currency_code` on each `Price`. Region and customer-group targeting
attach `PriceRule` records (`region_id`, `customer_group_id`) to the
relevant rows. Promotional windows route through `PriceList` (see
**Pricing Architecture** for the two patterns). Resolved price reads
on the Store API go through
`pricingModuleService.calculatePrices({ id: priceSetIds }, { context })`
with the active `(region_id, currency_code, customer_group_id,
quantity)` context — `offer_id` is **not** in the context, because
every candidate `PriceSet` already belongs to a single offer.

The 1:1 reference to `ShippingProfile` is the canonical pattern for "this
thing ships under these rules." Service zones, carriers, and rates remain
on the profile and its `ShippingOption` rows, and are read through
`fulfillmentModuleService.retrieveShippingProfile(...)` /
`listShippingOptions(...)`.

### Pricing Architecture

Mercur reuses Medusa's 1:1 priceset shape **at the offer level**:
every offer owns a single dedicated `PriceSet`, referenced by
`offer.price_set_id`. Sibling offers on the same master variant
have independent `PriceSet`s. No `offer_id` `PriceRule` exists; no
trigger constrains rows across offers; no "shared PriceSet" model
ever needs to be reconciled with offer ownership.

`pricingModuleService.calculatePrices({ id: priceSetIds }, { context })`
is called against the offer's own `PriceSet`. The context carries
only `(region_id, currency_code, customer_group_id, quantity)` —
the standard Medusa pricing context, identical to what a single-store
Medusa app would pass. The candidate set is every `Price` row on
the offer's own `PriceSet`; cross-offer leakage is structurally
impossible because there are no foreign offer rows on that
`PriceSet` to begin with.

Bulk reads — Store product list, cart refresh — collect every
visible offer's `price_set_id` and issue **one** `calculatePrices`
call with the full array of priceSetIds. Medusa's pricing module
already returns one calculated price per priceset id in that call
(see `pricingModule.calculatePrices({ id: [...] }, ...)` and the
group-by-`price_set_id` resolver in `pricing-module.ts:391-460`).
The store reading every offer for a variant and the cart pricing
every line therefore both collapse to a **single** pricing-module
round-trip, regardless of how many offers / lines participate.

#### Shape

```
PriceSet ps_Y (owned by offer off_Y, offer.price_set_id = ps_Y)
 ├─ Price 20.00 usd
 ├─ Price 18.00 usd min_q 10
 ├─ Price 15.00 usd min_q 50
 └─ Price 17.50 eur               price_rules: [{ region_id = reg_EU }]

PriceSet ps_Z (owned by offer off_Z, offer.price_set_id = ps_Z)
 ├─ Price 25.00 usd
 └─ Price 22.00 usd min_q 20
```

Each vendor's offer owns an entirely independent ladder of `Price`
rows on its own `PriceSet`. Currency, region, customer-group, and
quantity-tier discrimination compose on those rows exactly as in
single-store Medusa.

#### PriceLists and promotions

Promotional windows reuse Medusa `PriceList`. The mechanism is the
same as in single-store Medusa: a `PriceList` contains `Price` rows,
each targeting a specific `price_set_id`. To run a vendor sale across
multiple of the vendor's offers, the PriceList carries one `Price`
row per offer's `PriceSet` (each at the discounted amount + currency,
with optional region / customer-group rules). The list's own
`rules` field is used for non-offer gating — campaign start/end,
customer group, region — never for `offer_id` discrimination.

Mercur does **not** use a `PriceListRule { attribute: "offer_id",
value: [...] }` to gate lists, because doing so would require
`offer_id` in the calculation context and would force the cart to
split pricing into per-offer groups (one `calculatePrices` round-
trip per unique offer). Instead, the list naturally applies only to
the offers whose `PriceSet`s it contains rows for — no rule, no
context coupling, no perf cost.

`pricingModuleService.calculatePrices(...)` groups by `price_set_id`,
picks one `priceListPrice` + one `defaultPrice` per group, and
applies the standard SALE (lowest of the two) / OVERRIDE (always
list) logic (`pricing-module.ts:391-460`). Because every candidate
`PriceSet` belongs to a single offer, the SALE comparison always
operates inside that offer's own ladder — no cross-offer
contamination.

#### Mutation contract

All offer-pricing writes go through Medusa's pricing module service
scoped to `offer.price_set_id`:

```ts
// On offer create — the workflow creates a fresh PriceSet via
// pricingModule.createPriceSets(...), stamps its id onto
// offer.price_set_id, and seeds the offer's initial Price rows on
// that PriceSet. No offer_id PriceRule is attached.
const [{ id: priceSetId }] = await pricingModule.createPriceSets([
  {
    prices: [
      { amount, currency_code, rules: { region_id?, customer_group_id? } },
      { amount, currency_code, min_quantity, max_quantity },
    ],
  },
])
// → offer row inserted with { price_set_id: priceSetId, ... }

// On offer update — every read/write targets the offer's own PriceSet.
const existing = await pricingModule.listPrices({
  price_set_id: offer.price_set_id,
})
pricingModule.updatePriceSets(...) // or removePrices + addPrices

// On offer soft-delete — the PriceSet and its Price rows are left
// intact so historical order-line snapshots can still resolve the
// row by id. The offer row's deleted_at hides the offer from reads.
//
// On offer hard-delete (operator-driven termination) — the workflow
// also deletes the PriceSet:
pricingModule.deletePriceSets([offer.price_set_id])
```

The offer module never touches another offer's `PriceSet`. The
`price_set_id` foreign key is the access-control key — vendor and
admin batch endpoints resolve a target `price.id` only when its
`price_set_id === offer.price_set_id`, and reject any id outside
that scope with `MedusaError.Types.NOT_FOUND`.

### Inventory Lifecycle

Medusa's variant-scoped inventory model (`manage_inventory` on
`ProductVariant`, the `product_variant_inventory_item` link, and the
reserve / decrement / restock steps baked into `cart`, `fulfillment`,
and `return` workflows) is **deliberately disabled on every variant
that backs at least one Mercur offer**. Mercur owns the lifecycle
end-to-end against the writable `offer ↔ inventory_item` link instead.
This section is the normative contract for that lifecycle. F3 in
**Offer Flows** is a high-level sketch; this section supersedes it.

#### Why Mercur owns the lifecycle

A variant sold by multiple vendors does not have *a* stock — it has
*N* stocks, one per offer, each backed by its own `InventoryItem`(s).
Medusa's variant-level model can express only one stock per variant,
selected through `variant.inventory_items` at confirmation /
reservation / fulfilment time. Leaving Medusa's variant-scoped
inventory model live on a marketplace-shared variant forces Medusa to
pick the wrong inventory items (the variant's defaults) for every
offer.

Mercur disables Medusa's variant-scoped inventory model **at the
schema level** rather than at the row level: the overridden
`ProductVariant` model in `packages/core/src/modules/product/models/`
**has no `manage_inventory` or `allow_backorder` columns**. The
columns have been dropped by
`packages/core/src/modules/product/migrations/Migration20260421093258.ts`
(drops `manage_inventory`) and
`packages/core/src/modules/product/migrations/Migration20260422105949.ts`
(drops `allow_backorder`; `sku` is retained on the variant as a
master-catalog identifier and is unrelated to the inventory
skip-points discussed here). Every Query read of `manage_inventory`
or `allow_backorder` against Mercur's product module therefore yields
`undefined`. The
four Medusa skip-points that the spec relies on key off truthy checks
against those fields, and every one of them resolves to "skip" when
Query returns `undefined`:

- `core-flows/cart/utils/prepare-confirm-inventory-input.ts:171`
  (`!hasManagedInventory && variants.manage_inventory`) — `undefined`
  is falsy, so `hasManagedInventory` stays `false` and the function
  returns `{ items: [] }` at line 184.
- `core-flows/cart/utils/prepare-confirm-inventory-input.ts:237`
  (`if (!variant?.manage_inventory) return`) — fires, the line is
  dropped from the confirmation set.
- `core-flows/order/workflows/create-fulfillment.ts:300`
  (`if (item.variant?.manage_inventory) throw ...`) — falsy, the
  throw is skipped and the iteration `continue`s past the
  per-line adjust.
- `core-flows/order/workflows/return/confirm-receive-return-request.ts:115`
  (`if (!variant?.manage_inventory) return`) — fires, the restock
  branch is skipped.
- `core-flows/cart/workflows/list-shipping-options-for-cart.ts:249`
  (`if (!item.variant?.manage_inventory) return`) — fires, the
  per-line inventory branch is skipped.

The behaviour is therefore identical to the earlier draft's
"`manage_inventory=false` everywhere" plan, but stronger: the column
is structurally absent, so there is no value to accidentally set back
to `true`, no audit row that could flip it, and no Medusa workflow
input shape (even one that explicitly writes `manage_inventory: true`)
that can re-introduce it — MikroORM filters unknown properties on
persist against Mercur's schema.

Once Medusa skips all four lifecycle paths, Mercur must implement all
four — see **Per-event contracts**.

#### Invariant on offer-attached variants

Every variant in Mercur's catalog **lacks** `manage_inventory` and
`allow_backorder` by virtue of the overridden schema (`sku` is
retained on the variant as a master-catalog identifier — see the
follow-up callout at the top of this spec). The invariant is
therefore an invariant of the product module itself, not
a per-row precondition the offer module has to assert and migrate.
The previous draft's "the offer-create workflow flips the flag via
`updateProductVariantsWorkflow` and `dismissProductVariantsInventoryStep`
runs as a side effect" is **obsolete**:

- The offer-create workflow performs **no** variant-update step. It
  no longer needs one.
- `updateProductVariantsWorkflow` →
  `dismissProductVariantsInventoryStep`
  (`core-flows/product/steps/update-product-variants.ts:157-181`) is
  never triggered by offer-create. It is still a Medusa-internal step
  that may run when an operator manually updates a product variant
  through the (Mercur-disabled) admin product routes, but on Mercur
  the `manage_inventory` field is not part of the input DTO so the
  step's predicate
  (`Object.hasOwn(variant, "manage_inventory") && !variant.manage_inventory`)
  never matches.
- The `product_variant_inventory_item` link table is still registered
  by Medusa's link-modules package (it joins `Modules.PRODUCT` and
  `Modules.INVENTORY` independently of Mercur's product module).
  Marketplace-shared variants never accumulate rows in it because
  Mercur's `createProductVariantsWorkflow` override does not wire
  inventory items to variants — all inventory wiring goes through the
  `offer ↔ inventory_item` link instead. A Query traversal of
  `variant.inventory_items` against a Mercur variant therefore
  returns `[]`, which is what the confirmInventory / fulfilment /
  restock branches expect for a `manage_inventory=false`-style
  variant.

`variant.sku` is **retained** on Mercur's variant (master-catalog
identifier, kept for parity with Medusa's variant search/identity
patterns and consumed by the upstream fulfilment-line snapshot
fallback `orderItem.variant_sku || ""` at
`core-flows/order/workflows/create-fulfillment.ts:202,225`). It is
**not** the SKU shown to vendors or used for offer identity. Mercur's
storefront and vendor surfaces read the SKU snapshot Mercur writes
onto the cart and order line via `decorateLineItemWithOffer` (sourced
from `offer.sku`); the per-seller uniqueness key remains
`(seller_id, offer.sku)` as documented in **Identity model: two
namespaces** and **Uniqueness and indexes**. The offer module never
matches writes by `variant.sku` and never copies `variant.sku` onto
the offer record.

#### patch-medusa.ts: required additions for variant field removal

`packages/cli/src/utils/patch-medusa.ts` already disables Medusa's
admin and store product/product-variant/product-category route
trees (so the routes that would have written `manage_inventory: true`
into a Medusa-shaped variant DTO are unreachable). It also strips
`Modules.PRODUCT` from `SERVICES_INTERFACES` so the generated
modules-bindings type uses Mercur's product service type.

The field removal introduces one additional class of risk: upstream
Medusa core-flows that build a `useQueryGraphStep` field list
including `items.variant.manage_inventory`,
`items.variant.allow_backorder`,
`items.variant.inventory_items.inventory_item_id`,
`items.variant.inventory_items.required_quantity`, or the
`items.variant.inventory_items.inventory.*` chain. (`items.variant.sku`
is **not** in this risk list — `variant.sku` is retained on the
Mercur schema and resolves normally.) The Mercur process runs these
workflows against a Query layer whose `ProductVariant` entity no
longer declares the listed fields and whose
`product_variant_inventory_item` link table is empty for
marketplace-shared variants.

Two outcomes are possible at runtime, depending on Query's behaviour:

1. **Query tolerates unknown attribute fields and resolves
   `variant.inventory_items` against the empty link table.** Every
   read returns `undefined` / `[]`, every Medusa skip-point fires,
   and no patch is required. This is the expected behaviour because
   Medusa's joiner-based Query selects attributes via MikroORM, which
   does not validate the requested field list against the entity
   schema — missing columns simply do not appear in the result row.
2. **Query throws on unknown attribute paths.** In that case Mercur
   must strip the offending references from the affected compiled
   core-flow JS at install/migrate time, in the same shape as the
   existing middleware and route disables. The candidate files are:

   - `node_modules/@medusajs/core-flows/dist/cart/utils/prepare-confirm-inventory-input.js`
     (field lists `requiredOrderFieldsForInventoryConfirmation` and
     `requiredVariantFieldsForInventoryConfirmation`)
   - `node_modules/@medusajs/core-flows/dist/cart/utils/fields.js`
     (the variant inventory paths embedded in the cart-level field
     lists)
   - `node_modules/@medusajs/core-flows/dist/cart/workflows/confirm-variant-inventory.js`
   - `node_modules/@medusajs/core-flows/dist/cart/workflows/list-shipping-options-for-cart.js`
     (the inline `useQueryGraphStep` field array)
   - `node_modules/@medusajs/core-flows/dist/order/utils/fields.js`
   - `node_modules/@medusajs/core-flows/dist/order/workflows/create-fulfillment.js`
     (the inline `items.variant.*` field array passed to
     `useQueryGraphStep`)
   - `node_modules/@medusajs/core-flows/dist/order/workflows/cancel-order-fulfillment.js`
   - `node_modules/@medusajs/core-flows/dist/order/workflows/return/confirm-receive-return-request.js`

   The patch strips only the field-path strings; the surrounding
   logic (the `manage_inventory`-keyed branches) is preserved because
   it already short-circuits cleanly on `undefined`. The mechanism
   mirrors the existing patches in `patch-medusa.ts`: read the file,
   `replace` the field-path string lines with the empty string, write
   the file back. The patched files live alongside the existing
   disable bodies under `packages/cli/src/utils/patched/`.

Verification (one integration test, added under
`integration-tests/http/offer/store/cart-inventory.spec.ts`):

- run `addToCartWorkflow` against a cart with one Mercur offer line;
  assert no `MedusaError` is raised by the Query step preceding
  `confirmInventoryStep`;
- run `completeCartWithSplitOrdersWorkflow` end-to-end against the
  same cart and assert the order is created without any
  `Field "manage_inventory" not found` / equivalent error;
- run `createFulfillmentWorkflow` against the resulting order and
  assert the same.

If the test passes without patching, **(1)** holds and the additions
to `patch-medusa.ts` listed above are unnecessary. If it fails with
an unknown-field error, **(2)** holds and the patches must ship.
Either way the spec moves to `passing` only when the test passes.

Mercur's own copies of the inventory-field utilities
(`packages/core/src/workflows/cart/utils/prepare-confirm-inventory-input.ts`,
`packages/core/src/workflows/cart/utils/fields.ts`,
`packages/core/src/workflows/cart/workflows/list-seller-shipping-options-for-cart.ts`)
already query the same `variant.manage_inventory` /
`variant.inventory_items.*` paths. Because Mercur owns those files
directly, the offer implementation must — at the same time as it
introduces `prepareOfferInventoryInput` — replace those upstream
references with offer-aware reads via the `line_item.offer.*` and
`offer.inventory_items.*` field chains. No `patch-medusa.ts` change
is needed for the Mercur-owned copies; they are edited in place.

**Specifically (today's state, must be fixed):**

- `packages/core/src/workflows/cart/utils/fields.ts` —
  `completeCartFields` currently lists
  `items.variant.manage_inventory` and
  `items.variant.allow_backorder`. Both fields no longer exist on
  Mercur's `ProductVariant` schema (dropped by
  `Migration20260421093258.ts` and `Migration20260422105949.ts`).
  Replace with offer-aware fields:
  `items.offer.id`, `items.offer.price_set.id`,
  `items.offer.inventory_items.required_quantity`,
  `items.offer.inventory_items.inventory.location_levels.*`.
- `packages/core/src/workflows/cart/utils/prepare-line-item-data.ts`
  — must stamp the cart line-item id onto the order line via
  `metadata.cart_line_item_id` so
  `mirrorLineItemOfferLinksToOrderStep` can match cart-line ↔
  order-line after `createOrdersStep` regenerates ids (see
  **Cart→order line identity gotcha** under
  `linkLineItemToOfferStep`). `offer_id` itself stays off the line
  item; the cart-side link row is the canonical pointer until the
  mirror step writes the order-side link.
- `packages/core/src/workflows/cart/utils/prepare-confirm-inventory-input.ts`
  — replace variant-keyed inventory resolution with offer-keyed
  resolution per the `prepareOfferInventoryInput` shape documented
  in **Reusing Medusa's inventory primitives**.

#### Effective availability

The offer's **effective available quantity** at a stock location is

```
MIN_over_links(
  floor((stocked_quantity − reserved_quantity) / required_quantity)
)
```

read through Query off
`offer.inventory_items[].inventory.location_levels[]`, scoped to the
stock locations that serve the active sales channel (and, for the
Store API filter, the region). `required_quantity` comes from the
live link row; `stocked_quantity` and `reserved_quantity` come from
Medusa's `InventoryLevel`.

#### Reusing Medusa's inventory primitives

Mercur does **not** introduce wrapper steps around Medusa's inventory
steps. The Medusa steps are called **directly** from the Mercur
cart/order workflow integration points; the only Mercur-owned
inventory code is a single utility function that prepares offer-shaped
input for them. Medusa keeps owning every byte of inventory state
mutation — locking, batched DB writes, per-step compensation.

Steps Mercur calls directly (no wrappers):

| Medusa step (path) | Used for |
| --- | --- |
| `confirmInventoryStep` (`core-flows/cart/steps/confirm-inventory.ts:63-101`) | validate (add / qty update / place) |
| `reserveInventoryStep` (`core-flows/cart/steps/reserve-inventory.ts:61-116`) | reserve on order placement |
| `adjustInventoryLevelsStep` (`core-flows/inventory/steps/adjust-inventory-levels.ts:27-90`) | decrement on fulfilment, restock on return / fulfilment cancel |
| `deleteReservationsByLineItemsStep` (`core-flows/reservation/steps/delete-reservations-by-line-items.ts:16-50`) | release on cancel before fulfilment |

Why **not** reuse `confirmVariantInventoryWorkflow` end-to-end (the
natural first instinct):

- Its input pipeline (`prepareConfirmInventoryInput`,
  `prepare-confirm-inventory-input.ts:234-281`) deduplicates the
  input by `variant_id` and filters inventory items by
  `variant_id === item.variant_id`. Two cart lines on the same
  variant but from different offers — the canonical marketplace
  case — collapse into one variant row carrying a single
  `inventory_items` set, exactly the resolution the offer model is
  designed to break.
- Its variant-fetch precondition (`getVariantsAndItemsWithPrices`)
  selects `variant.inventory_items.*` through the
  `product_variant_inventory_item` link, which is empty for every
  marketplace-shared variant (Mercur's `createProductVariantsWorkflow`
  override never wires inventory items to variants). Because Mercur's
  overridden `ProductVariant` schema has dropped `manage_inventory`
  entirely (see **Why Mercur owns the lifecycle**), Query returns
  `undefined` for `variant.manage_inventory` and the workflow
  short-circuits at `prepare-confirm-inventory-input.ts:184-186`
  (`hasManagedInventory` stays `false`) and writes nothing.

So `confirmVariantInventoryWorkflow` cannot be the entry point, but
the steps inside it can be called unchanged. Mercur invokes the
lower-level steps directly with an offer-aware payload.

What makes this clean: `confirmInventoryStep`, `reserveInventoryStep`,
`adjustInventoryLevelsStep`, and `deleteReservationsByLineItemsStep`
are **fully variant-agnostic**. Their inputs carry no variant
identity at all — only `inventory_item_id`, `required_quantity`,
`quantity`, `location_ids`, `allow_backorder` (and `id` =
`line_item_id` for the reserve step), or just `line_item_id[]` for
the release step. The variant scoping lives entirely in
`prepareConfirmInventoryInput`, not in the steps it feeds. Replace
the preparation, the steps run on offer-shaped input without changes.

The only Mercur-owned inventory code:

```ts
// packages/core/src/workflows/offer/utils/prepare-offer-inventory-input.ts
//
// Output type is identical to Medusa's prepareConfirmInventoryInput
// output (the input type of confirmInventoryStep and
// reserveInventoryStep). Input is offer-aware: cart lines expose
// their offer through Medusa Query via the cart.LineItem ↔ Offer
// link, and the offer.inventory_items[] link is resolved through
// the same Query call.

export const prepareOfferInventoryInput = (data: {
  input: {
    sales_channel_id?: string
    items: Array<{
      id?: string
      variant_id?: string | null
      quantity: BigNumberInput
      offer?: { id: string } | null  // populated by Query through the LineItem ↔ Offer link
    }>
    offers: Array<{
      id: string
      inventory_items: Array<{
        inventory_item_id: string
        required_quantity: number
        inventory: {
          location_levels: Array<{
            location_id: string
            stocked_quantity: BigNumberInput
            reserved_quantity: BigNumberInput
            stock_locations: { id: string; sales_channels: { id: string }[] }[]
          }>
        }
      }>
    }>
  }
}): { items: ConfirmInventoryItem[] } => {
  // 1. Walk offers.inventory_items.inventory.location_levels.stock_locations
  //    to build (offer_id, inventory_item_id, location_id) → availability
  //    and the per-channel allowed location set (deepFlatMap, mirroring
  //    prepareConfirmInventoryInput).
  // 2. For each cart item, look up its offer by item.offer.id
  //    (resolved by Query through the LineItem ↔ Offer link — NOT
  //    by variant_id; this is the only resolution swap).
  // 3. For each linked inventory item on that offer, push one entry with
  //    the prioritized location_ids array (full-availability → any-level
  //    → channel locations) — same selection algorithm Medusa uses.
}
```

The Mercur cart/order integration points then call the Medusa steps
directly, with this prepared input. Three attach mechanisms are used,
picked per event based on which workflow owns the path:

1. **A hook handler on an upstream Medusa workflow's `hooks.validate`**
   for the read-only stock check on add / qty-update.
2. **Inline composition inside a Mercur-owned workflow** — for the
   place-order path, which is owned by Mercur's
   `completeCartWithSplitOrdersWorkflow`
   (`packages/core/src/workflows/cart/workflows/complete-cart-with-split-orders.ts`).
   The pre-flight stock check is attached via the `validate` hook that
   workflow already declares, and the offer-aware
   `reserveInventoryStep(transform(input, prepareOfferInventoryInput))`
   is composed **inline** into the workflow body, replacing the
   variant-shaped reservation call that workflow makes today. No
   same-id override is involved because Medusa's `completeCartWorkflow`
   is not invoked by the Mercur Store cart route.
3. **A same-id override of an upstream Medusa workflow via
   `overrideWorkflow`** (`packages/core/src/workflows/utils/override-workflow.ts`),
   which `WorkflowManager.unregister(id)`s the upstream workflow before
   re-registering Mercur's same-name replacement. Used for
   `addToCartWorkflow`, `updateLineItemInCartWorkflow`,
   `createFulfillmentWorkflow`, `cancelOrderWorkflow`,
   `cancelOrderFulfillmentWorkflow`, and
   `confirmReceiveReturnRequestWorkflow` — workflows Mercur does not
   own end-to-end.

See **How Mercur attaches to the workflows** below for which mechanism
is used per event.

Example shape, for reservation on order placement (composed inline
inside Mercur's `completeCartWithSplitOrdersWorkflow`, replacing the
variant-shaped `reserveInventoryStep(formatedInventoryItems)` call that
workflow currently makes):

```ts
const prepared = transform({ input }, prepareOfferInventoryInput)
const reservations = reserveInventoryStep(prepared)
```

No new locking logic. No new compensation handler. No new
`createReservationItems` call. The reservation *is* Medusa's
reservation, fed an offer-shaped batch.

#### Per-event contracts

The table is normative. Every event lists the Medusa workflow it
attaches to, the attach point, the Medusa step called directly with
offer-prepared input, and the resulting behavior.

| Event | Triggered by | Medusa attach point | Medusa step called | Behavior |
| --- | --- | --- | --- | --- |
| Validate (add) | `addToCartWorkflow` | `hooks.validate` (throws to abort) | `confirmInventoryStep(transform(input, prepareOfferInventoryInput))` | read-only check that each linked item satisfies `(stocked − reserved) ≥ qty × required_quantity` in at least one location serving the cart's sales channel; failure throws Medusa's native `MedusaError.Codes.INSUFFICIENT_INVENTORY` directly from `confirmInventoryStep` |
| Validate (qty update) | `updateLineItemInCartWorkflow` | `hooks.validate` | `confirmInventoryStep(...)` | same; fires on quantity-up only |
| Validate (place) | `completeCartWithSplitOrdersWorkflow` (Mercur-owned) | `hooks.validate` (already declared by the Mercur workflow) | `confirmInventoryStep(...)` | final guard before reservation |
| Reserve | `completeCartWithSplitOrdersWorkflow` (Mercur-owned) | **inline composition** — replaces the variant-shaped `reserveInventoryStep(formatedInventoryItems)` call the workflow makes today (no `overrideWorkflow` needed because Medusa's `completeCartWorkflow` is not invoked) | `reserveInventoryStep(transform(input, prepareOfferInventoryInput))` | one batched `createReservationItems` call inside the inventory-item lock, N reservations per line (one per linked inventory item, `quantity = line.qty × required_quantity`) |
| Decrement | `createFulfillmentWorkflow` | workflow wrap (Medusa's own adjust path no-ops because no reservations exist on Mercur variants — `variant.manage_inventory` is `undefined` under the overridden product module, see **Why Mercur owns the lifecycle**) | `adjustInventoryLevelsStep([...negative adjustments per linked item])` + reservation update/delete via inventory service | mirrors `create-fulfillment.ts:289-348` — for each fulfilled line, push one negative adjustment per linked item, then update remaining-reserved or delete the reservation row |
| Release | `cancelOrderWorkflow` (cancel before fulfilment) | workflow wrap | `deleteReservationsByLineItemsStep(line_item_ids)` | passes line ids straight through — Medusa bulk-deletes all N reservations per line; no `adjustInventory` call (stocked never moved) |
| Restock (return) | `confirmReceiveReturnRequestWorkflow` | workflow wrap (Medusa's restock branch is skipped because `variant.manage_inventory` is `undefined` under Mercur's product module, see **Why Mercur owns the lifecycle**) | `adjustInventoryLevelsStep([...positive adjustments per linked item])` | for each returned line, push one positive adjustment per linked item at the return's `location_id` |
| Restock (fulfilment cancel) | `cancelOrderFulfillmentWorkflow` | workflow wrap | `adjustInventoryLevelsStep(...)` | symmetric to return restock; uses the fulfilment's origin location |

`offer_id` lives on the writable `cart.LineItem ↔ Offer` link row
(written by `linkLineItemToOfferStep` at add-to-cart, dismissed on
line-item removal, and mirrored onto the writable
`order.OrderLineItem ↔ Offer` link at cart-complete) — a real
relation, not a snapshot. Both links are declared **without**
`readOnly` so Medusa's link module materializes a writable join
table; the resolved unit price snapshotted onto the order line is a
separate concern owned by `decorateLineItemWithOffer`. Every consumer
reads the relation via Medusa Query (`line_item.offer.id` /
`order_line_item.offer.id`) — nothing reaches into `metadata`.
`required_quantity` is **read fresh** from the live offer ↔
inventory-item link row at each event — it is an offer-configuration
value, not a per-purchase value.
A vendor editing `required_quantity` on an open offer does not
migrate in-flight reservations; the contract guarantees only that
future reservations / decrements / restocks use the current value.

#### Multi-inventory-item batching shape

A bundle offer attaches **N** `InventoryItem`s through the writable
link, each with its own `required_quantity`. Because Mercur calls
Medusa's steps directly with the prepared input, the batching shape
*is* Medusa's batching shape — there is no parallel implementation to
keep in sync. The reference implementations live at:

- fan-out source pattern: `core-flows/cart/utils/prepare-confirm-inventory-input.ts:234-281`
- batched reservation: `core-flows/cart/steps/reserve-inventory.ts:61-116`
- fulfilment fan-out: `core-flows/order/workflows/create-fulfillment.ts:289-348`
- bulk release: `core-flows/reservation/steps/delete-reservations-by-line-items.ts:16-50`

Concretely, for a cart line linked to an offer (via the
`cart.LineItem ↔ Offer` link row) whose offer has N linked inventory
items:

1. **Fan-out in `prepareOfferInventoryInput`** — the prep utility
   resolves `offer.inventory_items[]` once and emits **N entries per
   cart line**, all sharing the same `id` (= `line_item_id`). Each
   entry carries its own `inventory_item_id`, `required_quantity`,
   pre-filtered `location_ids`, and the raw `line.quantity` (not
   yet multiplied). The output type is identical to what
   `prepareConfirmInventoryInput` produces.
2. **Location selection per linked item** — for each
   `(line, inventory_item)` pair the prep utility builds the
   prioritized `location_ids` array (same ordering Medusa uses in
   `formatInventoryInput`, `prepare-confirm-inventory-input.ts:252-279`):
   1. locations where `(stocked − reserved) ≥ line.quantity × required_quantity` (locations that can fully cover this line on their own),
   2. then locations that simply have a level for the inventory item,
   3. then all locations associated with the cart's sales channel.
   `reserveInventoryStep` then picks `location_ids[0]`
   (`reserve-inventory.ts:84`) — first qualifying location wins,
   deterministic, no spreading across locations. A single cart line
   therefore reserves each linked inventory item at exactly one
   location, but the picked location may differ across the N items.
3. **Quantity multiplication at write time** — `reserveInventoryStep`
   multiplies `quantity = line.quantity × required_quantity` for each
   entry when it builds the `createReservationItems(...)` payload
   (`reserve-inventory.ts:82`). `confirmInventoryStep` applies the
   same multiplication for its availability comparison
   (`confirm-inventory.ts:80`).
4. **Single batched write per workflow run** — all N entries (across
   all lines in the cart) are collapsed by `reserveInventoryStep`
   into one `inventoryModule.createReservationItems(items[])` call
   inside a lock acquired over `unique(inventory_item_ids)`
   (`reserve-inventory.ts:88-92`). The lock prevents concurrent
   reservations on the same inventory item from over-allocating.
5. **Result mapping** — the returned reservation rows are keyed by
   `line_item_id`. **One line item maps to N reservation rows** (one
   per linked inventory item). Every downstream read-by-line —
   fulfilment, cancel, return — expects a 1:N relationship.
6. **Decrement fan-out at fulfilment** — Mercur's wrap of
   `createFulfillmentWorkflow` lists all reservations for the
   fulfilled lines, then for each reservation pushes one
   `adjustInventoryLevelsStep` entry with
   `adjustment = −(line.quantity × required_quantity)` and either
   deletes the reservation (when remaining quantity = 0) or updates
   it (partial fulfilment), mirroring `create-fulfillment.ts:311-348`.
   All adjustments are issued in a single batched call to
   `adjustInventoryLevelsStep`, which holds the inventory-item lock
   (`adjust-inventory-levels.ts:34-47`).
7. **Release on cancel** — Mercur's wrap of `cancelOrderWorkflow`
   calls `deleteReservationsByLineItemsStep(line_item_ids)` directly.
   The N-per-line reservation rows are deleted as a single bulk
   operation by Medusa's step; compensation restores them via
   `restoreReservationItemsByLineItem`
   (`delete-reservations-by-line-items.ts:46-48`).
8. **Restock fan-out** — Mercur's wraps of
   `confirmReceiveReturnRequestWorkflow` and
   `cancelOrderFulfillmentWorkflow` read `offer.inventory_items[]`
   afresh from the link (the return / fulfilment-cancel context
   never carries inventory data) and call
   `adjustInventoryLevelsStep` once with N positive adjustments per
   restocked line. The `location_id` per entry is taken from the
   return (`return.location_id`) or the canceled fulfilment's origin
   location, not from the original reservation — stock can be
   received at a different location than it was shipped from.

The validate path uses the same fan-out: `confirmInventoryStep`
iterates the N-per-line entries and asserts the same availability
inequality, but never writes and never holds a lock. Failures throw
`MedusaError.Codes.INSUFFICIENT_INVENTORY` from `confirmInventoryStep`
itself and bubble up unchanged — Mercur does not rewrap or augment the
error. The storefront surfaces the Medusa-native message; per-bundle
diagnostics (which linked item came up short) come from inspecting the
prepared input row, not from a custom error code.

Edge cases this shape inherits from Medusa:

- **Same inventory item linked to two offers in one cart**: the
  shared `inventoryModule.createReservationItems` call serializes
  per inventory item via the lock, so the reservations cannot
  over-allocate against `(stocked − reserved)`. Failure compensates
  the whole batch.
- **Same inventory item linked twice to the same offer**: rejected
  at offer-write time by the `(offer_id, inventory_item_id)`
  uniqueness on the link join table; never reaches the cart.
- **Partial fulfilment of a bundle**: each of the N linked items can
  have its reservation reduced independently via the
  `toUpdate` / `toDelete` split Medusa applies in
  `create-fulfillment.ts:311-348`. A partially-fulfilled line keeps
  its remaining reservation rows intact for a follow-up shipment.
- **Vendor edits `required_quantity` after reservation**: in-flight
  reservation rows are not migrated. The decrement at fulfilment
  uses `reservation.quantity` (which was multiplied by the
  `required_quantity` in force at reserve time), so the order
  fulfils with the original ratio. Future cart lines on the same
  offer use the new ratio.

#### How Mercur attaches to the workflows

Three attach mechanisms are used. Each row of the per-event table
picks whichever mechanism the target workflow exposes:

1. **Hook points exposed by an upstream Medusa workflow.** Where the
   upstream workflow already declares a `createHook(...)`, Mercur
   registers a handler against it. Medusa's cart workflows expose
   `hooks.validate` (early, throws to abort the parent), which is the
   natural seat for the read-only stock check on add / qty-update. No
   override of the parent workflow is required.

2. **Inline composition inside a Mercur-owned workflow.** The
   place-order path is owned by Mercur's
   `completeCartWithSplitOrdersWorkflow`
   (`packages/core/src/workflows/cart/workflows/complete-cart-with-split-orders.ts`),
   not by Medusa's `completeCartWorkflow`. The Mercur Store cart-
   complete route (`POST /store/carts/:id/complete`) calls the Mercur
   workflow directly, so Medusa's `completeCartWorkflow` is never
   invoked in the Mercur process. The pre-flight stock check is
   attached via the `validate` hook the Mercur workflow already
   declares (`createHook("validate", { input, cart })`); the offer-
   aware reservation step is composed **inline** in the workflow body,
   replacing the variant-shaped `reserveInventoryStep(formatedInventoryItems)`
   call the workflow makes today; and the cart-line ↔ offer link
   mirror is added inline immediately after `createOrdersStep`. No
   `overrideWorkflow` call is involved on this path — the workflow
   id is not Medusa's.

3. **Whole-workflow override via `overrideWorkflow`** for upstream
   Medusa workflows Mercur does not own end-to-end and where the
   upstream does not expose a hook positioned where Mercur needs to
   attach. The Mercur core plugin re-declares the affected core-flow
   under the same workflow id using `overrideWorkflow`
   (`packages/core/src/workflows/utils/override-workflow.ts`). That
   helper calls `WorkflowManager.unregister(id)` before
   `createWorkflow(...)`, so Mercur ships a same-named replacement
   without `WorkflowManager.register` throwing on the duplicate. The
   Mercur replacement copies the Medusa workflow's steps verbatim
   (re-imported from `core-flows`) and inserts a single
   `transform(input, prepareOfferInventoryInput)` → `<medusa step>`
   composition at the right point in the sequence — usually
   immediately after Medusa's own inventory step (which no-ops
   because Mercur's `ProductVariant` schema drops `manage_inventory`,
   so the upstream Medusa branch's truthy check resolves to falsy
   `undefined` — see **Why Mercur owns the lifecycle**).

| Event | Target workflow | Workflow owner | Attach mechanism |
| --- | --- | --- | --- |
| Validate (add) | `addToCartWorkflow` | Medusa upstream | hook: `hooks.validate` |
| Validate (qty update) | `updateLineItemInCartWorkflow` | Medusa upstream | hook: `hooks.validate` |
| Validate (place) | `completeCartWithSplitOrdersWorkflow` | Mercur | hook: the `validate` hook the Mercur workflow already declares (`createHook("validate", ...)`) |
| Reserve | `completeCartWithSplitOrdersWorkflow` | Mercur | inline composition: replace the variant-shaped `reserveInventoryStep(formatedInventoryItems)` with `reserveInventoryStep(transform(input, prepareOfferInventoryInput))` inside the workflow body |
| Mirror cart-line ↔ offer to order line | `completeCartWithSplitOrdersWorkflow` | Mercur | inline composition: insert `mirrorLineItemOfferLinksToOrderStep` immediately after `createOrdersStep` so the new `order_line_item.id`s can be paired with the offer ids read from the `cart.LineItem ↔ Offer` rows via Query |
| Decrement | `createFulfillmentWorkflow` | Medusa upstream | override via `overrideWorkflow` (Mercur appends `adjustInventoryLevelsStep([... negative])` + reservation update/delete after Medusa's own adjust step) |
| Release | `cancelOrderWorkflow` | Medusa upstream | override via `overrideWorkflow` (Mercur appends `deleteReservationsByLineItemsStep(line_item_ids)` for offer-linked lines) |
| Restock (return) | `confirmReceiveReturnRequestWorkflow` | Medusa upstream | override via `overrideWorkflow` (Mercur appends `adjustInventoryLevelsStep([... positive])`) |
| Restock (fulfilment cancel) | `cancelOrderFulfillmentWorkflow` | Medusa upstream | override via `overrideWorkflow` (same as return restock; uses fulfilment origin) |

The override approach is deliberate where it is used: every same-id
Mercur workflow is registered exactly once at module load (Medusa's
`WorkflowManager.unregister` is safe for ids that don't yet exist, so
the helper is a no-op for any id without a collision). Mercur does
**not** layer a runtime decorator or re-wrap Medusa's steps — the
Mercur core-flow is the canonical workflow for that id in the Mercur
process. For the place-order event no override is used: the workflow
id `complete-cart-with-split-orders` is registered only by Mercur and
already owns the composition, so the offer-aware steps are written
into its body directly.

#### Retry safety

The workflow framework (`@medusajs/framework/workflows-sdk`) tracks
step execution per workflow run. If a parent workflow retries after
a step failure, the framework replays only the failed step (or
re-invokes the compensator chain on rollback). Mercur does not add
a separate retry-deduplication layer because every inventory state
mutation routes through a Medusa step that owns both its forward
operation and its compensator:

- `reserveInventoryStep` writes new `ReservationItem` rows on the
  forward path and deletes them on rollback
  (`reserve-inventory.ts:99-115`). A retry after rollback starts
  from a clean state — no duplicate reservations.
- `adjustInventoryLevelsStep` (decrement / restock) records the
  inverse adjustment as its compensator
  (`adjust-inventory-levels.ts:59-89`). A retry after rollback re-
  applies the original adjustment cleanly.
- `deleteReservationsByLineItemsStep` soft-deletes and restores via
  `restoreReservationItemsByLineItem`
  (`delete-reservations-by-line-items.ts:46-48`).

External duplicate-trigger cases (e.g. a stuck webhook causing two
`createFulfillment` calls for the same fulfilment id) are out of
scope of this section — they are handled by the upstream
domain-object identity (fulfilment ids are unique on insert) rather
than by per-step keys.

#### Compensation

Compensation is **owned entirely by the Medusa steps** — Mercur adds
no compensation logic of its own, because Mercur runs no inventory
logic of its own:

- `reserveInventoryStep` → compensator at
  `reserve-inventory.ts:99-115` deletes any reservation rows created
  in the batch.
- `adjustInventoryLevelsStep` → compensator at
  `adjust-inventory-levels.ts:59-89` re-applies the inverse
  adjustment per linked item (covers both decrement and restock).
- `deleteReservationsByLineItemsStep` → compensator calls
  `restoreReservationItemsByLineItem` (soft-restore pattern,
  `delete-reservations-by-line-items.ts:46-48`).

Because the same-id override workflows registered via
`overrideWorkflow` are just `createWorkflow` calls under the
hood (the helper unregisters before registering — it does not
introduce any extra runtime layer), they participate in the
framework's standard compensation chain transparently. No
Mercur-side compensation bookkeeping exists.

Steps run inside the parent workflow's transactional boundary; partial
failures compensate the rest of the batch.

#### Resolution chain at write time

```
addToCart(req)                            // req carries offer_id per item
  → addToCartWorkflow.hooks.validate
       → const prepared = transform(input, prepareOfferInventoryInput)
       → confirmInventoryStep(prepared)   // Medusa step, direct call
       // throws MedusaError.Codes.INSUFFICIENT_INVENTORY on fail (Medusa-native, bubbles up unchanged)
  → standard add-to-cart steps (Medusa inventory work is skipped — variant.manage_inventory is undefined under Mercur's product module)
  → Mercur patched getLineItemActionsStep splits / merges by linked offer_id
  → line item persisted; Mercur linkLineItemToOfferStep writes the
    cart.LineItem ↔ Offer link row

completeCart(req)        // POST /store/carts/:id/complete (Mercur Store route)
  → completeCartWithSplitOrdersWorkflow (Mercur-owned; no Medusa completeCartWorkflow involved):
       → hooks.validate (the Mercur workflow's own `createHook("validate", { input, cart })`)
            → confirmInventoryStep(transform(input, prepareOfferInventoryInput))   // final guard
       → all of the Mercur workflow's existing steps (order-group create, per-seller order
         split via createOrdersStep, link creation, promotion usage, cart completion, ...)
       → inline-replaced step: reserveInventoryStep(transform(input, prepareOfferInventoryInput))
            // Medusa creates N ReservationItems per line, locked, batched
            // this replaces the variant-shaped reserveInventoryStep(formatedInventoryItems)
            // call the Mercur workflow makes today
       → inline-added step: mirrorLineItemOfferLinksToOrderStep
            // reads cart.LineItem ↔ Offer link rows for the cart's items via Query
            // writes order.OrderLineItem ↔ Offer link rows keyed by the new
            // order_line_item.ids produced by createOrdersStep

createFulfillment(req)
  → createFulfillmentWorkflow (Mercur same-id override):
       → all Medusa steps (its own adjust step no-ops without reservations)
       → Mercur-added step: adjustInventoryLevelsStep([...negative adjustments per linked item])
       → reservation update/delete via inventoryService
         based on remaining-vs-fulfilled (Medusa's toUpdate/toDelete split)

cancelOrder(req)        // before fulfilment
  → cancelOrderWorkflow (Mercur same-id override):
       → Mercur-added step: deleteReservationsByLineItemsStep(line_item_ids)

confirmReceiveReturn(req)
  → confirmReceiveReturnRequestWorkflow (Mercur same-id override):
       → all Medusa steps (its own restock branch no-ops because variant.manage_inventory is undefined under Mercur's product module — see "Why Mercur owns the lifecycle")
       → Mercur-added step: adjustInventoryLevelsStep([...positive adjustments per linked item])
```

#### Cross-cutting rules

- Each Mercur step resolves `offer.inventory_items[]` fresh through
  Query at execution time. The hook payloads from Medusa never carry
  offer-inventory data.
- The Mercur offer module **never writes to `InventoryItem` /
  `InventoryLevel` / `ReservationItem` tables directly**. All
  mutations route through `IInventoryService`; reads go through
  Query.
- The Store API surface filter (offers visible only when effective
  availability > 0) consumes the same computation. An offer drops out
  of the storefront `offers` list the moment any linked item falls
  below its `required_quantity` — there is no explicit state
  transition.
- Per-line snapshot on the order line is the
  `order.OrderLineItem ↔ Offer` link row (written by Mercur inside
  `completeCartWithSplitOrdersWorkflow` via the inline-added
  `mirrorLineItemOfferLinksToOrderStep`). Resolved unit price and
  `seller_id` continue to be snapshotted as documented in **Snapshots
  on order lines**; `required_quantity` is never snapshotted.

#### Regression coverage additions

In addition to the list under **Regression coverage**, these must
each be exercised by an integration test:

- add-to-cart with `offer_id` rejects with Medusa's native
  `MedusaError.Codes.INSUFFICIENT_INVENTORY` when any linked item lacks
  `qty × required_quantity` available
- place-order writes one `ReservationItem` per (line, linked
  inventory item) pair, each scaled by `required_quantity`; no
  `stocked_quantity` movement at this stage
- create-fulfilment decrements each linked item by
  `qty × required_quantity` and removes the matching reservations
- cancel-order before fulfilment removes reservations and leaves
  `stocked_quantity` untouched
- confirm-receive-return increases each linked item by
  `returned_qty × required_quantity` at the return's location
- cancel-fulfilment after shipment restocks linked items at the
  fulfilment's origin location
- a place-order that fails after the offer-reserve step rolls back
  the reservation rows via `reserveInventoryStep`'s compensator (no
  orphaned reservations remain)
- a create-fulfilment that fails after the offer-decrement step
  rolls back the `stocked_quantity` adjustment via
  `adjustInventoryLevelsStep`'s compensator (no permanent
  decrement remains)
- a Query graph against `product_variant` for the fields
  `manage_inventory` and `allow_backorder` returns `undefined` for
  each (column-level invariant: Mercur's overridden product module
  does not declare these fields, see
  `packages/core/src/modules/product/models/product-variant.ts`).
  The same Query graph for `sku` resolves to the variant's
  master-catalog SKU value (or `null`) — `variant.sku` is retained on
  the schema and is unrelated to `offer.sku`
- a Query graph against `product_variant.inventory_items` for a
  variant referenced by at least one Mercur offer returns `[]` (no
  rows accumulate in the `product_variant_inventory_item` link table
  for marketplace-shared variants because Mercur's
  `createProductVariantsWorkflow` override does not wire inventory
  items to variants)
- the offer-create workflow performs **no** variant-update step and
  never invokes `updateProductVariantsWorkflow` or
  `dismissProductVariantsInventoryStep`; the previous draft's "flip
  the flag" migration is no longer part of the workflow composition
- running `addToCartWorkflow`, `completeCartWithSplitOrdersWorkflow`,
  `createFulfillmentWorkflow`, `cancelOrderWorkflow`,
  `cancelOrderFulfillmentWorkflow`, and
  `confirmReceiveReturnRequestWorkflow` against a cart/order whose
  lines back Mercur offers does not raise an "unknown field" /
  "field not found" error from the Query layer on the
  `items.variant.manage_inventory`, `items.variant.allow_backorder`,
  or `items.variant.inventory_items.*` paths.
  If this test fails the additions to `patch-medusa.ts` documented
  under **patch-medusa.ts: required additions for variant field
  removal** must ship before the spec moves to `passing`.

Multi-inventory-item (bundle) cases:

- placing an order on a bundle offer with N linked items writes
  exactly **N reservation rows per line**, all sharing the same
  `line_item_id`, each carrying a different `inventory_item_id` and
  `quantity = line.qty × required_quantity` for that link row
- the picked `location_id` per reservation matches the prioritized
  selection (full-availability locations first, then
  any-level locations, then channel locations) and is computed
  independently per linked item — two items on the same line may
  reserve at different locations
- a single `createReservationItems` batch is issued per
  order-placement workflow run; if any reservation in the batch
  would over-allocate, the whole batch compensates and no partial
  reservation state is left behind
- two concurrent orders that both touch the same shared
  `InventoryItem` (because two offers link to it) are serialized by
  the inventory-item lock and never co-allocate beyond
  `(stocked − reserved)`
- partial fulfilment of a bundle line updates each linked item's
  reservation `quantity` independently and only deletes reservations
  whose remaining quantity reaches zero; a follow-up shipment uses
  the residual reservation rows
- cancel-order before fulfilment removes all N reservations for a
  line in a single `deleteReservationItemsByLineItem` bulk call
- editing `required_quantity` on an offer link row after a
  reservation exists does not migrate the existing reservation; the
  fulfilment decrements using the reservation's stored `quantity`
  and future reservations use the new ratio

### `Offer` fields

```ts
type Offer = {
  // Identity (plain text columns; resolved on read via module links +
  // Query, mutated via the owning module's service)
  id: string;                     // "offer_..."
  seller_id: string;
  variant_id: string;
  shipping_profile_id: string;
  price_set_id: string;           // FK to the offer's own PriceSet
                                  // (Medusa pricing module). Resolved
                                  // on read via the offer.price_set
                                  // read-only link.

  // Vendor-supplied identifier
  sku: string;                    // vendor's own internal ID

  // Denormalized copies of the chosen variant's GTIN-class identifiers,
  // snapshotted at create time for vendor-side search and display
  ean: string | null;
  upc: string | null;

  // Audit
  created_at: Date;
  updated_at: Date;
  created_by: string;
  deleted_at: Date | null;        // soft-delete
  metadata: Record<string, unknown> | null;
};
```

That's the entire shape of the offer record. The offer ↔ inventory-item
relationship is materialized in Medusa's link module as the
`offer_inventory_item` join table (one row per linked item) with the
shape Medusa's link module gives every writable link: `id`, `offer_id`,
`inventory_item_id`, `created_at`, `updated_at`, plus the
`required_quantity` extra column declared on the link. That table is
not part of the offer module's schema. The offer module reads its
contents through Query (`offer.inventory_items[]`) and mutates it
through Medusa's link service.

Anything else (stock levels, prices, shipping options, variant fields)
is owned by another module (`PriceSet`, `ShippingProfile`,
`InventoryItem` / `InventoryLevel`, `ProductVariant`) and reached by
calling that module's service.

### Uniqueness and indexes

On the `offer` table:

- Primary key: `offer.id`.
- **Canonical uniqueness**: `(seller_id, sku)` partial unique index
  where `deleted_at IS NULL`. This is the upsert key for vendor writes
  and is the key any future bulk-import surface will rely on.
- `(seller_id, variant_id)` is **not** unique — a single seller may list
  the same variant multiple times under different `sku`s.
- Lookup indexes (non-unique):
  - `(variant_id)` where `deleted_at IS NULL` — drives the Store API's
    candidate-offers query for a variant. The effective-stock filter is
    applied in a second pass by reading stocked quantities for each of
    the offer's linked `InventoryItem`s through Query.
  - `(seller_id)` where `deleted_at IS NULL` — drives the vendor list
    page.
  - `(ean)` and `(upc)` where `deleted_at IS NULL` — searchability on the
    vendor list. Not unique.

On the `offer_inventory_item` join table (owned by Medusa's link
module; named here so its access pattern is explicit):

- Primary key: `id`.
- **Uniqueness**: `(offer_id, inventory_item_id)` — an inventory item
  cannot be attached to the same offer twice. (This mirrors the
  duplicate-inventory-item validation in Medusa's
  `createProductVariantsWorkflow`.)
- Lookup indexes:
  - `(offer_id)` — drives `offer.inventory_items` reads from Query.
  - `(inventory_item_id)` — supports reverse lookups when an inventory
    adjustment needs to fan out to every offer linked to that item.

### Snapshots on order lines

Order line items carry:

- a `order.OrderLineItem ↔ Offer` link row (written by Mercur inside
  `completeCartWithSplitOrdersWorkflow` via the inline-added
  `mirrorLineItemOfferLinksToOrderStep`; queryable as
  `order_line_item.offer.id`). No `offer_id` field on the line item or
  its `metadata` — the link row is the canonical pointer.
- snapshotted commercial fields at purchase time: resolved unit price
  and currency (from `pricingModule.calculatePrices` against the
  offer's own `PriceSet` via `offer.price_set_id` — see **Cart
  Integration**), `sku`, `shipping_profile_id`, `seller_id`.

Snapshots are immutable. Subsequent offer edits never mutate historical
order lines. Reporting, payouts, and returns read from the snapshot.

## Storefront API Surface

### Storefront (Store API)

The Store API exposes offers as the unit the buy button binds to.
It never picks a winner — the response is the full visible-offer
list per variant, in a stable order, and the storefront decides
which offer's buy button is highlighted:

- `GET /store/products/:id` augments each variant in the response with an
  `offers` array scoped to the active customer group and region. Each
  entry includes `id`, `seller`, resolved `price`,
  `currency_code`, `stock_status` (`in_stock` / `low_stock` /
  `out_of_stock`), and `shipping_profile_id`.
  Price resolution collects every visible offer's `price_set_id`
  across the requested product's variants and issues **one**
  `pricingModule.calculatePrices({ id: priceSetIds }, { context })`
  call with `context = { region_id, currency_code, customer_group_id,
  quantity: 1 }`. Each offer's `price` / `currency_code` is keyed
  back by `price_set_id` from the response map. No per-offer
  round-trip, no `offer_id` in context — the candidate `PriceSet`
  is the offer's own, so no rule-based discrimination is needed.
  Stock resolution walks the offer's
  `inventory_items[].inventory.location_levels` chain through Query —
  the same field chain Medusa's
  `prepareConfirmInventoryInput` uses for variants — and computes the
  effective stocked quantity as `MIN(floor((stocked - reserved) /
  required_quantity))` across the offer's linked items, scoped to the
  region's stock locations. An offer is exposed only when it is not
  soft-deleted and its effective stocked quantity is positive. The
  array is returned in deterministic order: `price ASC, created_at
  ASC, id ASC`. This is a stable sort, not a "winner pick" — the
  server states the order and the storefront chooses what to do with
  it (highlight the first entry, surface a comparison panel, group
  by seller, etc.).
- Cart line creation **requires** an explicit `offer_id`. There is
  no server-side fallback that picks one from the variant. Cart and
  workflow inputs that omit `offer_id` are rejected at the route layer
  (Medusa's default `POST /store/carts/:id/line-items` is patched to
  require it — see **Cart Integration > Required `offer_id`**) and
  the Mercur same-id override of `addToCartWorkflow` narrows the
  input DTO so the workflow itself only accepts items with
  `offer_id: string`. Once present, the Mercur cart workflow
  resolves the variant + seller + shipping profile from the offer,
  writes a `cart.LineItem ↔ Offer` link row through
  `linkLineItemToOfferStep` after the line item is created, and
  snapshots the resolved price onto the cart line. See the **Cart
  Integration** section for how each cart line's
  `offer.price_set_id` is resolved through the
  `cart.LineItem ↔ Offer` link inside the same-id override of
  `getVariantsAndItemsWithPrices` and passed directly to
  `pricingModule.calculatePrices` (so a cart of N lines refreshes
  its prices in **one** round-trip), and how Mercur's same-id
  override of `getLineItemActionsStep` keeps two offers on the same
  variant in separate cart lines.

Suspension, expiry, and SLA-driven moderation flows are intentionally
out of scope for this revision. They can be layered on in a follow-up
spec without changing the offer record shape.

## Offer Flows

### F1 — Create a new variant, then an offer on it (first-vendor case)

When the desired variant does not yet exist in the master catalog, the
vendor runs the variant create flow first (owned by the product module),
then opens the offer create wizard and picks the newly-created variant.
Variant creation and offer creation are deliberately separate writes;
the offer module never creates variants.

### F2 — Create an offer on an existing variant (common case)

Vendor submits commercial fields plus an explicit `variant_id` and one
or more inventory-item definitions (each carrying an initial stock
level, an optional location, and an optional `required_quantity`,
defaulting to `1`). The workflow:

1. retrieves the variant via the product module, copies its `ean` and
   `upc` onto the offer record;
2. creates a fresh `PriceSet` for this offer via
   `pricingModule.createPriceSets(...)` and captures its id — every
   offer owns its own `PriceSet`, sibling offers on the same variant
   each get their own;
3. inserts the offer row with `price_set_id` set to the new PriceSet's
   id, alongside the other singleton FK-shaped columns;
4. seeds the offer's `Price` rows on the offer's own `PriceSet` via
   `pricingModule.addPrices(...)` — currency, optional region /
   customer-group rules, optional `min_quantity` / `max_quantity`
   columns. No `offer_id` `PriceRule` is attached;
5. creates one `InventoryItem` per requested inventory entry via the
   inventory module and seeds its initial level;
6. registers the read-only links from the offer to the variant, seller,
   shipping profile, and the new `PriceSet`;
7. registers one writable offer ↔ inventory-item link row per attached
   item, carrying its `required_quantity` (via `createLinksWorkflow`).

Steps 5 and 7 also support the "attach an existing inventory item"
case — for example when a seller already manages SKUs in the inventory
module — in which case the workflow skips item creation and only
creates the link row.

The vendor cannot edit variant fields through this path; the payload
only carries commercial fields. If `variant_id` does not resolve, the
workflow fails with `MedusaError.Types.NOT_FOUND` (HTTP 404) and no
offer (and no companion `PriceSet` / `Price` rows / `InventoryItem`
rows / link rows) is created. Compensation is owned by Medusa's
pricing and inventory steps: a failure after step 2 rolls back the
newly-created `PriceSet` via `createPriceSetsStep`'s compensator, so
no orphan PriceSet survives a failed create. Duplicate
`inventory_item_id` values inside a single create payload are
rejected with
`new MedusaError(MedusaError.Types.INVALID_DATA, …)` (HTTP 400),
matching Medusa's `validateVariantsDuplicateInventoryItemIds`
contract.

### F3 — Stock lifecycle (validate → reserve → decrement → restock)

Add-to-cart validates against `offer.inventory_items[]`. Order
placement reserves against each linked item (`createReservationItems`,
scaled by `required_quantity`). Fulfilment decrements
(`adjustInventory(−)`) and clears the reservation. Cancel before
fulfilment releases the reservation; return and cancel-after-fulfilment
restock (`adjustInventory(+)`). Retry safety comes from each Medusa
step's compensator participating in the workflow framework's standard
rollback chain; Mercur adds no per-step key. The offer module owns no
stock column of its own; all stock state lives on the linked
`InventoryItem`s.

The Store API filters offers by reading every linked `InventoryItem`'s
`(stocked − reserved)` through Query and computing the offer's
effective availability. When any linked item drops below its
`required_quantity`, the offer's effective availability hits zero and
the offer naturally drops out of the Store API's `offers` list
without any explicit state transition.

The full normative contract — attach points on Mercur's
`completeCartWithSplitOrdersWorkflow` (place-order path; inline
composition + the workflow's existing `validate` hook) and on the
upstream Medusa workflows Mercur does not own end-to-end
(`addToCartWorkflow`, `updateLineItemInCartWorkflow`,
`createFulfillmentWorkflow`, `cancelOrderWorkflow`,
`cancelOrderFulfillmentWorkflow`, and
`confirmReceiveReturnRequestWorkflow` — using either `hooks.validate`
or a same-id `overrideWorkflow` override) — lives under **Inventory
Lifecycle** in the Domain Model section above.

## Cart Integration

The buy button binds to an `offer_id`, not a `variant_id`. `offer_id`
is **required** on every add-to-cart path in a Mercur marketplace —
there is no server-side fallback that picks an offer for the caller.

Mercur owns exactly **one** workflow override in the cart pricing
path: `addToCartWorkflow` (`overrideWorkflow`, same-id). Inside that
override, Mercur:

1. Validates that every input item carries an `offer_id`.
2. Resolves `offer.price_set_id` for each item via Medusa Query
   (one round-trip).
3. Calls `pricingModule.calculatePrices({ id: priceSetIds }, { context })`
   once — context is the standard Medusa pricing context
   (`region_id`, `currency_code`, `customer_group_id`, `quantity`),
   no `offer_id` field.
4. Writes the resolved amount onto each item as
   `unit_price` + `is_custom_price = true` before passing the items
   to Medusa's standard cart-line creation steps.
5. Appends `linkLineItemToOfferStep` after `createLineItemsStep` to
   write the `cart.LineItem ↔ Offer` link row.

That's the whole pricing seam. Once `unit_price` is set and
`is_custom_price=true`, Medusa's downstream cart pipeline honors it
on every path:

- `prepareLineItemData` (`cart/utils/prepare-line-item-data.ts:140-193`)
  copies `unit_price` and `is_custom_price` onto the persisted line.
- `getVariantsAndItemsWithPrices` (`:184-220`) short-circuits on
  `isCustomPrice` and never overwrites the unit price during
  refresh.
- `updateLineItemInCartWorkflow` (`update-line-item-in-cart.ts:272-285`)
  keeps the existing line's `unit_price` and `is_custom_price` on
  qty changes; the variant→calculated_price branch only fires when
  `!is_custom_price`.
- `refreshCartItemsWorkflow` recomputes promotions, taxes, and
  payment-collection state but does not touch a line whose
  `is_custom_price=true`.

`getLineItemActionsStep` is overridden as a same-id step
(`packages/core/src/workflows/cart/steps/get-line-item-actions.ts`)
so two offers on the same variant land as two distinct cart lines
instead of merging — the override extends the merge predicate to
`(variant_id, offer_id, metadata, is_custom_price)`. This is
necessary because two offers can happen to set the same unit_price;
without offer_id in the merge key, identical-priced sibling offers
on one variant would collapse into a single line.

No override of `getVariantsAndItemsWithPrices`, no override of
`updateLineItemInCartWorkflow`, no override of
`refreshCartItemsWorkflow`, no override of `createCartWorkflow`, no
`setPricingContext` hook handler. The single
`addToCartWorkflow` override plus the single `getLineItemActionsStep`
step replacement cover the entire cart pricing surface.

### Required `offer_id`

`offer_id` is enforced at two layers, in this order:

1. **Route layer.** Mercur ships its own Store cart line-item
   routes at
   `packages/core/src/api/store/carts/[id]/line-items/route.ts` and
   `packages/core/src/api/store/carts/[id]/line-items/[line_id]/route.ts`,
   registered through the core plugin's Medusa-route loader so they
   take precedence over Medusa's default handlers. Each owns its
   own validator and throws `MedusaError.Types.INVALID_DATA`
   (HTTP 400) when `offer_id` is missing or does not resolve to a
   visible offer on the cart's variant.

   As defense-in-depth, `patch-medusa.ts`
   (`packages/cli/src/utils/patch-medusa.ts`) also blanks Medusa's
   compiled defaults at
   `node_modules/@medusajs/medusa/dist/api/store/carts/[id]/line-items/route.js`
   and `…/line-items/[line_id]/route.js` (mirroring the existing
   pattern for product/product-variant/product-category routes), so
   no plugin or test path can accidentally reach Medusa's
   validator-less handler. The two layers together — Mercur-owned
   routes registered first, plus the upstream defaults blanked —
   guarantee `offer_id` is required at the HTTP boundary.
2. **Workflow layer.** Mercur ships a same-id override of
   `addToCartWorkflow` via the `overrideWorkflow` helper
   (`packages/core/src/workflows/utils/override-workflow.ts`) — the
   same helper used for the upstream Medusa fulfilment, cancel, and
   restock workflows Mercur extends (see **Inventory Lifecycle > How
   Mercur attaches to the workflows**). The place-order workflow is
   not in this list because it is already a Mercur-owned workflow
   (`completeCartWithSplitOrdersWorkflow`) with no upstream id to
   collide with. The override re-declares `addToCartWorkflow` under
   the upstream id with a **narrowed input type** so the per-item
   shape is `{ variant_id: string; quantity: number; offer_id:
   string; ... }` (`offer_id` required, not optional). The body of
   the workflow is copied verbatim from Medusa with a single first
   step: a guard that throws
   `new MedusaError(MedusaError.Types.INVALID_DATA, …)` if any
   incoming item lacks `offer_id`. The type narrowing makes the omission a compile-
   time error for any TypeScript caller of `addToCartWorkflow(...)`;
   the runtime guard catches plain-JS callers and any path that
   bypasses the route validator.

The route patch is defense-in-depth against vanilla cart calls
landing on the Medusa default URL; the workflow override is the
authoritative contract.

### Cart line input

The Mercur Store cart routes resolve the offer, pick up its
`variant_id`, and forward a Medusa-shaped `addToCartWorkflow` input
where each item carries:

- `variant_id` (resolved from the offer)
- `quantity`
- `offer_id` — a top-level field on the workflow input item (not in
  `metadata`), required. Medusa's workflow input shape passes
  unknown properties through to step inputs; Mercur's patched
  `getLineItemActionsStep` reads this field for the merge identity
  check (see **Line item ↔ Offer link** below), and Mercur's
  appended `linkLineItemToOfferStep` writes a real FK link row keyed
  by `(line_item_id, offer_id)` after the cart line is persisted.

`offer_id` is **never** stored in `line_item.metadata`. The single
canonical pointer from a cart line to its offer is the
`cart.LineItem ↔ Offer` link row (mirrored onto
`order.OrderLineItem ↔ Offer` at conversion). All reads — the
per-line `priceSetId` resolution in the
`getVariantsAndItemsWithPrices` override, the inventory hooks, the
order-line snapshot — go through Medusa Query against that link.

The cart route validates that the offer exists, is not soft-deleted,
has a positive effective stocked quantity, and that its
`shipping_profile_id` is consistent with the cart's other items (one
cart can span multiple sellers per Mercur's order-group model). If
validation fails before the workflow runs, the route returns
`OFFER_UNAVAILABLE` (404 / 409).

### Line item ↔ Offer link

Two link definitions live under `packages/core/src/links/`, mirroring
the existing convention (see `line-item-commission-line-link.ts`):

- `cart-line-item-offer-link.ts` — `CartModule.linkable.lineItem ↔
  OfferModule.linkable.offer`, **writable** (declared with Medusa's
  `defineLink` without `readOnly`). This is a real relation, not a
  snapshot: there is no FK column on the line item to mirror, so the
  link must materialize its own join row. Mercur writes the row via
  `linkLineItemToOfferStep` (`remoteLink.create(...)`) immediately
  after the line item is persisted, and dismisses it in the step's
  compensator and on line-item removal. A read-only declaration would
  not give Medusa's link module a writable join table — there would
  be nothing to write to.
- `order-line-item-offer-link.ts` — `OrderModule.linkable.orderLineItem
  ↔ OfferModule.linkable.offer`, **writable** (declared with Medusa's
  `defineLink` without `readOnly`). Same rationale: a relation that
  materializes its own join row. The row is written by Mercur inside
  `completeCartWithSplitOrdersWorkflow` (the Mercur-owned cart-
  complete workflow at
  `packages/core/src/workflows/cart/workflows/complete-cart-with-split-orders.ts`)
  via the inline-added `mirrorLineItemOfferLinksToOrderStep`, taking
  the `offer_id` from each cart line's `cart.LineItem ↔ Offer` row
  (read via Query) and the new `order_line_item.id`s produced by
  `createOrdersStep` as keys.

Both links surface in Medusa Query as `line_item.offer` /
`order_line_item.offer`. The Offer module declares no inverse
linkable for line items — the link is a unidirectional pointer from
the line item into the offer, but the join row itself is writable
because Mercur owns its lifecycle (create on cart-line insert,
dismiss on cart-line removal, mirror onto order-line at cart-
complete).

Why a real link instead of `metadata.offer_id`:

- The link row sits in a dedicated link table owned by Medusa's link
  module — a real FK column, not a JSON field, with the standard
  `(id, line_item_id, offer_id, created_at, updated_at)` shape every
  Medusa link gets. Queryable, indexable, joinable.
- It survives every Medusa line-item path that copies fields by name
  (`prepareLineItemData`, refresh, re-price) because the binding is
  external to the line-item row and keyed only by `line_item.id`.
- It removes the need for any consumer (pricing context, inventory
  validate / reserve / decrement / restock, order-line snapshot) to
  reach into `metadata` — every read is a single Query traversal
  along `line_item.offer.*`.

#### Workflow input DTO augmentation

`addToCartWorkflow` types its `items` array as
`CreateCartCreateLineItemDTO[]`
(`@medusajs/types/cart/workflows.ts:17`). Because that's an exported
`interface`, Mercur extends it through TypeScript **module
augmentation** — the same mechanism already used in
`packages/core/src/types/seller-context.ts` to add
`Request.seller_context`. A new file
`packages/core/src/types/cart-line-item.ts` carries the augmentation:

```ts
// packages/core/src/types/cart-line-item.ts
declare module "@medusajs/types" {
  interface CreateCartCreateLineItemDTO {
    /**
     * Mercur extension: binds this cart line to a specific offer.
     * Required on every Mercur add-to-cart / update-line-item call.
     * Read by Mercur's patched `getLineItemActionsStep` for merge
     * identity, by the `getVariantsAndItemsWithPrices` override to
     * resolve the per-line `priceSetId` on add, and by
     * `linkLineItemToOfferStep` to write the
     * `cart.LineItem ↔ Offer` link row after the line item is
     * persisted. Not stored on the line item itself.
     */
    offer_id: string
  }
}
```

The augmentation file must be picked up by the package's TypeScript
compilation — either by sitting under the package's existing `include`
glob (as `seller-context.ts` already does) or by being re-exported
from `packages/core/src/types/index.ts`. No runtime export is needed;
the file is types-only.

After this augmentation, every call site that types its workflow
input as `AddToCartWorkflowInputDTO["items"][number]` or
`CreateCartCreateLineItemDTO` — the Mercur Store cart route, the
patched `getLineItemActionsStep`, the
`getVariantsAndItemsWithPrices` override, and
`linkLineItemToOfferStep` — sees `offer_id: string` as a first-class
required field. No `as any` casts, no `(item as { offer_id?: string
})` reaches anywhere in the codebase. Calls to `addToCartWorkflow`
that omit `offer_id` fail TypeScript compilation; calls that
bypass the type system at runtime are rejected by the override's
first step.

#### Overriding `getLineItemActionsStep`

Medusa's `getLineItemActionsStep`
(`@medusajs/core-flows/dist/cart/steps/get-line-item-actions.js`)
keys candidate-merge lookups by `variant_id` alone, using
`new Map(existingVariantItems.map((item) => [item.variant_id, item]))`
— at most one existing line item per variant survives — and
combines that with a `metadataMatches` predicate. The result: two
offers on the same variant collapse into a single cart line and the
second offer's `offer_id` silently overwrites the first via metadata
update. Both problems are unfixable from outside the step.

`getLineItemActionsStep` is a **real source step**
(`cart/steps/get-line-item-actions.ts:59`, step id
`get-line-item-actions-step`, line 43) — not compiled-only — so
Mercur re-registers it under the same id via a Mercur-owned step
definition at module load. The mechanism is the same as the
workflow same-id override
(`packages/core/src/workflows/utils/override-workflow.ts`): the
step framework treats a same-id `createStep(...)` as a replacement
when the prior registration is unregistered first. **No
`patch-medusa.ts` entry is required for this step.**

The replacement step:

1. Lists existing cart line items by `cart_id + variant_id` as
   today, but builds a `Map<variant_id, LineItem[]>` (one-to-many,
   not the current one-to-one map) so multiple existing items per
   variant — one per offer on that variant — are all considered.
2. Resolves `ContainerRegistrationKeys.QUERY` and runs a single
   `query.graph({ entity: "line_item", fields: ["id", "offer.id"],
   filters: { id: <existing_ids> } })` to fetch the linked offer id
   per existing cart line item. The lookup is one round-trip per
   `getLineItemActionsStep` invocation.
3. For each incoming item, picks an existing line item to merge into
   only when `existing.variant_id === item.variant_id` **and**
   `existing.offer.id === item.offer_id` **and** the original
   `metadataMatches` / `is_custom_price` predicate still holds.
   Otherwise the item goes to `itemsToCreate`.

The step's input and output types do not change at the Medusa
level. `item.offer_id` is the required field added by Mercur's
TypeScript augmentation (see **Workflow input DTO augmentation**)
and enforced by the workflow override's guard step. Every cart line
that reaches this step in a Mercur process carries an `offer_id`,
so the merge identity check is a straightforward `offer.id` equality
on both sides — there is no nullable branch.

The replacement step source lives at
`packages/core/src/workflows/cart/steps/get-line-item-actions.ts`
under the same step id as Medusa's; module-load order ensures the
Mercur step wins. No file-patch entry is shipped for this step in
`patch-medusa.ts`.

#### `linkLineItemToOfferStep`

Mercur appends one step to `addToCartWorkflow` and
`updateLineItemInCartWorkflow` (via the same-id
`overrideWorkflow` override pattern documented under
**Inventory Lifecycle > How Mercur attaches to the Medusa workflows**)
that runs immediately after the line-item insert step and writes the
link row through Medusa's link service:

```ts
remoteLink.create(
  createdLineItems.map((li, i) => ({
    [Modules.CART]: { line_item_id: li.id },
    [OFFER_MODULE]:  { offer_id: input.items[i].offer_id },
  }))
)
```

Compensation deletes the link rows it created. The step assumes
every input item carries an `offer_id` (the workflow override and
patched route both enforce this upstream); if it somehow doesn't,
the step throws `new MedusaError(MedusaError.Types.INVALID_DATA, …)`
rather than silently skipping the row.

A symmetric step — `mirrorLineItemOfferLinksToOrderStep` — is
inserted **inline** into Mercur's `completeCartWithSplitOrdersWorkflow`
(the Mercur-owned cart-complete workflow at
`packages/core/src/workflows/cart/workflows/complete-cart-with-split-orders.ts`)
immediately after the workflow's existing `createOrdersStep` call.

> **Cart→order line identity gotcha.** `createOrdersStep`
> (`order/steps/create-orders.ts:31-51`) calls
> `OrderModuleService.createOrders(data)` which generates **new**
> `orli_*` ids. `prepareLineItemData` only propagates `cart_id`
> onto the order line — not the cart line-item id
> (`cart/utils/prepare-line-item-data.ts:140-193`). The mirror step
> therefore cannot match by id position alone. The Mercur-owned
> `prepareLineItemData` copy under
> `packages/core/src/workflows/cart/utils/prepare-line-item-data.ts`
> must stamp the cart line-item id onto the order line in a stable
> place — the chosen carrier is `metadata.cart_line_item_id`
> (a single deterministic key, not a free-form passthrough). The
> mirror step reads each new order line's
> `metadata.cart_line_item_id`, joins against the
> `cart.LineItem ↔ Offer` rows by that key, and writes the
> `order.OrderLineItem ↔ Offer` link rows through Medusa's link
> service. `offer_id` is **not** put on
> `line_item.metadata` itself — only the cart-line-id carrier is.
> After the mirror step writes the order-side link rows, downstream
> code reads the offer via `order_line_item.offer.*` Query
> traversal, never via metadata.

No `overrideWorkflow` is involved on this path — the Mercur workflow
already owns the composition, so the step is added by editing the
workflow body directly. The snapshotted commercial fields on the
order line (`unit_price`, `sku`, `shipping_profile_id`, `seller_id`)
are still written by Mercur's existing `decorateLineItemWithOffer`
step; the mirror step only writes the link row.

### What `calculatePrices` sees inside the addToCart override

The override calls
`pricingModule.calculatePrices({ id: priceSetIds }, { context })`
exactly once per add-to-cart invocation. `priceSetIds` are the
`offer.price_set_id` values resolved from the input items; the
context is the standard Medusa pricing context (no `offer_id`
field). Each candidate `PriceSet` belongs to a single offer, so no
rule-based discrimination is needed — `Price` rows on the offer's
own PriceSet are the entire candidate set.

The standard `groupBy("price_set_id")` resolver inside the pricing
module then applies PriceList / SALE / OVERRIDE / tier logic
inside each offer's ladder
(`pricing-module.ts:391-460`). Tiers, region prices,
customer-group prices, and PriceLists all work natively at
add-time. Mercur does not use `PriceListRule { offer_id }` —
PriceLists target offer `PriceSet`s directly via their `Price`
rows. See **Pricing Architecture > PriceLists and promotions**.

### Snapshot

When the line item is created, `prepareLineItemData`
(`prepare-line-item-data.ts:140-174`) stamps `unit_price` from the
resolved calculation. Mercur runs two appended steps just after
creation:

- `linkLineItemToOfferStep` writes the
  `cart.LineItem ↔ Offer` link row (see **Line item ↔ Offer link**
  above) — this is the canonical pointer from the cart line to its
  offer.
- `decorateLineItemWithOffer` snapshots additional offer fields onto
  the line for display and downstream consumers: `seller_id`, `sku`,
  `shipping_profile_id`. `offer_id` itself is **not** copied onto
  the line item — it lives on the link row. These are immutable and
  feed the order-line snapshot at conversion time (see **Snapshots
  on order lines**).

### Performance

The per-offer `PriceSet` model has no hot-path performance issue:

- **Add to cart:** one bulk
  `calculatePrices({ id: priceSetIds }, { context })` call inside
  the override. Multi-item adds with mixed offers stay at one
  round-trip (all priceSetIds in one array).
- **Cart refresh / qty update:** **zero** pricing-module calls.
  Lines are `is_custom_price=true`, so Medusa skips repricing
  entirely.
- **Store product list:** one bulk `calculatePrices` call across
  every visible offer's `PriceSet` for the requested product /
  variants. The "N offers on one variant → N round-trips" pattern
  the previous architecture forced is gone; an unbounded number of
  offers is one DB round-trip.

Caching the Store API's per-variant offer-prices response in Redis
remains a viable optimisation if a single product gathers tens of
thousands of offers, but is not load-bearing for correctness.

## Authorization

Offer endpoints obey Mercur's standard auth surfaces (`/admin/*`,
`/vendor/*`, `/store/*`).

Minimum scopes:

- Vendor read of own offers requires `vendor:authenticated` + member role
  with `offers:read`.
- Vendor write requires `offers:write`.
- Admin read across all offers requires `admin:authenticated`.
- Store API exposes only offers where `deleted_at IS NULL` and the
  computed effective stocked quantity across all linked `InventoryItem`s
  is positive for the requested region's stock locations, scoped to the
  requested region/customer group.

The Offer module never grants payout, publish-variant, or commission
authority. Pricing writes always route through the pricing module,
stock writes through the inventory module; the offer module never
writes to `pricing` / `fulfillment` / `inventory` tables directly.

## Endpoint Contracts

The table is normative.

| Method | Endpoint | Auth | Required scope | Request | Success | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/vendor/offers` | session | `offers:read` | query: filters, pagination | `200 { offers: Offer[], count, offset, limit }` | `MedusaError.Types.UNAUTHORIZED` (401), `MedusaError.Types.INVALID_DATA` (400) |
| POST | `/vendor/offers` | session | `offers:write` | JSON: `{ sku, variant_id, shipping_profile_id, inventory_items: Array<{ inventory_item_id: string, required_quantity: number }>, price: { amount, currency_code, ... } }`. `inventory_items` mirrors Medusa's `CreateProductVariant.inventory_items` shape — every entry references an **existing** `InventoryItem` by `inventory_item_id`; provisioning new inventory items / seeding stock levels is the inventory module's concern and is not part of the offer create payload. The array must have at least one entry; duplicate `inventory_item_id` values in the same payload are rejected. | `201 { offer: Offer }` | `MedusaError.Types.INVALID_DATA` (400, includes duplicate inventory items), `MedusaError.Types.NOT_FOUND` (404, variant or referenced inventory item missing), `MedusaError.Types.DUPLICATE_ERROR` (409, `(seller_id, sku)` collision), `MedusaError.Types.UNAUTHORIZED` (401), `MedusaError.Types.NOT_ALLOWED` (403) |
| GET | `/vendor/offers/:id` | session | `offers:read` | path `id` | `200 { offer: Offer }` | `MedusaError.Types.NOT_FOUND` (404), `MedusaError.Types.NOT_ALLOWED` (403) |
| POST | `/vendor/offers/:id` | session | `offers:write` | path `id`, JSON: partial Offer carrying only the offer-row fields (`sku`, `shipping_profile_id`, etc.). Inventory-item link mutations go through `POST /vendor/offers/:id/inventory-items/batch`; price mutations go through `POST /vendor/offers/:id/prices/batch`. | `200 { offer: Offer }` | `MedusaError.Types.INVALID_DATA` (400), `MedusaError.Types.NOT_FOUND` (404), `MedusaError.Types.NOT_ALLOWED` (403) |
| POST | `/vendor/offers/:id/inventory-items/batch` | session | `offers:write` | path `id`, JSON: `{ create?: Array<{ inventory_item_id: string, required_quantity: number }>, update?: Array<{ inventory_item_id: string, required_quantity: number }>, delete?: Array<{ inventory_item_id: string }> }`. Mirrors Medusa's `POST /admin/products/:id/variants/inventory-items/batch` (`AdminBatchVariantInventoryItems`). Dispatches to `batchLinksWorkflow` from `@medusajs/core-flows` with offer-shaped link rows; `create` attaches, `update` rewrites `required_quantity` on existing link rows, `delete` dismisses them. | `200 { created, updated, deleted }` (matches `AdminProductVariantInventoryBatchResponse`) | `MedusaError.Types.INVALID_DATA` (400, duplicate `inventory_item_id` across operations or within `create`), `MedusaError.Types.NOT_FOUND` (404, offer or inventory item missing), `MedusaError.Types.NOT_ALLOWED` (403) |
| POST | `/vendor/offers/:id/prices/batch` | session | `offers:write` | path `id`, JSON: `{ create?: Array<{ currency_code: string, amount: number, min_quantity?: number \| null, max_quantity?: number \| null, rules?: Record<string, string> }>, update?: Array<{ id: string, currency_code?: string, amount?: number, min_quantity?: number \| null, max_quantity?: number \| null, rules?: Record<string, string> }>, delete?: Array<{ id: string }> }`. Same batch shape as Medusa's variant inventory-items batch, but applied to the offer's own `PriceSet` (`offer.price_set_id`). Mirrors `AdminCreateVariantPrice` / `AdminUpdateVariantPrice` per-row. Dispatches to `batchOfferPricesWorkflow`: `create` calls `pricingModule.addPrices(...)` on the offer's PriceSet (no `offer_id` `PriceRule` attached); `update` and `delete` resolve referenced `price.id`s only when their `price_set_id === offer.price_set_id` (any id outside that scope → `MedusaError.Types.NOT_FOUND`). | `200 { created, updated, deleted }` (matches `AdminProductVariantInventoryBatchResponse` shape) | `MedusaError.Types.INVALID_DATA` (400, malformed rows or duplicate `(currency_code, rules)` within `create`), `MedusaError.Types.NOT_FOUND` (404, offer or referenced `price.id` missing / not owned by this offer), `MedusaError.Types.NOT_ALLOWED` (403) |
| DELETE | `/vendor/offers/:id` | session | `offers:write` | path `id` | `200 { id, deleted: true }` (soft-delete) | `MedusaError.Types.NOT_FOUND` (404), `MedusaError.Types.NOT_ALLOWED` (403) |
| GET | `/admin/offers` | session | `admin:authenticated` | query: filters (incl. `seller_id`, `variant_id`) | `200 { offers: Offer[], count, offset, limit }` | `MedusaError.Types.UNAUTHORIZED` (401) |
| GET | `/admin/offers/:id` | session | `admin:authenticated` | path `id` | `200 { offer: Offer, audit_log: AuditEntry[] }` | `MedusaError.Types.NOT_FOUND` (404) |
| POST | `/admin/offers/:id/prices/batch` | session | `admin:authenticated` | path `id`, JSON: identical shape to the vendor batch above. Same `batchPricesWorkflow` is dispatched — the only difference vs the vendor route is the auth layer: admins can edit any seller's offer prices; vendor calls are scoped to their own seller via the `vendor` auth middleware. | `200 { created, updated, deleted }` | `MedusaError.Types.INVALID_DATA` (400), `MedusaError.Types.NOT_FOUND` (404), `MedusaError.Types.NOT_ALLOWED` (403) |
| POST | `/admin/sellers/:id/offers/bulk-delete` | session | `admin:authenticated` | path `id` | `202 { job_id }` | `MedusaError.Types.NOT_FOUND` (404), `MedusaError.Types.NOT_ALLOWED` (403) |
| GET | `/store/products/:id` | public | — | path `id`, query: `customer_group_id?`, `region_id?` | `200 { product, variants: Array<{ ..., offers: PublicOffer[] }> }` (ordered `price ASC, created_at ASC, id ASC`) | `MedusaError.Types.NOT_FOUND` (404) |

`PublicOffer` is the Store-API projection of an offer: `id`, `seller`,
`stock_status`, and the price resolved through the pricing module's
context query (`price`, `currency_code`, `original_price?` when a
`PriceList` applied).

Error conventions:

- Every offer endpoint throws Medusa's native `MedusaError` —
  there are no Mercur-specific error code names. The HTTP layer maps
  each `MedusaError.Types.*` to its standard status (`INVALID_DATA` /
  `INVALID_ARGUMENT` → 400, `UNAUTHORIZED` → 401, `NOT_ALLOWED` /
  `FORBIDDEN` → 403, `NOT_FOUND` → 404, `DUPLICATE_ERROR` /
  `CONFLICT` → 409) via Medusa's `exception-formatter` middleware.
- `(seller_id, sku)` uniqueness collisions throw
  `new MedusaError(MedusaError.Types.DUPLICATE_ERROR, …)` — no
  custom `OFFER_SKU_DUPLICATE` code.
- Inventory shortfalls during cart validate / place-order surface
  Medusa's native `MedusaError` with code
  `MedusaError.Codes.INSUFFICIENT_INVENTORY` (thrown by
  `confirmInventoryStep`); no Mercur-specific rewrap.

## Workflows and Events

Workflows owned by the offer module live under
`packages/core/src/workflows/offer/`:

Following Medusa's convention (`createProductVariantsWorkflow`,
`updateProductsWorkflow`, `deleteProductsWorkflow`), the offer
workflows operate on **batches** of offers and use plural names. A
single-offer call is just the N=1 case of the batch input. `delete`
implies soft-delete throughout the offer module — there is no hard
delete; the qualifier is dropped from the workflow name.

- `createOffersWorkflow` (covers F2 for one or many offers in a single
  transactional batch; orchestrates variant retrieval by `variant_id`
  via the product module — deduplicated per batch — creates a fresh
  per-offer `PriceSet` for each offer via pricing-module
  `createPriceSetsWorkflow` and seeds each one with the offer's
  `Price` rows in the same call (no `offer_id` `PriceRule` is
  attached) + inventory-module `createInventoryItemsWorkflow` for
  every new item across the batch + initial-level seed per item +
  offer rows inserted with `ean`/`upc` copied from each chosen
  variant and `price_set_id` set to the new PriceSet's id +
  `createLinksWorkflow` to register one offer ↔ inventory-item link
  row per attached item, carrying its `required_quantity`. Inputs
  and outputs are arrays; a single-offer vendor route passes a
  length-1 array.)
- `updateOffersWorkflow` (batch update; per offer, delegates price
  changes to pricing-module `addPrices` / `updatePriceSets` /
  `removePrices` scoped to that offer's own `price_set_id`; per-item
  level changes to inventory-module `updateInventoryLevelsWorkflow`.
  The offer row itself only carries identity, vendor `sku`,
  `price_set_id`, and singleton FK-shaped columns. Updates within a
  batch are atomic: a failure on any one offer rolls back the rest.)
  Inventory-item link mutations are **not** carried on the update
  payload — they go through the dedicated batch endpoint below.
- `batchOfferInventoryItemsWorkflow` (powers
  `POST /vendor/offers/:id/inventory-items/batch`; mirrors Medusa's
  `POST /admin/products/:id/variants/inventory-items/batch` shape and
  internally dispatches to `batchLinksWorkflow` from
  `@medusajs/core-flows` with `[OFFER_MODULE]:{offer_id}` /
  `[Modules.INVENTORY]:{inventory_item_id}` link rows and
  `required_quantity` carried on each row. Input matches
  `AdminBatchVariantInventoryItems` — `{ create, update, delete }` —
  scoped to a single offer via the route param. Output matches
  `AdminProductVariantInventoryBatchResponse` —
  `{ created, updated, deleted }`. Duplicate `inventory_item_id`s
  within `create` or across `create`/`update` are rejected with
  `MedusaError.Types.INVALID_DATA`.)
- `batchOfferPricesWorkflow` (powers
  `POST /vendor/offers/:id/prices/batch` and
  `POST /admin/offers/:id/prices/batch`; same `{ create, update,
  delete }` envelope as the inventory-items batch above, but the
  per-row shape mirrors Medusa's `AdminCreateVariantPrice` /
  `AdminUpdateVariantPrice` — `currency_code`, `amount`,
  `min_quantity?`, `max_quantity?`, `rules?` — and the workflow
  routes each operation to the pricing module against the offer's
  own `PriceSet` (`offer.price_set_id`). `create` calls
  `pricingModule.addPrices(...)` with `priceSetId = offer.price_set_id`;
  no `offer_id` `PriceRule` is attached. `update` resolves the
  referenced `price.id` against the offer's own PriceSet only —
  `pricingModule.listPrices({ price_set_id: offer.price_set_id })`
  bounds the candidate set, and any id outside it surfaces
  `MedusaError.Types.NOT_FOUND`. `delete` runs
  `pricingModule.removePrices(...)` after the same ownership check.
  Output matches the inventory batch shape —
  `{ created, updated, deleted }`. Duplicate
  `(currency_code, rules)` tuples within `create` are rejected with
  `MedusaError.Types.INVALID_DATA`.)
- No dedicated Mercur "decrement offers stock" workflow exists. The
  stock lifecycle (validate / reserve / decrement / release /
  restock) is implemented by:
    1. Hooking `addToCartWorkflow.hooks.validate` (and
       `updateLineItemInCartWorkflow.hooks.validate`) for the read-
       only add / qty-update check — no override of those workflows
       is required.
    2. Inline composition inside Mercur's existing
       `completeCartWithSplitOrdersWorkflow`
       (`packages/core/src/workflows/cart/workflows/complete-cart-with-split-orders.ts`)
       for the place-order path: a handler on the workflow's own
       `validate` hook for the pre-flight stock check, and the offer-
       aware `reserveInventoryStep(transform(input,
       prepareOfferInventoryInput))` written into the workflow body
       in place of the variant-shaped `reserveInventoryStep(...)`
       call it makes today, plus the inline-added
       `mirrorLineItemOfferLinksToOrderStep` after `createOrdersStep`.
       No `overrideWorkflow` is involved on this path — Medusa's
       `completeCartWorkflow` is not invoked by the Mercur Store cart
       route.
    3. Shipping same-id `overrideWorkflow` overrides of
       `createFulfillmentWorkflow`, `cancelOrderWorkflow`,
       `cancelOrderFulfillmentWorkflow`, and
       `confirmReceiveReturnRequestWorkflow`. Each override composes
       its Medusa steps verbatim and adds a `transform(input,
       prepareOfferInventoryInput)` → `<medusa inventory step>`
       composition at the appropriate point.
  See **Inventory Lifecycle** in the Domain Model section for the
  full table.
- `deleteOffersWorkflow` (batch soft-delete; sets `offer.deleted_at`
  on each input offer. The offer's `PriceSet` and its `Price` rows
  are **left intact** so historical order-line resolutions still
  succeed — the soft-deleted offer simply stops surfacing in any
  list/store query that filters `deleted_at IS NULL`. The workflow
  is the only delete path — there is no hard-delete workflow;
  `delete` always means soft-delete in this module. Operators can
  separately dismiss the link rows or delete the inventory items
  through their owning modules. A future `purgeOffersWorkflow`
  (operator-only, terminate-seller path) may call
  `pricingModule.deletePriceSets([offer.price_set_id])` to reclaim
  the per-offer PriceSet — out of scope for this revision.)
- Cart pricing lives entirely inside the same-id override of
  `addToCartWorkflow`
  (`packages/core/src/workflows/cart/workflows/add-to-cart.ts`).
  The override resolves each input item's `offer.price_set_id`,
  issues one
  `pricingModule.calculatePrices({ id: priceSetIds }, { context })`
  call, and writes `unit_price` + `is_custom_price=true` onto the
  items before they flow into Medusa's standard cart-line creation
  steps. After the lines are persisted, `linkLineItemToOfferStep`
  writes the `cart.LineItem ↔ Offer` link row.
  No `setPricingContext` hook is registered; no override of
  `getVariantsAndItemsWithPrices`, `updateLineItemInCartWorkflow`,
  `refreshCartItemsWorkflow`, or `createCartWorkflow` ships —
  Medusa's downstream paths honor the `is_custom_price=true` flag
  and never overwrite the snapshotted `unit_price`.
- `linkLineItemToOfferStep` (Mercur-appended step on
  `addToCartWorkflow` and `updateLineItemInCartWorkflow`; writes one
  `cart.LineItem ↔ Offer` link row per created cart line via Medusa's
  link service, no-op for items without an `offer_id`; compensator
  dismisses the rows it created)
- `mirrorLineItemOfferLinksToOrderStep` (Mercur step composed
  **inline** into `completeCartWithSplitOrdersWorkflow` immediately
  after `createOrdersStep`; reads each new order line's
  `metadata.cart_line_item_id` — stamped by Mercur's
  `prepareLineItemData` copy — joins against the
  `cart.LineItem ↔ Offer` rows by that key, and writes mirrored
  `order.OrderLineItem ↔ Offer` rows keyed by the new
  `order_line_item.id`s. Necessary because `createOrdersStep`
  generates fresh `orli_*` ids and discards cart-line identity.
  No `overrideWorkflow` is involved because the host workflow is
  already Mercur-owned.)

Emitted events (module-namespaced, mirroring Medusa's
`<entity>.<action>` convention — see `OrderWorkflowEvents`,
`PaymentEvents`, etc.):

- `offer.created`, `offer.updated`, `offer.deleted`.

Stock-exhaustion is **not** a module event. It is a derived condition
on top of inventory state: when any linked `InventoryItem`'s
`stocked_quantity` drops below its `required_quantity`, the offer's
effective stocked quantity becomes zero and the Store API stops
surfacing it (see Verification). Consumers that need to react to this
subscribe to Medusa's existing `inventory.inventory-level.updated` and
re-resolve the affected offers via Query — this matches how Medusa
itself handles stock changes (no `inventory.out_of_stock` event ships
in core).

## Testing

All offer behaviour is verified by integration tests under
`integration-tests/http/`, split by endpoint group (`vendor/`, `admin/`,
`store/`) per Mercur's convention. Every suite uses
`medusaIntegrationTestRunner` from `@medusajs/test-utils` against a real
Postgres + Redis and bootstraps actors via the helpers in
`integration-tests/helpers/` (`create-seller-user.ts`,
`create-admin-user.ts`, `create-customer-user.ts`,
`generatePublishableKey` / `generateStoreHeaders`). The canonical
two-seller bootstrap is in
`integration-tests/http/product/vendor/product.spec.ts`; the
seller-+-customer-+-store bootstrap is in
`integration-tests/http/cart/store/cart.spec.ts` — new files should mirror
those shells rather than reinvent setup.

New offer-owned files:

- `integration-tests/http/offer/vendor/offer.spec.ts`
- `integration-tests/http/offer/admin/offer.spec.ts`
- `integration-tests/http/offer/store/offer.spec.ts`

Cross-cutting behaviour that touches cart, order, inventory, or
price-list endpoints extends the existing files in those folders rather
than re-implementing setup. Run with:

```bash
bun run test:integration:http -- offer
bun run test:integration:http -- cart
bun run test:integration:http -- order
```

Never run `bun run test:integration:http` without a pattern — it fans
out across every package.

### `http/offer/vendor/offer.spec.ts`

Bootstrap `seller1` + `seller2` in `beforeEach`. Each `it` asserts both
HTTP status and the persisted row shape (re-read via the vendor list /
detail endpoint).

- A second vendor can create an offer on an existing master variant by
  selecting it explicitly. No variant fields are sent and the variant
  row is unchanged afterwards.
- No offer endpoint accepts variant-shaped fields; payloads carrying
  `title`, `options`, `weight`, etc. are rejected with HTTP 400 /
  `MedusaError.Types.INVALID_DATA`.
- `(seller_id, sku)` uniqueness:
  - Two vendors can create offers with the same `sku` value (different
    sellers) — both succeed.
  - One vendor cannot reuse a `sku` across two offers, regardless of
    variant — second call surfaces
    `MedusaError.Types.DUPLICATE_ERROR` (HTTP 409).
  - One vendor *can* create two offers on the same variant with
    different `sku`s — both rows exist and surface independently.
- Creating an offer with an unresolvable `variant_id` returns HTTP
  404 / `MedusaError.Types.NOT_FOUND`; assert that no offer row was
  inserted (vendor list count is unchanged).
- On offer creation `ean` / `upc` are copied from the chosen variant
  onto the offer row; editing the variant afterwards does not mutate
  the offer's stored GTIN copies.
- Multi-inventory create: a payload whose `inventory_items` array
  carries multiple `{ inventory_item_id, required_quantity }` entries
  succeeds and the link rows carry the requested `required_quantity`.
  A duplicate `inventory_item_id` in a single create payload returns
  HTTP 400 / `MedusaError.Types.INVALID_DATA`.
- `POST /vendor/offers/:id/inventory-items/batch` covers the link
  CRUD surface (mirroring Medusa's variant batch route): `create`
  attaches a new inventory item to the offer, `update` rewrites
  `required_quantity` on an existing link row, `delete` dismisses it.
  Edits made through this endpoint are observable in subsequent
  vendor reads and are the values used by
  later stock decrements (verified in the order suite below).
- Soft-deleting an offer:
  - sets `offer.deleted_at` and hides the offer from every list and
    Store API response;
  - leaves the offer's own `PriceSet` and its `Price` rows intact so
    historical order-line resolutions still resolve;
  - leaves the linked `InventoryItem`s and the offer ↔ inventory-item
    link rows intact;
  - sibling offers (each with their own `PriceSet`) are completely
    untouched.

### `http/offer/admin/offer.spec.ts`

Use `createAdminUser` from `integration-tests/helpers/`. After seeding
offers from two sellers in `beforeEach`:

- `GET /admin/offers` returns offers across every seller (operator
  sees the union, not a single-seller slice).
- `GET /admin/offers/:id` exposes the same field set as the
  vendor / store reads.
- Admin routes do not expose mutation of variant fields through offer
  endpoints (parity with the vendor surface).

### `http/offer/store/offer.spec.ts`

Use `generatePublishableKey` + `generateStoreHeaders` (see
`integration-tests/helpers/create-admin-user.ts`). After two sellers
each publish one offer against the same variant:

- `GET /store/products/:id` returns the variant with `offers` in the
  documented stable order (assert by id sequence).
- An offer disappears from `variant.offers` once its effective stocked
  quantity reaches zero — drive this by reducing one linked
  `InventoryItem` below its `required_quantity` through the inventory
  module; the storefront stops surfacing the offer with no explicit
  state transition. Raising the level back restores it.
- Bundle case: an offer with two inventory items (`required_quantity =
  1` each) is in-stock only while both items have stock. Selling one
  bundle decrements both items by one (verified end-to-end via the
  order suite).
- A newly-created offer is visible on the storefront immediately after
  the vendor create call returns — no draft / review state to clear.

### `http/cart/store/cart.spec.ts` (extend)

The existing seller + customer + store bootstrap is reused; new
assertions inside the same `describe`:

- `POST /store/carts/:id/line-items` requires `offer_id`. Omitting it
  surfaces `MedusaError.Types.INVALID_DATA` (HTTP 400). The same is
  true for the patched Medusa default route.
- Adding two offers on the same variant produces two distinct cart
  line items keyed off `cart.LineItem ↔ Offer`. Mercur's patched
  `getLineItemActionsStep` differentiates by `offer.id` (queried
  through the link); no offer silently overwrites another.
- Each cart line's `unit_price` is calculated against its offer's
  own `PriceSet` (`offer.price_set_id`). The binding survives qty /
  region / promotion refreshes because the `getVariantsAndItemsWithPrices`
  override reads `line_item.offer.price_set.id` via Query on every
  refresh.
- Adding a line with `offer_id = X` resolves to offer X's prices.
  Sibling offers Y and Z have independent `PriceSet`s and never
  participate in line X's `calculatePrices` candidate set.
- A cart with N lines across N different offers refreshes its prices
  in **one** `pricingModule.calculatePrices` round-trip (assert by
  spying on the pricing module's service or by counting SQL hits in
  the integration test environment).
- A runtime call to `addToCartWorkflow.run({ items: [{ variant_id,
  quantity }] })` that bypasses the TypeScript check throws
  `new MedusaError(MedusaError.Types.INVALID_DATA, …)` from the
  override's first step. The TS-compile guard
  on the augmented input is covered by a `// @ts-expect-error` block
  in a type-only test inside the same file.

### `http/order/store/order.spec.ts` (extend)

Drive a cart through `POST /store/carts/:id/complete`. Cover:

- The workflow (`completeCartWithSplitOrdersWorkflow`) mirrors every
  `cart.LineItem ↔ Offer` row into a matching `order.OrderLineItem ↔
  Offer` row keyed by the new `order_line_item.id`. Re-read the order
  via Query along `order_line_item.offer` and assert the pointer.
- Order placement atomically decrements **each** linked
  `InventoryItem`'s stocked quantity, scaled by its `required_quantity`,
  through the inventory module — and never overshoots into negative
  (place an order that would over-draw a linked item and assert the
  call fails with no partial decrement).
- A multi-vendor cart splits into one order per seller; each child
  order only carries its own offer link rows.
- Bundle decrement: one bundle sale decrements all linked items in a
  single transactional batch.

### `http/order/vendor/order.spec.ts` (extend)

- Order-line snapshots are immutable: after order placement, mutate
  the offer (price edits, soft delete) and assert the order line's
  recorded title / SKU / unit price are unchanged.

### `http/inventory-items/vendor/inventory-items.spec.ts` (extend)

- `dismissLinksWorkflow` detaches one inventory item from an offer.
  Assert the inventory item itself is unchanged, the other offer
  linking to the same item still resolves stock through that item, and
  the offer that was detached recomputes its effective stocked quantity
  without it.

### `http/price-lists/` (extend or add `store/offer-rule.spec.ts`)

- A `PriceList` containing one `Price` row targeting offer `off_Y`'s
  `PriceSet` (`offer.price_set_id` of `off_Y`) applies its SALE /
  OVERRIDE logic only on cart lines whose offer is `off_Y`. Sibling
  offers (with their own `PriceSet`s) never see the list's Prices,
  by construction.
- Tier ladders and PriceList promotions defined on one offer's
  `PriceSet` do not affect a sibling offer's `PriceSet` (structurally
  impossible because they are separate `PriceSet`s).
- Mercur does not accept `PriceListRule { attribute: "offer_id" }`
  on PriceLists — a focused test creating one returns
  `MedusaError.Types.INVALID_DATA` from the `batchOfferPricesWorkflow`
  / PriceList write path so the per-line cart-pricing invariant
  cannot regress.

### Auditing

Every offer write must record an audit row containing actor id (member
or admin), offer id, seller id, mutation kind, timestamp, and the
before / after offer revision. The vendor and admin suites above each
cover one mutation (create / update / delete) and assert the audit row
is present via Query.

## Deferred Follow-Up Areas

Tracked but out of this spec's scope; each is a candidate for a
follow-up spec without altering the base offer record shape:

- Explicit offer lifecycle state machine (`draft`,
  `pending_validation`, `active`, `inactive`, `suspended`, `expired`,
  `archived`).
- Validity windows (`available_start_date` / `available_end_date`) and a
  scheduled expiry job.
- Operator-driven suspension with reason codes and dispute trail.
- Rule-driven auto-suspension from seller SLA metrics.
- Warranty, compliance metadata (GPSR, age-gating, ID checks), pickup
  options, and FBM markers.
- B2B contract pricing beyond what `PriceList` + `PriceRule` already
  express.
- Cross-vendor offer analytics (price-history graphs, buybox win-rate
  dashboards).
- Marketplace-operated fulfilment (FBM) execution paths beyond the
  existing shipping-profile model.
- **Lead time to ship**: vendor- or offer-level delivery promises
  (`lead_time_to_ship_days`) exposed on the storefront and snapshotted on
  order lines. Out of scope for this revision.
- **Offer import**: vendor-facing CSV / file-feed catalog upload with
  partial-update row semantics, async job tracking, and per-row error
  reporting. Tracked here because it is the natural next surface to add;
  out of scope for this revision.
- **High-frequency repricer endpoint**: API for seller-operated
  repricers to push `(sku, price?, stock?)` updates at hundreds of
  writes per minute, with per-seller rate limiting and idempotency.
  Pairs naturally with offer import. Out of scope for this revision.
- Inbound offer feeds via third-party connectors.

## User-Visible Behavior

When this spec is satisfied, a marketplace operator running Mercur can
see all of the following end-to-end:

1. Two vendors create offers against the same variant by selecting it
   from the master catalog; both appear in the variant's `offers`
   array on the storefront in the documented stable order, and the
   storefront decides which one to bind the buy button to.
2. Each vendor can use their own `sku` namespace independently;
   the same `sku` value across two sellers does not collide.
3. One vendor can list the same variant twice under different
   `sku`s (e.g. different package sizes).
4. A customer places an order on one vendor's offer; every
   `InventoryItem` linked to that offer decrements atomically through
   the inventory module (each by `quantity * required_quantity`) and the
   other vendor's offer (with its own `InventoryItem`s) is untouched.
5. A vendor lists a bundle (e.g. "Shoes + Laces") as a single offer by
   attaching two `InventoryItem`s with `required_quantity = 1` each; the
   storefront shows the offer as in-stock only while both items have
   stock. Selling one bundle decrements both items by one.
6. When the effective stocked quantity of a vendor's offer reaches zero
   (any linked `InventoryItem` dropping below its `required_quantity`),
   the storefront stops surfacing the offer; raising the inventory level
   back above the requirement through the inventory module brings it
   back.
7. A newly-created offer is visible on the storefront immediately after
   the create call returns — there is no draft, approval, or review
   state to clear.

## Verification

Verification is an end-to-end pass plus targeted integration tests. The
spec moves to `passing` only when all of the following are true:

1. `bun run lint` and `bun run build` pass at the repo root.
2. Integration tests live under `integration-tests/http/offer/` split
   into `vendor/`, `admin/`, and `store/` per Mercur's testing
   convention, and they pass against a real Postgres + Redis via
   `medusaIntegrationTestRunner`.
3. The Regression Coverage list above is exercised by at least one test
   each.
4. A manual end-to-end pass through the scenarios in **User-Visible
   Behavior** is executed against `bun run dev` with two seller accounts
   and one storefront, and recorded in **Evidence**.
5. **Per-offer `PriceSet` invariants** are covered by integration
   tests:
   - Every persisted offer row has a non-null `price_set_id` and the
     resolved `offer.price_set` Query traversal returns a populated
     `PriceSet`.
   - Sibling offers on the same variant resolve to **different**
     `price_set_id`s.
   - A cart of N lines across N different offers refreshes in one
     `pricingModule.calculatePrices` round-trip (spy/counter against
     the pricing module service).
   - `GET /store/products/:id` with M visible offers across the
     product's variants resolves prices in one
     `pricingModule.calculatePrices` round-trip (same spy/counter).
   - Soft-deleting an offer leaves `offer.price_set` resolvable
     (historical order lines still resolve unit price by `price.id`);
     a follow-up operator-only purge (out of scope here) is the only
     path that hard-deletes the `PriceSet`.

## Evidence

### 2026-05-20 — Foundation landed (module skeleton + links)

Scope of this drop: the data layer and cross-module wiring only. No
workflows, API routes, cart override, or inventory-lifecycle code has
shipped yet — those are tracked as the next slices of this in-progress
spec.

- **Module:** `packages/core/src/modules/offer/`
  - `index.ts` — registers `Module(MercurModules.OFFER, { service: OfferModuleService })`.
  - `service.ts` — `OfferModuleService extends MedusaService({ Offer })`.
  - `models/offer.ts` — `Offer` entity with the columns and partial
    unique index `(seller_id, sku) WHERE deleted_at IS NULL` plus the
    lookup indexes called out in **Uniqueness and indexes**.
  - `migrations/Migration20260520104835.ts` — creates the `offer`
    table and all indexes.
- **Types:** `MercurModules.OFFER = "offer"` added in
  `packages/types/src/modules.ts`.
- **Cross-module links** (`packages/core/src/links/`):
  - `offer-variant-link.ts` — read-only on `offer.variant_id` →
    `ProductModule.linkable.productVariant`.
  - `offer-seller-link.ts` — read-only on `offer.seller_id` →
    `SellerModule.linkable.seller`.
  - `offer-shipping-profile-link.ts` — read-only on
    `offer.shipping_profile_id` →
    `FulfillmentModule.linkable.shippingProfile`.
  - `offer-price-set-link.ts` — read-only on `offer.price_set_id` →
    `PricingModule.linkable.priceSet`.
  - `offer-inventory-item-link.ts` — writable many-to-many to
    `InventoryModule.linkable.inventoryItem` with
    `database.table = "offer_inventory_item"` and
    `database.extraColumns.required_quantity` (`integer`, default
    `"1"`), mirroring Medusa's `product_variant_inventory_item` join.
- **Verification:** `packages/core` `bun run build` (tsc) passes
  cleanly. `bun run lint` reports zero new warnings/errors against
  the new files (the repo-wide 55 errors / 1347 warnings are the
  pre-existing oxlint baseline noted in `claude-progress.md` Session 3
  and the canary `packages/admin` `product-variant-detail.tsx` build
  failure originates from commit `90248d55` — both unrelated to this
  drop).

### 2026-05-20 — F2 create workflow + CRUD API routes + first integration test

- **Workflows** (`packages/core/src/workflows/offer/`):
  - `createOffersWorkflow` (F2): validates referenced variants /
    inventory items via `useQueryGraphStep`, calls Medusa's
    `createPriceSetsStep` (one fresh `PriceSet` per offer, seeded
    with the offer's `Price` rows), inserts offer rows with
    `price_set_id` + `ean` / `upc` snapshotted from the chosen
    variant, then calls `createRemoteLinkStep` to write one
    `OFFER ↔ INVENTORY` link row per attached inventory item carrying
    `required_quantity`. Emits `offer.created`.
  - `updateOffersWorkflow`: offer-row-only updates (`sku`,
    `shipping_profile_id`, `metadata`); compensator restores prior
    values. Emits `offer.updated`.
  - `deleteOffersWorkflow`: soft-delete via `softDeleteOffers`;
    compensator restores. Emits `offer.deleted`. `PriceSet` and
    inventory links are left intact per **Mutation contract**.
  - Steps: `createOffersStep`, `updateOffersStep`, `deleteOffersStep`
    (each with a compensator).
  - Events declared on `OfferWorkflowEvents` in
    `packages/core/src/workflows/events.ts`.
- **Vendor API routes** (`packages/core/src/api/vendor/offers/`):
  - `route.ts` — `GET /vendor/offers` (filtered to the request's
    seller via `applySellerOfferFilter`) and
    `POST /vendor/offers` (pre-check rejects duplicate
    `(seller_id, sku)` with `DUPLICATE_ERROR` → HTTP 409, then
    dispatches `createOffersWorkflow`).
  - `[id]/route.ts` — `GET` / `POST` / `DELETE /vendor/offers/:id`
    with `validateSellerOffer` enforcing the seller scope on every
    read/write.
  - `validators.ts`, `query-config.ts`, `middlewares.ts`, `helpers.ts`
    follow the campaigns / inventory-items conventions.
- **Admin API routes** (`packages/core/src/api/admin/offers/`):
  - `GET /admin/offers` (filterable by `seller_id`, `variant_id`,
    `sku`, `ean`, `upc`) and `GET /admin/offers/:id`. Write paths are
    deferred until the batch endpoints land.
- **Middleware wiring**: `vendorOffersMiddlewares` registered on
  `packages/core/src/api/vendor/middlewares.ts`,
  `adminOffersMiddlewares` on the admin counterpart.
- **First integration test**
  (`integration-tests/http/offer/vendor/offer.spec.ts`): bootstraps
  two seller users, creates per-seller product variants, inventory
  items, and shipping profiles. Covers happy-path create, 404 on
  unknown `variant_id`, 409 on duplicate `(seller_id, sku)`, two
  sellers sharing the same `sku`, one seller creating two offers on
  the same variant with distinct `sku`s (different
  `required_quantity` per offer), 400 on duplicate
  `inventory_item_id` within a single create payload, seller-
  scoped list, 404 cross-seller detail read, and soft-delete.
- **Verification**: `bunx tsc --noEmit` on `packages/core` is clean.
  `bun run build` (mercur codegen + `tsc --declaration`) on the same
  package is clean. `bunx oxlint packages/core/src/{api,workflows}/...
  offers ...offer` reports `0 errors / 16 warnings` — all
  `no-shadow` warnings on the standard Medusa
  `transform(input, ({ input }) => …)` idiom that the existing
  `terminate-seller` / similar workflows also use. The repo-wide
  oxlint baseline therefore moves from 55 errors / 1347 warnings →
  55 errors / 1363 warnings (no new errors).

### Pending work to move this spec to `passing`

- Wire `bun run test:integration:http -- offer/vendor/offer` against
  a real Postgres + Redis. (Type-check is clean; runtime verification
  is the next slice.)
- Cart override: same-id `addToCartWorkflow` that resolves
  `offer.price_set_id` and writes `unit_price` + `is_custom_price`
  on input items.
- `completeCartWithSplitOrdersWorkflow` inline additions: validate
  stock, offer-aware reservation, `mirrorLineItemOfferLinksToOrderStep`.
- Same-id overrides for `updateLineItemInCartWorkflow`,
  `createFulfillmentWorkflow`, `cancelOrderWorkflow`,
  `cancelOrderFulfillmentWorkflow`,
  `confirmReceiveReturnRequestWorkflow`.
- Mercur-owned cart util rewrites in
  `packages/core/src/workflows/cart/utils/` to read
  `items.offer.price_set.*` / `items.offer.inventory_items.*`
  instead of the now-absent `items.variant.manage_inventory` /
  `items.variant.inventory_items.*` paths.
- Integration tests under `integration-tests/http/offer/{vendor,admin,store}/`
  and the cart/order extensions enumerated under **Testing**.

## Notes

- The Offer module is intentionally **thin**. Anything Medusa already
  models well — pricing, shipping rates, inventory levels, variant
  identity — stays in Medusa. The offer module reads that state via
  module links resolved by Query, and mutates it through the owning
  module's service (`IPricingModuleService`,
  `IFulfillmentModuleService`, `IInventoryService`,
  `IProductModuleService`) or Medusa's link service (for the offer ↔
  inventory-item link itself). The offer record itself only carries the
  small set of marketplace-specific fields Medusa does not model:
  vendor ownership, vendor SKU, denormalized GTIN copies, and
  singleton FK-shaped references to the linked Medusa entities. **Stock
  is not one of those fields** — it lives entirely on the linked
  `InventoryItem`(s). `PriceSet` **is** one of those references —
  every offer owns its own `PriceSet` via `offer.price_set_id`. An
  offer may link to **multiple** inventory items (e.g. for bundles)
  via Medusa's writable many-to-many link with `required_quantity`
  per row — exactly the model Medusa uses for
  `ProductVariant ↔ InventoryItem`.
- The per-offer `PriceSet` model means each offer's prices live on
  their own `PriceSet`, structurally isolated from sibling offers.
  Cart pricing snapshots the offer's resolved unit price onto the
  cart line at add-time inside Mercur's same-id override of
  `addToCartWorkflow` — one
  `calculatePrices({ id: priceSetIds }, { context })` call per add
  invocation, zero pricing-module calls on refresh / qty update.
  The Store API's product-list endpoint issues one additional bulk
  `calculatePrices` call across every visible offer's `PriceSet`
  per request. Tiers, region prices, and PriceLists work
  per-offer naturally at add-time — see **Pricing Architecture**.
  Tier-on-qty-change, region-mid-cart, and mid-cart PriceList
  activation are deliberately frozen at the add-time snapshot;
  if a buyer wants those to apply they remove + re-add the line.
- `(seller_id, sku)` is the canonical uniqueness key. The vendor's SKU
  is their own namespace label and is the upsert key for every vendor
  write path. The GTIN-class identifier (`ean` / `upc`) is a denormalized
  copy from the chosen variant — useful for vendor-side search and
  display, but never used as a matching key on writes.
- Offers have no status / lifecycle column. Visibility is implied by
  `deleted_at IS NULL` on the offer plus a positive **effective stocked
  quantity** computed across all linked `InventoryItem`s (the MIN of
  `floor((stocked - reserved) / required_quantity)` per linked item). A
  successful create makes the offer live on the storefront immediately,
  with no review queue.
- State lifecycle, suspension, expiry, and warranty fields can be
  layered onto this base record in dedicated follow-up specs without
  disturbing the identity, pricing, fulfilment, or stock contracts
  established here.
