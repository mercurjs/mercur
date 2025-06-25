import { Modules } from '@medusajs/framework/utils'
import { deleteProductsWorkflow } from '@medusajs/medusa/core-flows'

import { AlgoliaEvents } from '@mercurjs/framework'

deleteProductsWorkflow.hooks.productsDeleted(async ({ ids }, { container }) => {
  await container.resolve(Modules.EVENT_BUS).emit({
    name: AlgoliaEvents.PRODUCTS_DELETED,
    data: { ids }
  })
})
