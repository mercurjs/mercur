import { Modules } from '@medusajs/framework/utils'
import { updateProductTagsWorkflow } from '@medusajs/medusa/core-flows'

import { AlgoliaEvents } from '@mercurjs/framework'

updateProductTagsWorkflow.hooks.productTagsUpdated(
  async ({ product_tags }, { container }) => {
    const productIds = product_tags
      .map((t) => t.products)
      .flat()
      .map((p) => p?.id)
      .filter((v) => v && v !== null)

    await container.resolve(Modules.EVENT_BUS).emit({
      name: AlgoliaEvents.PRODUCTS_CHANGED,
      data: {
        ids: new Set([...productIds])
      }
    })
  }
)
