import { MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export type ValidateOnboardingTokenStepInput = {
  account: { id: string } | null | undefined
}

export const validateOnboardingTokenStepId = "validate-onboarding-token"

export const validateOnboardingTokenStep = createStep(
  validateOnboardingTokenStepId,
  async ({ account }: ValidateOnboardingTokenStepInput) => {
    if (!account) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Unknown onboarding token")
    }

    return new StepResponse(void 0)
  }
)
