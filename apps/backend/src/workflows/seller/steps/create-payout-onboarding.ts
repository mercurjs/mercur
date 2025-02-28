import { PAYOUT_MODULE } from '#/modules/payout'
import PayoutModuleService from '#/modules/payout/service'
import { CreateOnboardingDTO } from '#/modules/payout/types'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

export const createPayoutOnboardingStep = createStep(
  'create-payout-onboarding',
  async (input: CreateOnboardingDTO, { container }) => {
    const service = container.resolve<PayoutModuleService>(PAYOUT_MODULE)

    const onboarding = await service.initializeOnboarding(input)

    return new StepResponse(onboarding, onboarding.id)
  }
)
