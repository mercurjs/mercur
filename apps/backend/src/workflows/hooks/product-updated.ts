import { updateProductsWorkflow } from '@medusajs/medusa/core-flows'

import { AlgoliaEvents } from '../../modules/algolia/types'

updateProductsWorkflow.hooks.productsUpdated(
  async ({ products }, { container }) => {
    await container.resolve('event_bus').emit({
      name: AlgoliaEvents.PRODUCTS_CHANGED,
      data: { ids: products.map((product) => product.id) }
    })
  }
)
