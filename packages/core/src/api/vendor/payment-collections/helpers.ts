import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { validateSellerOrder } from "../orders/helpers"

export const refetchPaymentCollection = async (
  scope: MedusaContainer,
  paymentCollectionId: string,
  fields: string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [paymentCollection],
  } = await query.graph({
    entity: "payment_collection",
    filters: { id: paymentCollectionId },
    fields,
  })

  return paymentCollection
}

export const validateSellerPaymentCollection = async (
  scope: MedusaContainer,
  sellerId: string,
  paymentCollectionId: string
): Promise<string> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [link],
  } = await query.graph({
    entity: "order_payment_collection",
    filters: { payment_collection_id: paymentCollectionId },
    fields: ["order_id"],
  })

  if (!link?.order_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Payment collection with id: ${paymentCollectionId} was not found`
    )
  }

  await validateSellerOrder(scope, sellerId, link.order_id)

  return link.order_id
}
