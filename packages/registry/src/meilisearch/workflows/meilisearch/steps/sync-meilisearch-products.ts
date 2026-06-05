import { IEventBusModuleService, RemoteQueryFunction } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { MEILISEARCH_MODULE, MeilisearchModuleService } from '../../../modules/meilisearch'
import { MeilisearchEvents } from '../../../modules/meilisearch/types'
import { chunkArray } from '../../../subscribers/utils/meilisearch-product'

export const syncMeilisearchProductsStep = createStep(
  'sync-meilisearch-products',
  async (_: void, { container }) => {
    const query = container.resolve<RemoteQueryFunction>(
      ContainerRegistrationKeys.QUERY
    )
    const meilisearch =
      container.resolve<MeilisearchModuleService>(MEILISEARCH_MODULE)
    const eventBus = container.resolve<IEventBusModuleService>(Modules.EVENT_BUS)

    await meilisearch.ensureSettings()

    const { data: allProducts } = await query.graph({
      entity: 'product',
      fields: ['id', 'status'],
    })

    const toDelete: string[] = []
    const toIndex: string[] = []

    for (const product of allProducts) {
      if (product.status === 'published') {
        toIndex.push(product.id)
      } else {
        toDelete.push(product.id)
      }
    }

    if (toDelete.length) {
      await meilisearch.batchDelete(toDelete)
    }

    const chunks = chunkArray(toIndex, 100)
    await Promise.all(
      chunks.map((chunk) =>
        eventBus.emit({
          name: MeilisearchEvents.PRODUCTS_CHANGED,
          data: { ids: chunk },
        })
      )
    )

    return new StepResponse()
  }
)
