import SellerModuleService from 'src/modules/seller/service'

import { kebabCase } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SELLER_MODULE } from '../../../modules/seller'
import { SellerDTO, UpdateSellerDTO } from '../../../modules/seller/types'

export const updateSellerStep = createStep(
  'update-seller',
  async (input: UpdateSellerDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const [previousData] = await service.listSellers({
      id: input.id
    })

    const newHandle = input.name ? kebabCase(input.name) : undefined

    const updatedSellers: SellerDTO = await service.updateSellers({
      ...input,
      ...(newHandle ? { handle: newHandle } : {})
    })

    return new StepResponse(updatedSellers, previousData as UpdateSellerDTO)
  },
  async (previousData: UpdateSellerDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.updateSellers(previousData)
  }
)
