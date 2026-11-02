import { MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export const validateAdjustmentAccountStepId = "validate-stripe-adjustment-account"

export const validateAdjustmentAccountStep = createStep(
  validateAdjustmentAccountStepId,
  async (input: { account_id: string | null; seller_id?: string }) => {
    if (!input.account_id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Seller ${input.seller_id} has no payout account`)
    }
    return new StepResponse(void 0)
  }
)
