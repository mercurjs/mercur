import { Modules, ProductStatus } from '@medusajs/framework/utils'
import {
  StepResponse,
  WorkflowResponse,
  createStep,
  createWorkflow
} from '@medusajs/workflows-sdk'

import { AlgoliaEvents } from '../types/algolia/events'

export const updateProductStatusStep = createStep(
  'update-product-status',
  async (input: { id: string; status: ProductStatus }, { container }) => {
    const service = container.resolve(Modules.PRODUCT)
    const knex = container.resolve('__pg_connection__')
    const eventBus = container.resolve(Modules.EVENT_BUS)

    await knex('product').where('id', input.id).update({
      status: input.status
    })

    const product = await service.retrieveProduct(input.id)

    await eventBus.emit({
      name: AlgoliaEvents.PRODUCTS_CHANGED,
      data: { ids: [input.id] }
    })

    return new StepResponse(product, product.id)
  }
)

export const updateProductStatusWorkflow = createWorkflow(
  'update-product-status',
  function (input: { id: string; status: ProductStatus }) {
    return new WorkflowResponse(updateProductStatusStep(input))
  }
)
