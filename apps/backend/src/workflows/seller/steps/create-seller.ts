import SellerModuleService from 'src/modules/seller/service'

import { kebabCase } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SELLER_MODULE } from '../../../modules/seller'
import { CreateSellerDTO, SellerDTO } from '../../../modules/seller/types'

export const createSellerStep = createStep(
  'create-seller',
  async (input: CreateSellerDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const seller: SellerDTO = await service.createSellers({
      ...input,
      handle: kebabCase(input.name)
    })

    return new StepResponse(seller, seller.id)
  },
  async (id: string, { container }) => {
    if (!id) {
      return
    }

    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.deleteSellers([id])
  }
)
