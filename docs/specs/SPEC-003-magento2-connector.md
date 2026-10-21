---
status: not_started
canonical: true
priority: 3
area: "integrations"
created: 2026-10-21
last_updated: 2026-10-21
---

# SPEC-003 Magento 2 connector (1P + 3P marketplace on an existing shop)

Mercur becomes the marketplace backend for an operator who already runs a
Magento 2 / Adobe Commerce store. Magento keeps the storefront, cart,
checkout, customer payment, and the operator's own first-party (1P)
products. Mercur owns sellers, third-party (3P) offers, seller product
submissions, order splitting, commissions, and payouts. A Composer package,
`mercurjs/magento2-connector` (public repo
`github.com/mercurjs/magento2-connector`), bridges the two.

The connector is a replicated cache of Mercur data inside Magento plus hooks
at four seams: offers in, taxonomy out and seller products in, orders out,
payment settlement. Nothing on the storefront path calls Mercur live except
the shipping quote at checkout.

This spec has two halves. **Part A** is the integration surface Mercur must
grow so that any external storefront can drive it. **Part B** is the Magento
package itself. Part A lands in this repo; Part B lands in the connector
repo and is tracked here only at the contract level.

## Split of responsibilities

| Concern | Owner |
| --- | --- |
| Category tree, attribute set, 1P products, 1P stock and price | Magento |
| Storefront, cart, checkout, customer payment capture, customer accounts | Magento |
| Sellers, members, onboarding, approval | Mercur |
| 3P offers (SKU, price, stock, shipping profile, lead time) | Mercur |
| Seller product submissions and the change-request pipeline | Mercur |
| Per-seller order split, commission lines, payouts | Mercur |
| Seller fulfillment, returns, messaging | Mercur vendor panel |

## Entity mapping

### Catalog: Magento product ↔ Mercur master product

| Magento | Mercur | Direction | Notes |
| --- | --- | --- | --- |
| `catalog_product_entity.sku` | `product.variants[].sku` | both | SKU is the join key on every surface. Simple product → product with one variant. Configurable product → product with one variant per child, options from the super attributes. |
| `catalog_product_entity.entity_id` | `product.metadata.magento_id` | Magento → Mercur | Kept for round trips; never the join key. |
| Category tree (`catalog_category_entity`) | `product_category` | Magento → Mercur | Pushed on category save/delete. `metadata.magento_id` on each category. Handle derived from the URL key. |
| EAV attributes in the "marketplace" attribute group | `product_attribute` (global) | Magento → Mercur | `select` → `single_select`, `multiselect` → `multi_select`, `text`/`textarea` → `text`, `boolean` → `toggle`, numeric with unit → `unit`. Configurable super attributes map to `is_variant_axis: true`. `is_filterable_in_search` → `is_filterable`. Attribute `handle` = Magento `attribute_code`, which is the join key. |
| Attribute options | `product_attribute_value` | Magento → Mercur | Option id stored in value `metadata.magento_option_id`; value `name` = option label of the admin store. |
| Seller-created product, `status: published` | New Magento product, `mercur_product = 1`, attribute set resolved from the Mercur category | Mercur → Magento | Created on the `product.published` webhook or the hourly product pull. Operator can still edit it in Magento; edits do not flow back (products stay Mercur-mastered for sellers). |
| Product `status: draft/proposed/rejected` | nothing | — | Only published products reach Magento. |

**Reading attributes from Mercur.** The product delta (`GET /admin/products`) returns each
product with the wrapped `attributes` array produced by
`enrichProductAttributes` in `packages/core/src/api/utils/format-product-attributes.ts`,
not the raw `product_attribute_values` link rows. Each entry is:

```
{ id, name, handle, type, is_variant_axis, is_required, rank, is_scoped,
  values:     [{ id, name, rank }],   // what this product selected
  all_values: [{ id, name, rank }] }  // the attribute's full option list
```

The Magento importer maps it as follows:

