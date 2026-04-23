import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

/**
 * Resolves the seller linked to an order. Used by admin routes and
 * middlewares that scope data or writes to the order's vendor.
 *
 * Throws NOT_FOUND when the order does not exist or has no order_seller
 * link (legacy/admin-created orders). The caller decides how to surface
 * that to the client.
 */
export async function resolveOrderSeller(
  scope: MedusaContainer,
  orderId: string
): Promise<{ seller_id: string }> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "seller.id"],
    filters: { id: orderId },
  })

  const order = data[0] as { seller?: { id?: string } } | undefined
  if (!order?.seller?.id) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order ${orderId} has no order_seller link`
    )
  }

  return { seller_id: order.seller.id }
}
