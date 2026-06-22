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

/**
 * Asserts the seller owns the order that owns the payment.
 *
 * Mercur doesn't have a direct `seller_payment` module link (the join
 * goes through the order). Resolve the payment → `payment_collection` →
 * `order` → `order_seller` chain via Query Graph and check the seller
 * matches. The previous implementation queried a non-existent
 * `seller_payment` entity which 500-d every refund / capture call.
 */
export const validateSellerPayment = async (
  scope: MedusaContainer,
  sellerId: string,
  paymentId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [payment],
  } = await query.graph({
    entity: "payment",
    filters: { id: paymentId },
    fields: ["id", "payment_collection.order.id"],
  })

  const orderId = (
    payment as
      | { payment_collection?: { order?: { id?: string } | null } | null }
      | undefined
  )?.payment_collection?.order?.id

  if (!orderId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Payment with id: ${paymentId} was not found`
    )
  }

  const {
    data: [sellerOrder],
  } = await query.graph({
    entity: "order_seller",
    filters: { seller_id: sellerId, order_id: orderId },
    fields: ["seller_id"],
  })

  if (!sellerOrder) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Payment with id: ${paymentId} was not found`
    )
  }
}
