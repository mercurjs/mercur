import { Modules } from '@medusajs/framework/utils'
import { updateProductVariantsWorkflow } from '@medusajs/medusa/core-flows'

import { AlgoliaEvents } from '@mercurjs/framework'

updateProductVariantsWorkflow.hooks.productVariantsUpdated(
  async ({ product_variants }, { container }) => {
    await container.resolve(Modules.EVENT_BUS).emit({
      name: AlgoliaEvents.PRODUCTS_CHANGED,
      data: {
        ids: product_variants
          .map((v) => v.product_id)
          .filter((v) => v && v !== null)
      }
    })
  }
)
