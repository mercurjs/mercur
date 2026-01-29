import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { CreateOnboardingDTO, MercurModules, OnboardingDTO } from "@mercurjs/types"

import PayoutService from "../../../modules/payout/services/payout-service"

export const createOnboardingStep = createStep(
  "create-onboarding",
  async (input: CreateOnboardingDTO, { container }) => {
    const service = container.resolve<PayoutService>(MercurModules.PAYOUT)

    const onboarding: OnboardingDTO = await service.createOnboarding(input)

    return new StepResponse(onboarding, onboarding.id)
  }
)
