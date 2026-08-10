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
  paymentId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  // The payment collection is shared across all split orders of a cart, so it
  // is not linked directly to any single order. Resolve the owning cart and
  // check the seller owns one of that cart's orders.
  const {
    data: [payment],
  } = await query.graph({
    entity: "payment",
    filters: { id: paymentId },
    fields: ["id", "payment_collection.cart.id"],
  })

  const cartId = (
    payment as
      | { payment_collection?: { cart?: { id?: string } | null } | null }
      | undefined
  )?.payment_collection?.cart?.id

  if (!cartId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Payment with id: ${paymentId} was not found`
    )
  }

  const { data: orderCartLinks } = await query.graph({
    entity: "order_cart",
    filters: { cart_id: cartId },
    fields: ["order_id"],
  })

  const orderIds = orderCartLinks
    .map((link) => (link as { order_id?: string }).order_id)
    .filter((id): id is string => Boolean(id))

  if (!orderIds.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Payment with id: ${paymentId} was not found`
    )
  }

  const {
    data: [sellerOrder],
  } = await query.graph({
    entity: "order_seller",
    filters: { seller_id: sellerId, order_id: orderIds },
    fields: ["seller_id"],
  })

  if (!sellerOrder) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Payment with id: ${paymentId} was not found`
    )
  }
}
