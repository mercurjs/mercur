import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const validateSellerPayoutAccount = async (
  scope: MedusaContainer,
  sellerId: string,
  payoutAccountId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [link],
  } = await query.graph({
    entity: "seller_payout_account",
    filters: {
      seller_id: sellerId,
      payout_account_id: payoutAccountId,
    },
    fields: ["seller_id", "payout_account_id"],
  })

  if (!link) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Payout account with id: ${payoutAccountId} was not found`
    )
  }
}
