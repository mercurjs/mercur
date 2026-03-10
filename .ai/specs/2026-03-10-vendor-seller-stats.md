# Vendor Seller Stats

## Problem
Vendors have no visibility into basic metrics (product count, order count) on their profile page.

## Outcome
A new `GET /vendor/sellers/me/stats` endpoint returns product and order counts for the authenticated seller. The vendor profile page displays these stats.

## Scope
- Backend: new route + middleware + response type
- Frontend: new hook + stats section on seller profile page
- Packages touched: `core-plugin`, `types`, `vendor`

## Business Rules
- Stats are scoped to the authenticated seller (`auth_context.actor_id`)
- Product count: all products linked to the seller
- Order count: all orders linked to the seller

## Response Shape
```json
{ "stats": { "product_count": 0, "order_count": 0 } }
```

## Acceptance Criteria
- [ ] `GET /vendor/sellers/me/stats` returns correct counts
- [ ] Endpoint requires seller authentication
- [ ] Vendor profile page shows product and order counts
- [ ] Types pass `bun run check-types`
