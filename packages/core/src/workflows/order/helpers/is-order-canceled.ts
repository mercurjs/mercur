import { OrderDTO } from "@medusajs/framework/types"

/**
 * Mercur marketplace invariant: an order cannot be canceled twice. This
 * helper is the single source of truth for the predicate. Consumed by:
 *   - validateCancelStep (cancel-order workflow step)
 *   - validateCancelOrderMiddleware (admin API middleware)
 *
 * Keep pure — no IO. Input must already carry `canceled_at`.
 */
export function isOrderCanceled(
  order: Pick<OrderDTO, "canceled_at"> | undefined | null
): boolean {
  return !!order?.canceled_at
}
