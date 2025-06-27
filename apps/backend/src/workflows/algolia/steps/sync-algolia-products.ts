import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { ALGOLIA_MODULE, AlgoliaModuleService } from '@mercurjs/algolia'
import { AlgoliaEvents, IndexType } from '@mercurjs/framework'

const CHUNK_SIZE = 100

export const syncAlgoliaProductsStep = createStep(
  'sync-algolia-products',
  async (_: void, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const algolia = container.resolve<AlgoliaModuleService>(ALGOLIA_MODULE)

    const { data: productsToDelete } = await query.graph({
      entity: 'product',
      filters: {
        $or: [
          {
            deleted_at: {
              $ne: null
            }
          },
          {
            status: {
              $ne: 'published'
            }
          }
        ]
      },
      fields: ['id']
    })

    await algolia.batchDelete(
      IndexType.PRODUCT,
      productsToDelete.map((p) => p.id)
    )

    const { data: publishedProducts } = await query.graph({
      entity: 'product',
      filters: {
        status: 'published'
      },
      fields: ['id']
    })

    const productsToInsert = publishedProducts.map((p) => p.id)
    const productChunks: string[][] = []
    for (let i = 0; i < productsToInsert.length; i += CHUNK_SIZE) {
      productChunks.push(productsToInsert.slice(i, i + CHUNK_SIZE))
    }

    const eventBus = container.resolve(Modules.EVENT_BUS)
    for (const chunk of productChunks) {
      await eventBus.emit({
        name: AlgoliaEvents.PRODUCTS_CHANGED,
        data: {
          ids: chunk
        }
      })
    }

    return new StepResponse()
  }
)
