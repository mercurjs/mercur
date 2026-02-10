import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { validateSellerOrder } from "../orders/helpers"

export const validateSellerReturn = async (
  scope: MedusaContainer,
  sellerId: string,
  returnId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [returnData],
  } = await query.graph({
    entity: "return",
    filters: {
      id: returnId,
    },
    fields: ["id", "order_id"],
  })

  if (!returnData) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Return with id: ${returnId} was not found`
    )
  }

  await validateSellerOrder(scope, sellerId, returnData.order_id)
}
