# Mercur v2.3.4

This release is all about extensibility. Commissions get pluggable providers,
split orders and product edits get new workflow hooks, and offers learn about
handling time. Shipping profiles become operator-owned, RBAC is now fully
opt-in, and we bumped Medusa to 2.20.1 — plus a batch of fixes across offers,
the panels and the client.

## ⚠️ Before you upgrade

- **Shipping profiles are now operator-owned** (#1498). Only the marketplace
  operator defines shipping profiles; vendors can still read and select them.
  `POST` / `DELETE` on `/vendor/shipping-profiles` are removed, along with the
  `seller_id` filter on `GET /admin/shipping-profiles` and the
  `shipping-profile-seller-link`.
- **Run migrations** — new columns on offers, sellers and commission lines.
- **RBAC is opt-in** (#1521). If you use seller roles and permissions, enable
  it with `withMercur({ featureFlags: { rbac: true } })`.

## ✨ Highlights

### 💸 Commission providers
The commission module now has a provider seam, just like payouts. Implement
`ICommissionProvider` to plug in your own commission logic, and pass extra
context through the new `setCommissionContext` hook. The existing calculation
ships as the default `system` provider, so nothing changes unless you
configure one. (#1509)

### 📦 Order acceptance flows
A new `setOrderStatus` hook on `completeCartWithSplitOrdersWorkflow` lets a
plugin set each seller order's initial status — for example `requires_action`
for marketplaces where sellers accept orders first. Both panels now lock
fulfil, edit, return, exchange, claim, capture and refund on those orders, and
order tables get a status filter. (#1513)

### 🚚 Handling time on offers
Offers accept `leadtime_to_ship` — business days until the parcel is handed to
the carrier — falling back to the seller's `default_leadtime_to_ship`
(default `2`). The building block for shipping deadlines and delivery
estimates. (#1491)

### 🧩 More extension points
- `validate` hook on the vendor product-edit workflows (#1484).
- `value_ids` accepted on product attribute batch update (#1481).
- `ClientError` keeps the API error `code`, so your storefront can react to a
  specific refusal instead of matching on the message (#1477).

### Platform
- **Bump Medusa to 2.20.1** (#1489).

## 🐛 Fixes
- Reject offer prices of `0` or less, and skip unpriced variants in the vendor
  Create offers form (#1522).
- Accept a decimal comma in offer price fields (#1520).
- Stop marking unhandled product-change actions as applied (#1463).
- Tolerate dangling price links in `updateOffersWorkflow` (#1482).
- Merge plugin i18n into the panels and keep parent breadcrumbs on file-based
  routes (#1511).
- Use valid BCP 47 tags for Chinese and Portuguese (#1519).
- Stub `virtual:medusa/search-entities` in the dashboard SDK (#1495).
- Avoid a 4-level field expansion when the storefront retrieves the cart (#1518).

## 📚 Docs
- Clarify the Stripe webhook events needed for split-order checkout (#1523).

## 🙌 New contributors
- @skaffff made their first contribution in #1477 — thank you!

**Full Changelog**: https://github.com/mercurjs/mercur/compare/v2.3.3...v2.3.4
