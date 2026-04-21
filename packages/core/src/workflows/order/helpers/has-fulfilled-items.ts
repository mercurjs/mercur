import { OrderDTO } from "@medusajs/framework/types"

/**
 * Mercur marketplace invariant: an order can be canceled only while zero items
 * have been fulfilled. This helper is the single source of truth for the
 * predicate. Consumed by:
 *   - validateCancelStep (cancel-order workflow step)
 *   - validateCancelOrderMiddleware (admin API middleware)
 *
 * Keep pure — no IO. Input must already carry `items.detail.fulfilled_quantity`.
 */
export function hasFulfilledItems(
  order: Pick<OrderDTO, "items"> | undefined | null
): boolean {
  if (!order?.items?.length) {
    return false
  }

  return order.items.some((item) => {
    const fulfilled = (item as any)?.detail?.fulfilled_quantity
    return typeof fulfilled === "number" && fulfilled > 0
  })
}
