# Handoff: Magento 2 theme + 1P/3P checkout demo

Branch `docs/magento2-demo-handoff`, cut from `main` at `e00ec0439` on
2026-10-21. Carries this file and `docs/specs/SPEC-003-magento2-connector.md`
(force-added; `docs/specs/` is gitignored, drop the spec before any PR to
`main`).

The Part A plugin (`packages/plugins/magento2-connector`) and the A.2 core
changes are still being written on `feat/magento2-connector` and are NOT on
this branch. The theme work below only needs what `main` already ships.

## State of SPEC-003

| Piece | Status |
| --- | --- |
| Shadow cart: guest cart, `offer_id` line items, per-seller shipping, payment, `complete` → order group + commission lines | Works on `main` (see `apps/api/src/scripts/seed-order.ts`) |
| `pp_external_external` provider | In progress on `feat/magento2-connector`. Use `pp_system_default` for the demo |
| `order_group.metadata` / Channel column (A.2.4) | In progress on `feat/magento2-connector` |
| Outbound webhooks (A.1) | In progress. Poll `/admin/orders` for the demo |
| Payouts on external payments (A.2.6) | Untested. Show a pre-seeded payout, don't run it live |
| Magento connector (Part B) | Not started. Built on the second machine |

## What to build on the second machine

Magento side, smallest slice that makes the demo honest:

1. **Env**: Magento Open Source 2.4.7 in Docker (e.g. `markshust/docker-magento`)
   with Luma sample data. PHP 8.2+.
2. **Module skeleton** `Mercur_Connector` (namespace `Mercur\`), admin config:
   API URL, admin API key (secret), publishable key, region id, sales channel id.
3. **Offer sync** `bin/magento mercur:sync`: pull `GET /admin/offers` +
   `GET /store/offers?product_id=&region_id=` into a `mercur_offer` table
   keyed by `product_sku`. Seller name from `seller.name`.
4. **Theme / buy box** (Luma child theme `Mercur/luma`): on the product page,
   list "Sold by <operator>" (native price/stock) and each `mercur_offer` row
   (seller, price, lead time). Selecting an offer adds to cart with
   `mercur_offer_id` on the quote item. Seller label on cart lines and the
   order view.
5. **Shipping**: a carrier that, for quote items with `mercur_offer_id`,
   syncs a shadow cart and calls `GET /store/shipping-options?cart_id=`
   (map `seller_id → option[]`), rendering one method per seller.
6. **Order observer** (`sales_order_place_after` / after capture): add the
   chosen `shipping-methods` per seller, create the payment collection +
   `pp_system_default` session, `POST /store/carts/:id/complete`, write the
   child order ids back onto `sales_order_item.mercur_order_id`.
7. **Shipment poll**: cron every minute, `GET /admin/orders?id=<child ids>`,
   create a Magento shipment with tracking when fulfilled.

Skip for the demo: taxonomy push, product importer, process grid, GraphQL,
refunds/credit memos, best-offer rules beyond lowest price.

## Mercur calls the theme/module makes

Store API needs header `x-publishable-api-key: <pk>`; admin API uses the
secret key (`Authorization: Basic base64(<sk>:)`).

```
POST /store/carts                         { region_id, sales_channel_id, email, shipping_address }
POST /store/carts/:id/line-items          { offer_id, quantity }
GET  /store/shipping-options?cart_id=:id  → { shipping_options: { [seller_id]: option[] } }
POST /store/carts/:id/shipping-methods    { option_id }        # once per seller
POST /store/payment-collections           { cart_id }
POST /store/payment-collections/:id/payment-sessions { provider_id: "pp_system_default" }
POST /store/carts/:id/complete            → { type: "order_group", order_group }
GET  /admin/orders?id[]=...               # fulfillment status + tracking
GET  /admin/orders/:id/commission-lines
```

## Gotchas

- Seeded Mercur region is **Europe / EUR** (gb, de, dk, se, fr, es, it).
  Luma defaults to USD/US. Either switch the Magento website to EUR with a
  European test address, or add a USD region in Mercur and map it.
- SKU is the join key. Seed Mercur products whose variant SKUs equal Luma
  SKUs (e.g. `24-MB01`, `24-MB04`, `MH01-M-Black`), then create offers for
  **two sellers** on them at different prices so one product page shows the
  operator plus two sellers.
- Offers need stock on a location linked to the seller's shipping option,
  or `line-items` 400s with "not associated with any stock location".

## Mercur on the second machine

```
git checkout docs/magento2-demo-handoff
bun install && bun run build
bun --cwd apps/api run seed          # base data
bun run dev                          # API :9000, admin :7000, vendor :7001
```

Create the admin secret key and grab the publishable key in the admin
(Settings → API keys), then two sellers + offers on the Luma SKUs in the
vendor panel. Write a `reset-demo.sh` that reseeds both sides in under a
minute, and record a backup video of a clean run.

## Demo script (~7 min)

1. Stock Magento store, nothing migrated.
2. Vendor panel: seller adds an offer on an existing SKU → `mercur:sync` →
   offer appears in the Magento buy box.
3. Storefront: 1P item + two 3P items from different sellers, one shipping
   method per seller, one payment.
4. Mercur admin: one order group, two child orders, commission lines. The 1P
   line never left Magento.
5. Vendor ships with tracking → shipment appears on the Magento order.
6. Commission + (pre-seeded) payout views. Magento never computes seller money.

Call anything staged a preview.

## PostHog on the demo storefront

`posthog-js` in the theme, events: `pdp_viewed {offer_count, has_1p}`,
`offer_selected {seller_type: 1p|3p, seller_id, price_delta_vs_1p}`,
`checkout_started {seller_count}`, `order_completed {gmv_1p, gmv_3p,
seller_count, order_group_id}`. One "Marketplace uplift" dashboard: product
page → order funnel split by 1P/3P, 3P GMV share, SKUs with seller offers.
Seed synthetic sessions so it isn't empty.

## Next steps

1. Docker Magento + Luma up, module skeleton + config.
2. Seed matching SKUs and two sellers in Mercur.
3. `mercur:sync` + buy box.
4. Shipping carrier + order observer (the checkout round trip).
5. Shipment poll, PostHog events, reset script, record.
6. When `feat/magento2-connector` lands, switch `pp_system_default` →
   `pp_external_external` and the poll → webhooks.
