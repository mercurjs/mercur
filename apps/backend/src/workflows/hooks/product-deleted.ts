import { deleteProductsWorkflow } from '@medusajs/medusa/core-flows'

import { AlgoliaEvents } from '../../modules/algolia/types'

deleteProductsWorkflow.hooks.productsDeleted(async ({ ids }, { container }) => {
  await container.resolve('event_bus').emit({
    name: AlgoliaEvents.PRODUCTS_DELETED,
    data: { ids }
  })
})
