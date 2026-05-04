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

  // Query the order_seller link directly. Going through order with
  // fields: ["seller.id"] fails for some middleware request contexts
  // (remote-joiner cache or association hydration quirks observed
  // when the order was just created via cart complete), whereas the
  // link table is always consistent as soon as the link row commits.
  const { data } = await query.graph({
    entity: "order_seller",
    fields: ["order_id", "seller_id"],
    filters: { order_id: orderId },
  })

  const link = data[0] as
    | { order_id?: string; seller_id?: string }
    | undefined
  if (!link?.seller_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order ${orderId} has no order_seller link`
    )
  }

  return { seller_id: link.seller_id }
}
