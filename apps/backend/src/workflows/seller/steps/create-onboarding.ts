import { CreateOnboardingDTO } from '#/modules/seller/types'
import SellerModuleService from 'src/modules/seller/service'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SELLER_MODULE } from '../../../modules/seller'

export const createOnboardingStep = createStep(
  'create-onboarding',
  async (input: CreateOnboardingDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const onboarding = await service.createOnboardings({
      seller: input.seller_id
    })

    return new StepResponse(onboarding, onboarding.id)
  },
  async (id: string, { container }) => {
    if (!id) {
      return
    }

    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.deleteOnboardings(id)
  }
)
