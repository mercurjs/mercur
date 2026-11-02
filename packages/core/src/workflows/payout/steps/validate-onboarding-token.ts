import { MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { IPayoutModuleService, MercurModules } from "@mercurjs/types"

export type ValidateOnboardingTokenStepInput = {
  account: { id: string; onboarding_token_issued_at: Date | string | null } | null | undefined
}

export const validateOnboardingTokenStepId = "validate-onboarding-token"

/**
 * Rejects an unknown token and one older than the module's
 * `onboarding.tokenTtlSeconds`.
 */
export const validateOnboardingTokenStep = createStep(
  validateOnboardingTokenStepId,
  async ({ account }: ValidateOnboardingTokenStepInput, { container }) => {
    if (!account) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Unknown onboarding token")
    }

    const { tokenTtlSeconds } = container.resolve<IPayoutModuleService>(MercurModules.PAYOUT).getOptions().onboarding
    const issuedAt = account.onboarding_token_issued_at ? new Date(account.onboarding_token_issued_at).getTime() : 0

    if (Date.now() - issuedAt >= tokenTtlSeconds * 1000) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "The onboarding token has expired")
    }

    return new StepResponse(void 0)
  }
)
