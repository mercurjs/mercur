import { Modules, ProductStatus } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { AlgoliaEvents } from '@mercurjs/framework'

export const updateProductStatusStep = createStep(
  'update-product-status',
  async (input: { id: string; status: ProductStatus }, { container }) => {
    const service = container.resolve(Modules.PRODUCT)
    const eventBus = container.resolve(Modules.EVENT_BUS)

    const product = await service.updateProducts(input.id, {
      status: input.status
    })

    await eventBus.emit({
      name: AlgoliaEvents.PRODUCTS_CHANGED,
      data: { ids: [input.id] }
    })

    return new StepResponse(product, product.id)
  }
)
