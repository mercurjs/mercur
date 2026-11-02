import { MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export type ValidateSellerWithoutPayoutAccountStepInput = {
  seller: { id: string; payout_account?: { id: string } | null }
}

export const validateSellerWithoutPayoutAccountStepId = "validate-seller-without-payout-account"

export const validateSellerWithoutPayoutAccountStep = createStep(
  validateSellerWithoutPayoutAccountStepId,
  async ({ seller }: ValidateSellerWithoutPayoutAccountStepInput) => {
    if (seller.payout_account) {
      throw new MedusaError(MedusaError.Types.CONFLICT, `Seller ${seller.id} already has a payout account`)
    }

    return new StepResponse(void 0)
  }
)
