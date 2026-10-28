import { MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export const validateAccountSellerStepId = "validate-stripe-account-seller"

export const validateAccountSellerStep = createStep(
  validateAccountSellerStepId,
  async (input: { id: string; seller_id: string | null }) => {
    if (!input.seller_id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Payout account ${input.id} has no seller`)
    }
    return new StepResponse(void 0)
  }
)
