import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SELLER_MODULE } from '../../../modules/seller'
import SellerModuleService from '../../../modules/seller/service'

export const deleteSellerStep = createStep(
  'delete-seller',
  async (id: string, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.softDeleteSellers(id)

    return new StepResponse(id)
  },
  async (id: string, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.restoreSellers(id)
  }
)
