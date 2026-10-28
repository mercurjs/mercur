import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { CreateOnboardingDTO, MercurModules } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export const createOnboardingStepId = "create-onboarding"

/**
 * Publishes the onboarding link, or the dashboard login link once the seller
 * submitted their details. A published link cannot be revoked, so there is
 * no compensation.
 */
export const createOnboardingStep = createStep(
  createOnboardingStepId,
  async (input: CreateOnboardingDTO, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
    const onboarding = await service.createOnboarding(input)

    return new StepResponse(onboarding)
  }
)
