# @mercurjs/magento2-connector-plugin

Server-side half of the Mercur Magento 2 connector. Pairs with the
`mercurjs/magento2-connector` Composer package installed in Magento.

It adds to a Mercur API:

- **Outbound webhooks** (`magento_webhook` module): register endpoints under
  `/admin/magento/webhooks`, pick the events to receive, and Mercur POSTs each
  event with an HMAC-SHA256 signature in `x-mercur-signature`. Failed
  deliveries retry on a 1m / 5m / 30m / 2h / 12h ladder, then stop.
- **External payment provider** (`pp_external_external`): lets a storefront
  that already captured the customer's payment complete a Mercur cart with
  the captured amount, so split orders, commission lines, and payouts run on
  real numbers without Mercur charging anything.
- **External refunds**: `POST /admin/magento/orders/:id/refunds/external`
  mirrors a refund that happened in the storefront onto the Mercur order.

## Install

```ts
// medusa-config.ts
module.exports = withMercur({
  plugins: [{ resolve: "@mercurjs/magento2-connector-plugin", options: {} }],
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@mercurjs/magento2-connector-plugin/providers/payment-external",
            id: "external",
          },
        ],
      },
    },
  ],
})
```

Run `medusa db:migrate` afterwards.

## Checkout from an external storefront

1. `POST /store/carts` with `region_id` and `sales_channel_id`.
2. `POST /store/carts/:id/line-items` with `{ offer_id, quantity }` per line.
3. `POST /store/carts/:id` with email and addresses.
4. `GET /store/shipping-options?cart_id=` then one
   `POST /store/carts/:id/shipping-methods` per seller.
5. `POST /store/payment-collections` and
   `POST /store/payment-collections/:id/payment-sessions` with
   `{ provider_id: "pp_external_external", data: { reference, captured_at, channel } }`.
6. `POST /store/carts/:id/complete`.

Put `metadata.channel` on the cart in step 1; it is copied onto the order
group and every child order.
