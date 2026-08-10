import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

type OrderWithCartPaymentCollection = {
  cart?: { payment_collection?: unknown } | null
  payment_collections?: unknown[]
}

// The shared cart payment collection is fetched via `cart.payment_collection`
// (it is not linked directly to an order). Expose it back on the order under
// `payment_collections` so consumers keep the familiar shape.
export const normalizeOrderPaymentCollections = <
  T extends OrderWithCartPaymentCollection
>(
  order: T
): T => {
  const paymentCollection = order.cart?.payment_collection
  order.payment_collections = paymentCollection ? [paymentCollection] : []
  delete order.cart

  return order
}

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
