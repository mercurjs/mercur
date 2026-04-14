import { Query } from "@medusajs/framework"
import { MedusaError } from "@medusajs/framework/utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

interface ValidateSellerPayoutAccountInput {
  seller_id: string
}

export const validateSellerPayoutAccountStep = createStep(
  "validate-seller-payout-account",
  async (input: ValidateSellerPayoutAccountInput, { container }) => {
    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)

    const { data } = await query.graph({
      entity: "seller_payout_account",
      filters: {
        seller_id: input.seller_id,
      },
      fields: ["seller_id", "payout_account_id"],
    })

    if (data.length > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Seller already has a payout account`
      )
    }

    return new StepResponse(void 0)
  }
)
