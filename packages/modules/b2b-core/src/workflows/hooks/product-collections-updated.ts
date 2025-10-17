import { Modules } from '@medusajs/framework/utils'
import { updateCollectionsWorkflow } from '@medusajs/medusa/core-flows'

import { AlgoliaEvents } from '@mercurjs/framework'

updateCollectionsWorkflow.hooks.collectionsUpdated(
  async ({ collections }, { container }) => {
    const productIds = collections
      .map((c) => c.products)
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