| Wrapped attribute | Magento | Notes |
| --- | --- | --- |
| `is_scoped: false`, `handle` matches an `attribute_code` | Existing EAV attribute in the product's attribute set | `values[].name` resolved to option ids by label; `all_values` used to create missing options first so the import never fails on a new seller-added option. |
| `is_scoped: false`, no matching `attribute_code` | New EAV attribute created in the "marketplace" group, code = `handle` | Type mapped by the inverse of the table above. Rank → `position`. |
| `is_scoped: true` (one-off, product-level) | `mercur_scoped_attributes` JSON attribute on the product, rendered as an extra "Details" block | Magento has no per-product attribute definitions, so scoped attributes are stored verbatim, never promoted to EAV. |
| `is_variant_axis: true` | Super attribute of the configurable product | Each `values[].name` becomes a child simple product; the variant SKU comes from the Mercur variant. |
| `type: unit` | Decimal attribute plus a sibling `<code>_unit` text attribute | Unit label is stored separately so Magento sorting and filtering stay numeric. |
| `type: toggle` | Boolean attribute | |

A 1P product is a Magento product with no Mercur counterpart requirement. A
3P-only product is a Mercur product mirrored into Magento. A shared product
(1P + 3P on the same SKU) is a Magento product that also exists in Mercur,
which is the normal case after taxonomy sync and allowlisting.

### Offers: Mercur offer → Magento offer mirror

Mercur is the only writer of offers. Magento holds a read-only mirror.

| Mercur `offer` + calculated price | Magento `mercur_offer` row | Notes |
| --- | --- | --- |
| `id` | `offer_id` | |
| `sku` (seller SKU) | `seller_sku` | |
| `variant.sku` | `product_sku` | Join to `catalog_product_entity.sku`. |
| `seller_id`, `seller.name`, `seller.handle`, `seller.is_premium` | `seller_id`, `seller_name`, `seller_handle`, `premium` | Seller rows also mirrored in `mercur_seller`. |
| `calculated_price.calculated_amount` per region | `price` per Magento website | Region ↔ website mapping is configured in the admin (`mercur/general/region_map`). |
| `calculated_price.original_amount` | `origin_price` | Drives the strike-through. |
| quantity-tier prices | `price_ranges` (JSON) | |
| `inventory.stocked_quantity - reserved_quantity` | `quantity` | Pulled with the offer; `manage_inventory: false` → unlimited. |
| `allow_backorder` | `allow_backorder` | |
| `leadtime_to_ship` (falls back to `seller.default_leadtime_to_ship`) | `leadtime_to_ship` | |
| `shipping_profile_id` | `shipping_profile_id` | Used only to call the shipping quote. |
| `condition.name` | `condition` | New, used, refurbished labels. |
| `seller.status`, `seller.closed_from/closed_to` | `active` | An offer is inactive when the seller is not `open` or is inside a closure window. |
| `updated_at` | `updated_at` | Delta sync cursor. |

The 1P candidate is not a row in `mercur_offer`. The indexer treats the
Magento product's own price and salable quantity as "offer zero" with
`seller_id = null`.

### Orders: Magento order → Mercur order group

| Magento | Mercur | Notes |
| --- | --- | --- |
| `sales_order.increment_id` | `order_group.metadata.external_id`, `order.metadata.external_id` | Commercial id for every lookup in both directions. |
| `sales_order_item` with `mercur_offer_id` | line item on the child order of that offer's seller | Only 3P lines are sent. 1P lines stay a normal Magento order. |
| `sales_order_item.qty_ordered`, `base_price`, `base_row_total`, tax amounts | line item `quantity`, `unit_price`, tax lines | Prices are sent as captured; Mercur does not reprice. |
| Shipping method chosen per seller at checkout | `shipping_method` on each child order | From the shipping quote response (`shipping_option_id`). |
| Customer email, billing and shipping address | `customer` (guest or matched by email), addresses on each child order | No Medusa customer account is required. |
| Captured payment amount | `payment_collection` on the external provider | See settlement. |
| child `order.id` | `sales_order_item.mercur_order_id`, `sales_order.mercur_order_group_id` | Written back from the create response. |
| child `order.fulfillment_status`, tracking | `sales_order_item.mercur_status`, shipment with tracking | Via webhook. |

