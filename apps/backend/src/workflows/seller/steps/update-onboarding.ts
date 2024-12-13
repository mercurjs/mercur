import { UpdateOnboardingDTO } from '#/modules/seller/types'
import SellerModuleService from 'src/modules/seller/service'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SELLER_MODULE } from '../../../modules/seller'

export const updateOnboardingStep = createStep(
  'update-onboarding',
  async (input: UpdateOnboardingDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const selector =
      'id' in input ? { id: input.id } : { seller_id: input.seller_id }

    const [previousData] = await service.listOnboardings(selector)

    const onboarding = await service.updateOnboardings({
      selector,
      data: input
    })

    return new StepResponse(onboarding, previousData)
  },
  async (previousData: UpdateOnboardingDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.updateOnboardings(previousData)
  }
)
