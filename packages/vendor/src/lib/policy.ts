import { HttpTypes } from "@medusajs/types"

/**
 * MVP product rule: returns / exchanges / claims are accepted within
 * a hard-coded 30 day window from the order's `delivered_at`. Per
 * product direction (docs/vendor-orders-design-diff.md §MVP), no
 * per-store or per-product policy storage in MVP — the window is a
 * single constant across all sellers and SKUs.
 */
export const RETURN_POLICY_DAYS = 30
export const EXCHANGE_POLICY_DAYS = 30
export const CLAIM_POLICY_DAYS = 30

const MS_PER_DAY = 1000 * 60 * 60 * 24

/**
 * Returns the most recent `delivered_at` timestamp across the order's
 * fulfillments, or `null` if none of the fulfillments have been
 * delivered yet (order still in flight).
 */
export const getOrderDeliveredAt = (
  order: HttpTypes.AdminOrder | null | undefined
): Date | null => {
  if (!order?.fulfillments?.length) {
    return null
  }
  let latest: Date | null = null
  for (const f of order.fulfillments) {
    const delivered = (f as { delivered_at?: string | null }).delivered_at
    if (!delivered) continue
    const d = new Date(delivered)
    if (!latest || d > latest) {
      latest = d
    }
  }
  return latest
}

/**
 * Returns true when the order was delivered more than `days` ago.
 * Returns false when the order is not yet delivered (still in
 * flight) — in that case the kebab entry stays enabled because
 * the policy can't elapse on something that hasn't been delivered.
 */
export const isOutsidePolicyWindow = (
  order: HttpTypes.AdminOrder | null | undefined,
  days: number
): boolean => {
  const deliveredAt = getOrderDeliveredAt(order)
  if (!deliveredAt) {
    return false
  }
  const elapsedMs = Date.now() - deliveredAt.getTime()
  return elapsedMs > days * MS_PER_DAY
}