### Shipping

Magento asks Mercur for per-seller shipping options for the 3P lines and
renders them as one Magento shipping method per seller. 1P lines use the
operator's normal Magento carriers. Totals combine on the Magento quote.

### Settlement

Magento captures the full amount. Mercur records that amount on an
**external payment provider** so commission lines and payouts run on real
numbers. Refunds start in Mercur (seller or operator) and are executed in
Magento as a credit memo, then confirmed back. Payouts never leave Mercur.

## Mercur endpoints the connector uses

Verified against `packages/core/src/api`. Most of the integration surface
already exists; the connector talks to the admin API with an API key for
sync and to the store API with a publishable key for checkout.

| Purpose | Endpoint | How the connector uses it |
| --- | --- | --- |
| Offer delta | `GET /admin/offers?updated_at[$gte]=<cursor>&order=updated_at&limit=100&offset=` | Default fields already include `seller.name/handle`, `product_variant.sku`, `condition`, `shipping_profile`, `prices[]` (amount, currency, min and max quantity, price rules), `inventory_items[]`. Add `fields=+inventory_items.inventory_item.location_levels.stocked_quantity,+inventory_items.inventory_item.location_levels.reserved_quantity,+deleted_at` for stock and removal. |
| Offer price as the storefront sees it | `GET /store/offers?product_id=&region_id=<region of the website>` | Returns `calculated_price` per offer for that region, computed with the same code the store uses. Used by the indexer to populate `price`, `origin_price` and quantity tiers per website; the admin list above is the source of truth for existence and stock. |
| Seller delta | `GET /admin/sellers?updated_at[$gte]=<cursor>&status=open,suspended,terminated` | Fields include `status`, `is_premium`, `closed_from`, `closed_to`, `default_leadtime_to_ship`. Mirrored into `mercur_seller`. |
| Published product delta | `GET /admin/products?status=published&updated_at[$gte]=<cursor>` | The route already calls `enrichProductAttributes`, so `attributes` arrives in the wrapped shape used by the catalog importer. Includes variants, categories, images. |
| Category push | `GET /admin/product-categories?handle=<url_key>` then `POST /admin/product-categories` or `POST /admin/product-categories/:id` | Create accepts `name`, `handle`, `parent_category_id`, `rank`, `is_active`, `attribute_ids`, `metadata`. Upsert is "look up by handle, then create or update"; `metadata.magento_id` is stored on the category. |
| Attribute push | `GET /admin/product-attributes?handle=<attribute_code>` then `POST /admin/product-attributes` or `POST /admin/product-attributes/:id` | Create accepts `name`, `handle`, `type`, `is_required`, `is_filterable`, `is_variant_axis`, `rank`, `category_ids`, inline `values[]`. New options later go through `POST /admin/product-attributes/:id/values`. |
| Shadow cart for checkout | `POST /store/carts` (Medusa), `POST /store/carts/:id/line-items { offer_id, quantity }`, `POST /store/carts/:id` with addresses and email | Mercur line items are keyed by `offer_id`, not variant, so the shadow cart carries exactly the 3P lines. 1P lines never reach Mercur. |
| Per-seller shipping options | `GET /store/shipping-options?cart_id=` | Returns `shipping_options` as a map `seller_id → option[]`. Magento renders one shipping method per seller. |
| Choose shipping per seller | `POST /store/carts/:id/shipping-methods { option_id }` once per seller | |
| Record the externally captured payment | `POST /store/payment-collections` + `POST /store/payment-collections/:id/payment-sessions { provider_id: "pp_external_external" (Medusa registers providers as pp_<module>_<id>) }` (Medusa) | The external provider authorizes immediately with the Magento transaction id and amount; see A.1 provider. |
| Create the per-seller orders | `POST /store/carts/:id/complete` | Runs `completeCartWithSplitOrdersWorkflow`: splits by seller, writes commission lines, links the order group. Returns `{ type: "order_group", order_group }` with child orders; their ids are written back onto the Magento order and items. `order_group.cart_id` points at the shadow cart, which satisfies the non-null constraint on that column. |
| Order status pull | `GET /admin/orders?id=<child ids>` and `GET /admin/orders/:id/commission-lines` | Used until outbound webhooks (A.1) exist, then only as a reconciliation fallback. |
| Payout visibility | `GET /admin/payouts`, `GET /admin/orders/:id/commission-lines` | Read-only, for the Magento admin to link out to the Mercur admin. Commission and payout calculation happen only in Mercur. |

