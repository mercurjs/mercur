/**
 * Lifecycle events emitted by the new `product-change` module's workflows.
 * Distinct from the legacy `ProductWorkflowEvents` (`../product/events.ts`)
 * which emits per-product events keyed by `product_id`. The new module
 * emits per-change events keyed by `product_change_id`; consumers that need
 * `product_id` resolve it through the `product_change_link` pivot.
 */
export const ProductChangeWorkflowEvents = {
  CREATED: "product-change.created",
  CONFIRMED: "product-change.confirmed",
  DECLINED: "product-change.declined",
  CANCELED: "product-change.canceled",
} as const
