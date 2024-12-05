import MarketplaceModuleService from 'src/modules/marketplace/service'
import { OrderSetDTO } from 'src/modules/marketplace/types'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { MARKETPLACE_MODULE } from '../../../modules/marketplace'

export const getOrderSetListStep = createStep(
  'get-order-set-list',
  async (
    input: { variables?: Record<string, any>; fields: string[] },
    { container }
  ) => {
    const service =
      container.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE)

    const { filters, pagination } = input.variables ?? {}

    const [orderSets, count] = await service.listAndCountOrderSets(
      filters,
      pagination
    )

    return new StepResponse({ orderSets: orderSets as OrderSetDTO[], count })
  }
)
