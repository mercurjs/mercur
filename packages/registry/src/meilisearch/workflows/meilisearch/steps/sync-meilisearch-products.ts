import { IEventBusModuleService, RemoteQueryFunction } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { MEILISEARCH_MODULE, MeilisearchModuleService } from '../../../modules/meilisearch'
import { MeilisearchEvents } from '../../../modules/meilisearch/types'

const CHUNK_SIZE = 100

export const syncMeilisearchProductsStep = createStep(
  'sync-meilisearch-products',
  async (_: void, { container }) => {
    const query = container.resolve<RemoteQueryFunction>(
      ContainerRegistrationKeys.QUERY
    )
    const meilisearch =
      container.resolve<MeilisearchModuleService>(MEILISEARCH_MODULE)
    const eventBus = container.resolve<IEventBusModuleService>(Modules.EVENT_BUS)

    // Configure index settings (filterable, searchable, sortable attributes)
    await meilisearch.ensureSettings()

    // Delete products that are not published or have been soft-deleted
    const { data: productsToDelete } = await query.graph({
      entity: 'product',
      filters: {
        status: { $ne: 'published' },
      },
      fields: ['id'],
    })

    if (productsToDelete.length) {
      await meilisearch.batchDelete(productsToDelete.map((p) => p.id))
    }

    // Fetch all published product IDs and process in chunks
    const { data: publishedProducts } = await query.graph({
      entity: 'product',
      filters: { status: 'published' },
      fields: ['id'],
    })

    const productIds = publishedProducts.map((p) => p.id)

    for (let i = 0; i < productIds.length; i += CHUNK_SIZE) {
      const chunk = productIds.slice(i, i + CHUNK_SIZE)
      await eventBus.emit({
        name: MeilisearchEvents.PRODUCTS_CHANGED,
        data: { ids: chunk },
      })
    }

    return new StepResponse()
  }
)
