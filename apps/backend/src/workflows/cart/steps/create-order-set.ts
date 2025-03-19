import { MARKETPLACE_MODULE } from '#/modules/marketplace'
import MarketplaceModuleService from '#/modules/marketplace/service'
import { CreateOrderSetDTO } from '#/modules/marketplace/types'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

export const createOrderSetStep = createStep(
  'create-order-set',
  async (input: CreateOrderSetDTO, { container }) => {
    const service =
      container.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE)

    const orderSet = await service.createOrderSets(input)

    return new StepResponse(orderSet, orderSet.id)
  },
  async (orderSetId: string, { container }) => {
    const service =
      container.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE)
    await service.deleteOrderSets(orderSetId)
  }
)
