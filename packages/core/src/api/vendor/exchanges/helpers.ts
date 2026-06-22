import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { validateSellerOrder } from "../orders/helpers"

export const validateSellerExchange = async (
  scope: MedusaContainer,
  sellerId: string,
  exchangeId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [exchange],
  } = await query.graph({
    entity: "order_exchange",
    filters: { id: exchangeId },
    fields: ["id", "order_id"],
  })

  if (!exchange) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Exchange with id: ${exchangeId} was not found`
    )
  }

  await validateSellerOrder(scope, sellerId, exchange.order_id)
}