**Where the money logic lives.** Commission lines are computed in Mercur on
each child order at cart completion from the commission rules configured in
the Mercur admin. Payouts are computed and transferred by Mercur's payout
module from the captured payment on each child order, through the configured
payout provider. Magento only captures the customer's payment and reports
the amount. Neither commissions nor payouts are ever computed in Magento.

## Part A: Mercur additions (this repo)

Two kinds of change. **A.1** is a new Medusa plugin package,
`packages/plugins/magento2-connector`, built the way Medusa builds
`packages/plugins/loyalty` (`medusa plugin:build`, `.medusa/server` output,
`src/{modules,providers,api,subscribers,jobs,workflows,types}`), and the way
this repo already builds `packages/providers/payout-stripe-connect`. It holds
everything Magento-specific: webhooks, the external payment provider, the
external refund route, and the channel-scoped routes. **A.2** is the short
list of changes that must land in `packages/core` because a plugin cannot
reach them: missing events, soft-delete visibility, order-group metadata, a
scoped role. Nothing in A.2 mentions Magento.

### A.1 Plugin: `packages/plugins/magento2-connector`

npm name `@mercurjs/magento2-connector-plugin` (the Composer package on the
Magento side is `mercurjs/magento2-connector`; the suffix keeps the two
apart in search). Add `packages/plugins/*` to the root `workspaces` and to
`turbo.json` build inputs.

```
packages/plugins/magento2-connector/
  package.json            medusa plugin:build; exports ./modules/magento-webhook, ./providers/payment-external, ./workflows, ./types
  tsconfig.json           copied from packages/providers/payout-stripe-connect
  README.md               install steps: plugin entry in withMercur, provider entry in the payment module, env vars
  src/
    modules/magento-webhook/
      index.ts            Module("magento_webhook", { service }); tables are prefixed magento_webhook_* so a future core webhook module cannot collide
      models/
        magento-webhook-endpoint.ts    id (mwhe_), url, secret, events: string[], is_active, description, metadata
        magento-webhook-delivery.ts    id (mwhd_), endpoint_id, event, payload (json), status: pending|delivered|failed|dead, attempts, next_attempt_at, response_status, response_body, delivered_at
      service.ts          MedusaService({ MagentoWebhookEndpoint, MagentoWebhookDelivery }) + sign(payload, secret) HMAC-SHA256, + listDue(now)
      migrations/
    providers/payment-external/
      index.ts            ModuleProvider(Modules.PAYMENT, { services: [ExternalPaymentProviderService] })
      service.ts          identifier "external". initiatePayment stores { reference, amount, captured_at, channel } from session data; authorizePayment → "authorized"; capturePayment → "captured" with the same reference; refundPayment → ok, records { reference } (money moved outside); cancel/delete → ok; getWebhookActionAndData → not_supported
    workflows/
      enqueue-magento-webhook-deliveries.ts     input { event, payload }; step: load active endpoints subscribed to event, create one delivery per endpoint
      deliver-magento-webhook.ts        input { delivery_id }; steps: sign, POST with X-Mercur-Signature + X-Mercur-Event + X-Mercur-Delivery, record response, schedule retry (1m, 5m, 30m, 2h, 12h, then dead)
      record-external-refund.ts         input { order_id, amount, reference, note }; steps: refundPaymentWorkflow (Medusa, provider no-ops), refreshOrderCommissionLinesWorkflow (core), emit "order.refund_recorded"
    subscribers/
      fan-out.ts          one subscriber per event in EVENTS (below); each runs enqueueMagentoWebhookDeliveriesWorkflow with { event, payload: event.data }
      deliver-on-create.ts  on "magento_webhook_delivery.created" runs deliverMagentoWebhookWorkflow so the first attempt is immediate
    jobs/
      retry-magento-webhook-deliveries.ts   every minute; listDue(now) → deliverMagentoWebhookWorkflow each
      prune-magento-webhook-deliveries.ts   daily; delete delivered rows older than 30 days
    api/
      admin/magento/webhooks/route.ts, [id]/route.ts, [id]/deliveries/route.ts, [id]/deliveries/[delivery_id]/redeliver/route.ts
      admin/magento/orders/[id]/refunds/external/route.ts   POST { amount, reference, note } → recordExternalRefundWorkflow
      middlewares.ts      validators + authenticate("user", ["bearer","session","api-key"])
    types/index.ts        MagentoWebhookEndpointDTO, MagentoWebhookDeliveryDTO, ExternalPaymentSessionData
    index.ts              re-exports
```

