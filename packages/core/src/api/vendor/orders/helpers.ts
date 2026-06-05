import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const validateSellerOrder = async (
  scope: MedusaContainer,
  sellerId: string,
  orderIdOrIds: string | string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const orderIds = Array.isArray(orderIdOrIds) ? orderIdOrIds : [orderIdOrIds]

  const { data: sellerOrders } = await query.graph({
    entity: "order_seller",
    filters: {
      seller_id: sellerId,
      order_id: orderIds,
    },
    fields: ["seller_id", "order_id"],
  })

  const foundOrderIds = new Set(sellerOrders.map((so) => so.order_id))
  const missingOrderIds = orderIds.filter((id) => !foundOrderIds.has(id))

  if (missingOrderIds.length > 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order with id: ${missingOrderIds.join(", ")} was not found`
    )
  }
}
