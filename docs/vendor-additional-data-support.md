# Vendor API `additional_data` Support Audit

Status of Medusa's `additional_data` extension pattern across every **vendor**
POST/PATCH endpoint under `packages/core/src/api/vendor/**/route.ts`, and the
gaps needed to bring them to parity with Medusa's admin routes.

## Background — the pattern

Medusa lets extensions hook into workflows by threading an `additional_data`
field from the HTTP request all the way into the workflow. Reference:
[`admin/products/validators.ts`](https://github.com/medusajs/medusa/blob/develop/packages/medusa/src/api/admin/products/validators.ts)
and [`admin/products/route.ts`](https://github.com/medusajs/medusa/blob/develop/packages/medusa/src/api/admin/products/route.ts).

There are **three legs** and all three must be wired for support to be "FULL":

1. **Validator wrap** — the request schema is wrapped so the body accepts an
   `additional_data` field. Medusa uses `withAdditionalData(...)`; Mercur uses
   its own `WithAdditionalData(...)` helper (capital `W`).
2. **Handler forward** — the route handler pulls `additional_data` out of
   `validatedBody` and passes it at the **top level** of the workflow input:
   ```ts
   const { additional_data, ...payload } = req.validatedBody
   await someWorkflow(req.scope).run({ input: { ...payload, additional_data } })
   ```
3. **Workflow hook** — the workflow exposes an extension point via
   `createHook("...", { ..., additional_data })` and types its input with
   `& AdditionalData`. (Mercur uses the snake_case `additional_data` data key,
   not Medusa's camelCase `additionalData`.)

The canonical, correctly-wired reference in the vendor surface is
`POST /vendor/products`
([`api/vendor/products/route.ts`](../packages/core/src/api/vendor/products/route.ts)
→ [`create-products` workflow](../packages/core/src/workflows/product/workflows/create-products.ts),
hook `productsCreated`).

## Summary

| Status | Count | Meaning |
|---|---|---|
| ✅ **FULL** | 1 | validator wraps + handler forwards + workflow hook |
| ⚠️ **PARTIAL** | 13 | some legs wired, chain broken somewhere |
| ❌ **NONE** | majority | no support at any leg |
| — **N/A** | 2 | session/upload routes with no workflow |

`WithAdditionalData` is currently referenced in only **three** validator files:
`products/validators.ts`, `product-attributes/validators.ts`,
`sellers/validators.ts`. The single fully-wired endpoint is
`POST /vendor/products`. Everywhere else the chain breaks — most commonly the
handler destructures `additional_data` and then drops it, or nests it inside a
sub-object (`update` / `data`) instead of the top-level workflow input.

## Products & Catalog

| Endpoint | Method | Validator wraps? | Handler passes? | Workflow hook? | Status |
|---|---|---|---|---|---|
| `/vendor/products` | POST | ✅ `VendorCreateProduct` | ✅ | ✅ `productsCreated` | ✅ **FULL** |
| `/vendor/products/:id` | POST | ✅ `VendorUpdateProduct` | ❌ destructures & discards | ❌ | ⚠️ PARTIAL |
| `/vendor/products/:id/cancel` | POST | ❌ | ❌ | ✅ `productChangeCanceled` | ⚠️ PARTIAL |
| `/vendor/products/:id/attributes/batch` | POST | ❌ | ❌ | ❌ | ❌ NONE |
| `/vendor/products/:id/variants` | POST | ❌ | ❌ | ❌ | ❌ NONE |
| `/vendor/products/:id/variants/:variant_id` | POST | ❌ | ❌ | ❌ | ❌ NONE |
| `/vendor/product-categories/:id/products` | POST | ❌ | ❌ | ❌ (core-flows) | ❌ NONE |
| `/vendor/collections/:id/products` | POST | ❌ | ❌ | ❌ (core-flows) | ❌ NONE |
| `/vendor/sales-channels/:id/products` | POST | ❌ | ❌ | ❌ (core-flows) | ❌ NONE |

`product-categories`, `collections`, `product-tags`, `product-types` have **no
vendor create/update routes** (GET-only); only the batch product-link
sub-routes mutate.

## Pricing / Promotions / Campaigns — all ❌ NONE

`price-lists` (POST, `:id`, `prices/batch`, `products`), `promotions` (POST,
`:id`, `rules`/`buy-rules`/`target-rules` batch), `campaigns` (POST, `:id`,
`:id/promotions`). None wrap the validator, none forward the field. Create
workflows are custom Mercur workflows with **no hook**; update/batch delegate to
`@medusajs/core-flows` (whose hooks are internal and unreachable from the vendor
handler unless the field is forwarded).

## Customers / Sellers / Members

| Endpoint | Method | Validator wraps? | Handler passes? | Workflow hook? | Status |
|---|---|---|---|---|---|
| `/vendor/customer-groups` (+`/:id`, `/:id/customers`) | POST | ❌ | ❌ | ❌ | ❌ NONE |
| `/vendor/customers/:id/customer-groups` | POST | ❌ | ❌ | ❌ | ❌ NONE |
| `/vendor/sellers` | POST | ✅ `VendorCreateSellerAccount` | ❌ | ✅ `sellerAccountCreated` | ⚠️ PARTIAL |
| `/vendor/sellers/me` | POST | ✅ `VendorUpdateSeller` | ❌ **runs no workflow (no-op)** | n/a | ⚠️ PARTIAL |
| `/vendor/sellers/:id` | POST | ✅ `VendorUpdateSeller` | ❌ nests in `update` | ✅ `sellersUpdated` | ⚠️ PARTIAL |
| `/vendor/sellers/:id/address` | POST | ✅ `VendorUpsertSellerAddress` | ❌ nests in `data` | ✅ `addressUpdated` | ⚠️ PARTIAL |
| `/vendor/sellers/:id/payment-details` | POST | ✅ `VendorUpsertSellerPaymentDetails` | ❌ | ✅ `paymentDetailsUpdated` | ⚠️ PARTIAL |
| `/vendor/sellers/:id/professional-details` | POST | ✅ `VendorUpsertSellerProfessionalDetails` | ❌ | ✅ `professionalDetailsUpdated` | ⚠️ PARTIAL |
| `/vendor/sellers/:id/members` (+`/:member_id`) | POST | ❌ | ❌ | ❌ | ❌ NONE |
| `/vendor/members/me`, `/members/invites/accept` | POST | ❌ | ❌ | ❌ | ❌ NONE |
| `/vendor/sellers/select` | POST | ❌ | ❌ | n/a (session write) | — N/A |

The seller domain is the biggest "so close" cluster: 5 validators wrapped + 5
workflows with hooks, but every handler fails to thread the field to the
top-level `input.additional_data` (they nest it inside `update`/`data`), and
`sellers/me` runs no workflow at all.

## Offers / Payments / Payouts

| Endpoint | Method | Validator wraps? | Handler passes? | Workflow hook? | Status |
|---|---|---|---|---|---|
| `/vendor/offers` | POST | ❌ | ❌ | ✅ `offersCreated` | ⚠️ PARTIAL |
| `/vendor/offers/:id` | POST | ❌ | ❌ | ✅ `offersUpdated` | ⚠️ PARTIAL |
| `/vendor/offers/batch` | POST | ❌ | ❌ | ✅ `offersCreated` | ⚠️ PARTIAL |
| `/vendor/offers/:id/inventory-items/batch` | POST | ❌ | ❌ | ✅ `offerInventoryItemsBatched` | ⚠️ PARTIAL |
| `/vendor/payments/:id/capture`, `/refund` | POST | ❌ | ❌ | ❌ (core-flows) | ❌ NONE |
| `/vendor/payout-accounts` (+`/:id/onboarding`) | POST | ❌ | ❌ | ❌ | ❌ NONE |
| `/vendor/uploads` | POST | — | — | — | — N/A |

## Inventory / Reservations / Shipping / Stock / Fulfillment — all ❌ NONE

All ~20 endpoints (`inventory-items` + `location-levels/batch`, `reservations`,
`shipping-options` + `rules/batch`, `shipping-profiles`, `stock-locations` +
fulfillment/sales-channel links, `fulfillment-sets/service-zones`): no validator
wrap, no forward. Create routes are custom Mercur workflows without hooks; the
rest delegate to `@medusajs/core-flows`.

## Orders / Returns / Claims / Exchanges / Order-edits

| Endpoint | Method | Validator wraps? | Handler passes? | Workflow hook? | Status |
|---|---|---|---|---|---|
| `/vendor/orders/:id/fulfillments` | POST | ❌ `VendorCreateFulfillment` | ❌ | ✅ `fulfillmentCreated` | ⚠️ PARTIAL |
| `/vendor/orders/:id/fulfillments/:fid/cancel` | POST | ❌ (query-only) | ❌ | ✅ `orderFulfillmentCanceled` | ⚠️ PARTIAL |
| `/vendor/orders/:id/{cancel,complete,…/mark-as-delivered,…/shipments}` | POST | ❌ | ❌ | ❌ (core-flows) | ❌ NONE |
| all `/vendor/returns/**` | POST | ❌ | ❌ | ❌ | ❌ NONE |
| all `/vendor/claims/**` | POST | ❌ | ❌ | ❌ | ❌ NONE |
| all `/vendor/exchanges/**` | POST | ❌ | ❌ | ❌ | ❌ NONE |
| all `/vendor/order-edits/**` | POST | ❌ | ❌ | ❌ | ❌ NONE |

The four Mercur "confirm" RMA/order-edit workflows (`confirm-return-receive`,
`confirm-claim-request`, `confirm-exchange-request`,
`confirm-order-edit-request`) define **no** hook. Repo-wide, the only
order-domain workflows with hooks are the two fulfillment ones above.

## Gaps to close

Ranked by how little is missing.

### Tier 1 — only the handler forward (and, for products, a workflow hook) is missing

The validator already wraps; wiring is a one-to-few-line handler change.

- **`POST /vendor/products/:id`** — handler explicitly drops the field
  (`const { additional_data: _ad, ...update }`). Forward it **and** add a hook
  to `product-edit/workflows/product-edit-update-product.ts` (validator wraps,
  but that workflow currently has no hook).
- **`POST /vendor/sellers`** — forward `additional_data` into
  `createSellerAccountWorkflow` input.
- **`POST /vendor/sellers/:id`** — un-nest to top-level `input.additional_data`
  (`→ updateSellersWorkflow`).
- **`POST /vendor/sellers/:id/address`** → `updateSellerAddressWorkflow`.
- **`POST /vendor/sellers/:id/payment-details`** → `updateSellerPaymentDetailsWorkflow`.
- **`POST /vendor/sellers/:id/professional-details`** → `updateSellerProfessionalDetailsWorkflow`.
- **`POST /vendor/sellers/me`** — currently a **no-op** (runs no workflow); make
  it run `updateSellersWorkflow` and forward the field.

### Tier 2 — workflow hook exists, but validator wrap AND handler forward are missing

- **All 4 offers routes** — add `WithAdditionalData` to `offers/validators.ts`
  and forward in each handler. Workflows `create-offers`, `update-offers`,
  `batch-offer-inventory-items` already hook.
- **`POST /vendor/products/:id/cancel`** — wrap `VendorCancelProductChange` +
  forward; `cancel-product-change` already hooks (`productChangeCanceled`).
- **`POST /vendor/orders/:id/fulfillments`** — wrap `VendorCreateFulfillment` +
  forward; workflow already hooks.
- **`POST /vendor/orders/:id/fulfillments/:fid/cancel`** — add a body validator
  (currently query-only) + forward; workflow already hooks.

### Tier 3 — nothing exists (validator + handler + hook all missing)

- All pricing / promotions / campaigns create routes (custom workflows need
  hooks added).
- All inventory / reservations / shipping / stock / fulfillment routes.
- Customer-groups, customers, members routes.
- Payments (capture/refund) and payout-accounts/onboarding.
- Product variant + attribute batch routes; all catalog product-link routes.
- All returns / claims / exchanges / order-edits routes — including adding hooks
  to the four Mercur "confirm" workflows if extension points are wanted there.

> **Note on `@medusajs/core-flows` delegators** (most link/batch/RMA routes):
> the upstream workflows already define `additional_data` hooks internally, so
> those endpoints only need the **validator wrap + handler forward** at the
> Mercur layer to become FULL — no new hook required.
