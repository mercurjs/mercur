import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const validateSellerPayout = async (
  scope: MedusaContainer,
  sellerId: string,
  payoutId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [sellerPayout],
  } = await query.graph({
    entity: "payout_seller",
    filters: {
      seller_id: sellerId,
      payout_id: payoutId,
    },
    fields: ["seller_id", "payout_id"],
  })

  if (!sellerPayout) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Payout with id: ${payoutId} was not found`
    )
  }
}
