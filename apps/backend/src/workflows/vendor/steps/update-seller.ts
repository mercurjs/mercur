import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'
import { SellerDTO, UpdateSellerDTO } from '@mercurjs/types'
import SellerModuleService from 'src/modules/seller/service'

import { SELLER_MODULE } from '../../../modules/seller'

export const updateSellerStep = createStep(
  'update-seller',
  async (input: UpdateSellerDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const [previousData] = await service.listSellers({
      id: input.id
    })

    const updatedSellers: SellerDTO = await service.updateSellers(input)

    return new StepResponse(updatedSellers, previousData)
  },
  async (previousData: SellerDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.updateSellers(previousData)
  }
)
