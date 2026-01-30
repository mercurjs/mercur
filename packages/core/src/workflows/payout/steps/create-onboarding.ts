import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { CreateOnboardingDTO, MercurModules, OnboardingDTO } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

export const createOnboardingStep = createStep(
  "create-onboarding",
  async (input: CreateOnboardingDTO, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

    const onboarding: OnboardingDTO = await service.createOnboarding(input)

    return new StepResponse(onboarding, onboarding.id)
  }
)