Events the fan-out subscribes to (names already emitted by Medusa or
Mercur core unless marked **new**):

| Event | Emitter |
| --- | --- |
| `offer.created`, `offer.updated`, `offer.deleted` | core `OfferWorkflowEvents` |
| `seller.updated`, `seller.suspended`, `seller.unsuspended`, `seller.terminated`, `seller.approved` | core `SellerWorkflowEvents` |
| `product.published`, `product.unpublished` | **new**, A.2.1 |
| `order_group.created` | core `OrderGroupWorkflowEvents` |
| `order.fulfillment_created`, `order.shipment_created`, `order.canceled`, `order.updated` | Medusa `OrderWorkflowEvents` |
| `order.refund_recorded` | plugin workflow above |

Install in `apps/api/medusa-config.ts`:

```ts
plugins: [{ resolve: "@mercurjs/magento2-connector-plugin", options: {} }],
modules: [{
  resolve: "@medusajs/medusa/payment",
  options: { providers: [
    { resolve: "@mercurjs/magento2-connector-plugin/providers/payment-external", id: "external" },
  ]},
}]
```

The provider id resolves to `pp_external_external` on payment sessions.

Tests: `integration-tests/http/magento2-connector/{webhooks,external-payment,external-refund}.spec.ts`
using `medusaIntegrationTestRunner` with the plugin added to the test
config, plus unit tests for the signer and the retry schedule inside the
package.

### A.2 Core changes the plugin depends on

Each is small, storefront-agnostic, and shipped as its own PR with its own
integration spec.

**A.2.1 Product status events.** `packages/core/src/workflows/events.ts`
gains `ProductWorkflowEvents = { PUBLISHED: "product.published",
UNPUBLISHED: "product.unpublished", STATUS_CHANGED: "product.status_changed" }`.
Emitted with `emitEventStep` from the workflows that change status: the
admin confirm and reject paths under `workflows/product-edit` and the admin
product update workflow under `workflows/product` when `status` changes.
Payload `{ id, status, previous_status }`. Without this the connector has no
signal to import a newly published seller product and must poll.

**A.2.2 Soft-deleted offers in the admin list.**
`AdminGetOffersParams` in `api/admin/offers/validators.ts` gains
`deleted_at: createOperatorMap().optional()` and `with_deleted: booleanString()`
(products already have `deleted_at`). The route passes `withDeleted: true`
to `query.graph` when either is present. The delta cursor can then see
removals. Same `with_deleted` flag on `GET /admin/sellers`.

