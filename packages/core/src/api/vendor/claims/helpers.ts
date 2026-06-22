import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { validateSellerOrder } from "../orders/helpers"

export const validateSellerClaim = async (
  scope: MedusaContainer,
  sellerId: string,
  claimId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [claim],
  } = await query.graph({
    entity: "order_claim",
    filters: { id: claimId },
    fields: ["id", "order_id"],
  })

  if (!claim) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Claim with id: ${claimId} was not found`
    )
  }

  await validateSellerOrder(scope, sellerId, claim.order_id)
}
