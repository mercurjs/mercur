import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Look up the seller that owns an order via the `order_seller` link.
 * Used by admin routes that want to apply offer-aware logic for a specific
 * seller (e.g. when resolving an `offer_id` payload — admin still needs to
 * confirm the offer belongs to the order's seller).
 *
 * Returns `undefined` when the order has no seller link (legacy / unlinked
 * orders), so callers can fall back to non-seller-scoped resolution.
 */
export const resolveOrderSellerId = async (
  container: MedusaContainer,
  orderId: string
): Promise<string | undefined> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: links } = await query.graph({
    entity: "order_seller",
    fields: ["seller_id"],
    filters: { order_id: orderId },
  })
  return (links?.[0] as { seller_id?: string } | undefined)?.seller_id
}