**A.2.3 Offer stock in the admin list.** Add
`inventory_items.inventory_item.location_levels.stocked_quantity` and
`reserved_quantity` to `allowed` fields in `api/admin/offers/query-config.ts`
so the connector can request them with `+`. Today the admin default fields
stop at `inventory_items.sku`.

**A.2.4 Order group metadata and channel propagation.** `order_group` model
gains `metadata: model.json().nullable()` with a migration.
`completeCartWithSplitOrdersWorkflow` copies `cart.metadata` onto the order
group (Medusa already copies it onto each child order). Admin and vendor
order list validators accept `metadata.channel` as a filter; the dashboards
get a "Channel" column that renders `metadata.channel` when present. This
is how a vendor sees that an order came from an external shop.

**A.2.5 Integration role.** The roles module registered by `withMercur`
gets a preset `integration` role: read on offers, sellers, products,
product categories, product attributes, orders, order groups, commission
lines, payouts; write on product categories, product attributes, the plugin's
`/admin/magento/*` routes; nothing else. Admin API keys can be bound to
it. Without this a leaked Magento credential can approve sellers.

**A.2.6 Payout correctness on external payments.** Verify, with an
integration test, that a cart completed on `pp_external_external` yields
child orders whose `payment_collection.captured_amount` is set, that
`split-order-payment-captured` runs, that commission lines are written, and
that the payout job treats the order as eligible. If the subscriber keys off
a provider webhook rather than the captured status, fix it to key off the
status. This is a test first, a code change only if the test fails.

**A.2.7 Region on the shadow cart.** Document, in the store cart docs, that
`POST /store/carts` must carry `region_id` and `sales_channel_id`; the
connector maps Magento website → Mercur region in its config. No code
change expected.

### Order of work

1. A.2.1, A.2.2, A.2.3, A.2.4 in core (small, independent PRs).
2. A.1 plugin skeleton, magento-webhook module, fan-out, delivery job.
3. A.1 external payment provider + A.2.6 test.
4. A.1 external refund route.
5. A.2.5 role.

## Part B: `mercurjs/magento2-connector` (separate repo)

