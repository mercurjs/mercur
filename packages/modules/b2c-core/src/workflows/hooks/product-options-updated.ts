import { Modules } from '@medusajs/framework/utils'
import { updateProductOptionsWorkflow } from '@medusajs/medusa/core-flows'

import { AlgoliaEvents } from '@mercurjs/framework'

updateProductOptionsWorkflow.hooks.productOptionsUpdated(
  async ({ product_options }, { container }) => {
    await container.resolve(Modules.EVENT_BUS).emit({
      name: AlgoliaEvents.PRODUCTS_CHANGED,
      data: {
        ids: product_options
          .map((v) => v.product_id)
          .filter((v) => v && v !== null)
      }
    })
  }
)
