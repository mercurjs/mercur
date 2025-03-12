import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SELLER_MODULE } from '../../../modules/seller'
import SellerModuleService from '../../../modules/seller/service'
import { SellerDTO } from '../../../modules/seller/types'

export const createSellerOnboardingStep = createStep(
  'create-seller-onboarding',
  async (input: SellerDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const onboarding = await service.createSellerOnboardings({
      seller_id: input.id
    })

    return new StepResponse(onboarding, onboarding.id)
  }
)
