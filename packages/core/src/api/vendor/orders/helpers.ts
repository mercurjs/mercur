import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const validateSellerOrder = async (
  scope: MedusaContainer,
  sellerId: string,
  orderId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [sellerOrder],
  } = await query.graph({
    entity: "seller_order",
    filters: {
      seller_id: sellerId,
      order_id: orderId,
    },
    fields: ["seller_id", "order_id"],
  })

  if (!sellerOrder) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order with id: ${orderId} was not found`
    )
  }
}
