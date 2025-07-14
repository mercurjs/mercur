import { Modules } from '@medusajs/framework/utils'
import { deleteProductsWorkflow } from '@medusajs/medusa/core-flows'

import { AlgoliaEvents } from '@mercurjs/framework'

/**
 * Emits Algolia products deleted event when products are removed.
 */
deleteProductsWorkflow.hooks.productsDeleted(async ({ ids }, { container }) => {
  await container.resolve(Modules.EVENT_BUS).emit({
    name: AlgoliaEvents.PRODUCTS_DELETED,
    data: { ids }
  })
})
