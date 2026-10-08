import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const refetchPayment = async (
  scope: MedusaContainer,
  paymentId: string,
  fields: string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [payment],
  } = await query.graph({
    entity: "payment",
    filters: { id: paymentId },
    fields,
  })

  return payment
}

export const validateSellerPayment = async (
  scope: MedusaContainer,
  sellerId: string,
  paymentId: string,
  options: { requireAllOrders?: boolean } = {}
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  // A payment is either an order's own, or the cart payment its orders share
  // until it is captured, which is reachable only through the cart.
  const {
    data: [payment],
  } = await query.graph({
    entity: "payment",
    filters: { id: paymentId },
    fields: [
      "id",
      "payment_collection.order.id",
      "payment_collection.cart.id",
    ],
  })

  const paymentCollection = (
    payment as
      | {
          payment_collection?: {
            order?: { id?: string } | null
            cart?: { id?: string } | null
          } | null
        }
      | undefined
  )?.payment_collection

  let orderIds: string[] = []

  if (paymentCollection?.order?.id) {
    orderIds = [paymentCollection.order.id]
  } else if (paymentCollection?.cart?.id) {
    const { data: orderCartLinks } = await query.graph({
      entity: "order_cart",
      filters: { cart_id: paymentCollection.cart.id },
      fields: ["order_id"],
    })

    orderIds = orderCartLinks
      .map((link) => (link as { order_id?: string }).order_id)
      .filter((id): id is string => Boolean(id))
  }

  if (!orderIds.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Payment with id: ${paymentId} was not found`
    )
  }

  const { data: orderSellers } = await query.graph({
    entity: "order_seller",
    filters: { order_id: orderIds },
    fields: ["order_id", "seller_id"],
  })

  const sellerIds = orderSellers.map(
    (link) => (link as { seller_id?: string }).seller_id
  )

  if (!sellerIds.includes(sellerId)) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Payment with id: ${paymentId} was not found`
    )
  }

  if (options.requireAllOrders && sellerIds.some((id) => id !== sellerId)) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `Payment with id: ${paymentId} is shared with other sellers' orders and can only be captured by the marketplace operator`
    )
  }
}
