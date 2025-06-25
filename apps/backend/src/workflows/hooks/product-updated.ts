import { Modules } from '@medusajs/framework/utils'
import { updateProductsWorkflow } from '@medusajs/medusa/core-flows'

import { AlgoliaEvents } from '@mercurjs/framework'

import { productsUpdatedHookHandler } from '../attribute/utils'

updateProductsWorkflow.hooks.productsUpdated(
  async ({ products, additional_data }, { container }) => {
    await productsUpdatedHookHandler({
      products,
      additional_data,
      container
    })

    await container.resolve(Modules.EVENT_BUS).emit({
      name: AlgoliaEvents.PRODUCTS_CHANGED,
      data: { ids: products.map((product) => product.id) }
    })
  }
)