Composer package `mercurjs/magento2-connector`, type `magento2-component`,
namespace `Mercur\`. Targets Magento Open Source and Adobe Commerce 2.4.4+,
PHP 8.1+. One package, these Magento modules:

| Module | Responsibility |
| --- | --- |
| `Mercur_Core` | Admin config (`Stores > Configuration > Mercur`): API URL, API key, region ↔ website map, best-offer rule, sync schedules. Typed HTTP client with request logging. |
| `Mercur_Process` | `mercur_process` table (type, status, output, file, parent/child), cron runner, `mercur:process` and `mercur:sync` console commands, admin grid with output download and cancel. |
| `Mercur_Connector` | `mercur_seller` and `mercur_offer` mirror tables, delta importers, quote item `mercur_offer_id`, inventory and sales-rule plugins that keep Magento from reserving stock or discounting shipping on 3P lines, the shadow-cart synchronizer (create cart, line items, addresses, shipping methods), the post-order observer that records the external payment and completes the cart, and the webhook receiver controller with signature check (A.1 webhooks). |
| `Mercur_OfferIndexer` | `mercur_offer_index` (final price per offer per website) and `mercur_offer_product_index` (best, min, max price per SKU per website, including the 1P candidate). Reindexes on offer import and on product save. |
| `Mercur_Catalog` | Category and attribute observers that push taxonomy by handle upsert. Importer that creates Magento products from published Mercur products. |
| `Mercur_Settlement` | `mercur:settlement:collect-refunds` command, credit memo creation, confirmation back to Mercur through the plugin refund route (A.1). |
| `Mercur_Frontend` | Reference theme pieces: offers tab on the product page, buy box choosing between 1P and sellers, seller label on cart lines, order view grouped by seller. Safe to disable for headless stores. |
| `Mercur_GraphQl` | `offers` field on `ProductInterface`, `mercurShippingQuote` query, `mercur_offer_id` on cart item input. |

### 1P + 3P at runtime

1. A SKU may have a native Magento price and stock plus any number of
   mirrored offers. The product index stores the best candidate by the
   configured rule (`lowest_total_price`, `operator_first`, `premium_first`).
2. A cart line without `mercur_offer_id` is 1P and follows stock Magento
   behaviour. A line with it is 3P: no Magento reservation, shipping from
   the quote, seller label shown.
3. One Magento order, one payment. The shadow cart already holds the 3P
   lines and shipping methods; after capture the connector records the
   payment on `pp_external` and completes the cart. Mercur returns the order
   group; ids are written back on the order and its items.
4. Seller actions in the vendor panel reach Magento as webhooks and update
   item status, create shipments with tracking, or open a refund request.
5. The daily Mercur payout job pays sellers from the recorded external
   capture minus commission.

### Sync schedule (defaults, all configurable)

| Job | Cadence | Source |
| --- | --- | --- |
| sellers | 15 min | `GET /admin/sellers` |
| offers | 5 min delta, full nightly | `GET /admin/offers` + `GET /store/offers` per region |
| published products | hourly | `GET /admin/products` |
| taxonomy push | on save, nightly full | category and attribute upserts |
| refund collection | 15 min | webhook `order.refund_requested`, fallback poll |

## User-Visible Behavior

- Operator in Magento sees a Mercur configuration section, a process grid,
  and seller offers on product pages. The storefront buy box offers the
  operator's own stock and seller offers side by side.
- A shopper buys a mix of 1P and 3P items in one checkout and one payment.
  Their Magento order shows each 3P line with its seller and seller-specific
  shipping.
- A vendor in the Mercur vendor panel sees the order, fulfills it, and the
  shopper's Magento order shows the shipment and tracking.
- The operator sees commission lines and payouts in the Mercur admin as for
  any other order, tagged with channel `magento`.

## Verification

Part A, in this repo:

1. `bun run build` and `bun run lint` green.
2. Integration specs: A.2.1 publish event emitted, A.2.2 soft-deleted rows
   in the offer delta, A.2.4 channel on the order group and both order
   lists, A.2.5 integration key rejected on seller approval, A.2.6 cart
   completion on `pp_external_external` producing commission lines and a
   payout-eligible order, A.1 signed delivery with retry and redeliver, A.1
   external refund adjusting commission lines.
3. Manual: drive the shadow-cart sequence from the table with curl for two
   sellers, confirm two child orders in the admin with commission lines and
   channel `magento`, then run the payout job and see both payouts.

Part B, in the connector repo:

1. `composer install` + `php bin/magento setup:upgrade` on a clean 2.4.x
   install with sample data.
2. Point it at a Mercur instance seeded with the demo catalog, run
   `mercur:sync`, confirm `mercur_offer` rows and the product index.
3. Place a mixed 1P + 3P order on the sample storefront; confirm the
   Magento order, the Mercur order group, and the vendor-panel fulfillment
   round trip.
4. Integration test suite in the connector repo against a Mercur test
   container.

## Evidence

Not started.

## Notes

- The shadow-cart approach means any external storefront (Shopify,
  WooCommerce, a custom headless shop) can integrate with the same store
  endpoints plus Part A. Keep A.2 storefront-agnostic; nothing in it may
  mention Magento except `metadata.channel` values.
- Keep the connector repo at the root level of the Composer package so
  Packagist and Magento's Composer VCS resolution find it. Topics:
  `magento2`, `magento2-module`, `marketplace`, `multi-vendor`, `medusa`.
- The connector must be written from this spec. Do not copy code from other
  vendors' marketplace connectors; their licenses forbid redistribution.
- Open question: whether the operator's 1P stock should also become a
  Mercur seller so that commissions and reporting are uniform. Default is
  no, 1P stays native Magento, because operators adopt this precisely to
  avoid moving their own catalog.
- Open question: customer identity. the shadow cart creates guest customers keyed by
  email; a later spec can add a customer sync if vendor messaging needs
  stable customer ids.
