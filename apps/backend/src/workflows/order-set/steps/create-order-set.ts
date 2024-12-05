import MarketplaceModuleService from 'src/modules/marketplace/service'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { MARKETPLACE_MODULE } from '../../../modules/marketplace'
import { OrderSetDTO } from '../../../modules/marketplace/types'

export const createOrderSetStep = createStep(
  'create-order-set',
  async (_input: void, { container }) => {
    const service =
      container.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE)

    const orderSet: OrderSetDTO = await service.createOrderSets({})

    return new StepResponse(orderSet, orderSet.id)
  },
  async (orderSetId: string, { container }) => {
    const service =
      container.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE)
    await service.deleteOrderSets(orderSetId)
  }
)
