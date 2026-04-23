# Capability Model

## Implementation Status

- **E1 (admin warehouse capability lock)** — **implemented** in spec `005-admin-warehouse-capability-lock` via the `admin_warehouse_management` feature flag (env key `MEDUSA_FF_ADMIN_WAREHOUSE_MANAGEMENT`, default `false`). Baseline admin cannot mutate fulfillment, allocation, shipment, or return-receiving state unless the flag is enabled. Cancel-order invariant (fulfilled-quantity > 0 → rejected) is enforced by the `mercurCancelOrderWorkflow` + `validateCancelOrderMiddleware` pair and applies to both admin and vendor cancel paths.
- E2 onward remain open — see specs `006-admin-seller-valid-scoping`, `007-admin-hard-invariants`, `008-admin-refund-and-timeline-correctness`, `009-admin-order-list-ux-parity`.

## Goal

Define which behaviors are baseline Mercur invariants and which are optional capabilities so implementation does not mix policy with presentation.

## Capability Tiers

### Baseline Marketplace

Default Mercur behavior:

- admin can view and administratively manage orders
- admin cannot act as warehouse owner for vendor-owned suborders
- vendor-owned suborders control:
  - fulfillment creation and cancellation
  - shipment handling
  - allocation and stock-location decisions
  - returned-item receiving
- admin order mutations must stay within seller-valid product, price, and stock boundaries

### Optional Capability Layer

These behaviors should be considered opt-in, not baseline:

- admin fulfillment management for vendor orders
- admin allocation or stock-location override
- admin receive-return actions for vendor inventory
- any flow that lets admin bypass seller scoping for operational convenience

Recommended shape:

- add explicit Mercur capability flags in `packages/core`
- keep baseline behavior as the default with no flag required
- make admin UI render optional controls only when the capability is enabled

## Enforcement Split

| Concern | UI responsibility | Backend responsibility | Owning package |
| --- | --- | --- | --- |
| Hidden/disabled admin actions | Hide or disable unsupported actions | Reject unsupported requests even if called directly | `packages/admin` + `packages/core` |
| Seller-valid stock locations | Render only validated choices | Resolve and validate seller-valid locations from order context | `packages/admin` + `packages/core` |
| Seller-valid variants for add-item flows | Query only scoped candidates | Reject cross-seller, price-invalid, and inventory-invalid variants | `packages/admin` + `packages/core` |
| Cancel-order rule | Disable cancel when any item was fulfilled | Reject cancel when any fulfilled quantity exists | `packages/admin` + `packages/core` |
| Edit-order returned-item guard | Disable invalid remove/update actions | Reject invalid item mutation in workflow validation | `packages/admin` + `packages/core` |
| Refund upper bound | Pre-fill only valid amounts | Reject over-refund requests | `packages/admin` + existing Medusa backend protections |

## Package Split

### `packages/admin`

Owns:

- action visibility
- form defaults and client-side validation
- scoped query hooks
- grouped-order list interactions
- timeline text and translation fixes

Should not own final business truth for:

- seller ownership checks
- fulfillment authority
- add-item eligibility
- cancel/edit invariants

### `packages/core`

Owns:

- capability flag resolution
- admin API and workflow guardrails
- seller/location/variant validation helpers
- Mercur-specific invariants that are stricter than generic Medusa flows

## Required Backend Invariants

The following must be enforceable without trusting the UI:

1. Admin cannot mutate vendor fulfillment operations in baseline mode.
2. Admin cannot select a stock location outside the seller-valid set for the suborder.
3. Added variants must belong to the same seller as the target suborder.
4. Added variants must have a valid sellable price in the order context.
5. Added variants must satisfy explicit availability rules for the target location set.
6. Order cancel must fail if any item has fulfilled quantity greater than zero.
7. Edit-order item removal or reduction must fail if the item is already fulfilled or returned.

## Implementation Note

Where generic Medusa admin endpoints do not expose enough context to enforce Mercur rules cleanly, prefer Mercur-owned admin endpoints or wrapper flows over partial client-side filtering.
