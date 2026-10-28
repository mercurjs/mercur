import { MedusaContainer } from "@medusajs/framework"
import { refetchEntity } from "@medusajs/framework/http"
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

export const refetchPayoutAccount = async (id: string, scope: MedusaContainer, fields: string[]) =>
  await refetchEntity({ entity: "payout_account", idOrFilter: id, scope, fields })

export const refetchOnboarding = async (id: string, scope: MedusaContainer, fields: string[]) =>
  await refetchEntity({ entity: "onboarding", idOrFilter: id, scope, fields })
