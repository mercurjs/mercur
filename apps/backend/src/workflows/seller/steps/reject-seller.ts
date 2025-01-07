import SellerModuleService from 'src/modules/seller/service'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SELLER_MODULE } from '../../../modules/seller'
import { ChangeSellerStatusDTO, SellerDTO } from '../../../modules/seller/types'

export const rejectSellerStep = createStep(
  'reject-seller',
  async (input: ChangeSellerStatusDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const [previousData] = await service.listSellers({
      id: input.id
    })

    const updatedSellers: SellerDTO = await service.updateSellers({
      ...input
    })

    return new StepResponse(updatedSellers, previousData)
  },
  async (previousData: SellerDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.updateSellers(previousData)
  }
)
