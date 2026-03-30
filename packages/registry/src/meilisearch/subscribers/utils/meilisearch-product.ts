import { z } from 'zod'

import { MedusaContainer } from '@medusajs/framework'
import { IEventBusModuleService } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules, arrayDifference } from '@medusajs/framework/utils'

import { MeilisearchProductValidator } from '../../modules/meilisearch/types'
import { MeilisearchEvents } from '../../modules/meilisearch/types'

const CHUNK_SIZE = 100

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

export async function filterProductsByStatus(
  container: MedusaContainer,
  ids: string[] = []
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: 'product',
    fields: ['id', 'status'],
    filters: { id: ids },
  })

  const published = products.filter((p) => p.status === 'published')
  const notPublished = arrayDifference(products, published)

  const existingIds = new Set(products.map((p) => p.id))
  const deletedIds = ids.filter((id) => !existingIds.has(id))

  return {
    published: published.map((p) => p.id),
    other: [...notPublished.map((p) => p.id), ...deletedIds],
  }
}

function flattenProductOptions(options: any[]): Record<string, string>[] {
  return (options ?? [])
    .filter((option: any) => option?.title && option?.values)
    .flatMap((option: any) =>
      option.values.map((value: any) => ({
        [option.title.toLowerCase()]: value.value,
      }))
    )
}

function flattenVariantOptions(variant: any): Record<string, unknown> {
  return (variant.options ?? []).reduce(
    (entry: Record<string, unknown>, item: any) => {
      if (item?.option?.title) {
        entry[item.option.title.toLowerCase()] = item.value
      }
      return entry
    },
    { ...variant }
  )
}

export async function findAndTransformMeilisearchProducts(
  container: MedusaContainer,
  ids: string[] = []
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: 'product',
    fields: [
      '*',
      'categories.name',
      'categories.id',
      'collection.title',
      'tags.value',
      'type.value',
      'variants.*',
      'variants.options.*',
      'variants.prices.*',
      'options.*',
      'options.values.*',
      'images.*',
      'seller.id',
      'seller.handle',
      'seller.name',
      'seller.status',
    ],
    filters: ids.length
      ? { id: ids, status: 'published' }
      : { status: 'published' },
  })

  const transformed = products.map((product: any) => ({
    ...product,
    options: flattenProductOptions(product.options),
    variants: (product.variants ?? []).map(flattenVariantOptions),
  }))

  return z.array(MeilisearchProductValidator).parse(transformed)
}

export async function reindexSellerProducts(
  container: MedusaContainer,
  sellerId: string,
  action: string
) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const eventBus = container.resolve<IEventBusModuleService>(Modules.EVENT_BUS)

  try {
    const { data: sellers } = await query.graph({
      entity: 'seller',
      fields: ['products.id'],
      filters: { id: sellerId },
    })

    const productIds: string[] =
      (sellers[0] as any)?.products?.map((p: any) => p.id) ?? []

    if (!productIds.length) {
      return
    }

    logger.debug(
      `Meilisearch: Seller ${sellerId} ${action} — re-indexing ${productIds.length} products`
    )

    const chunks = chunkArray(productIds, CHUNK_SIZE)
    await Promise.all(
      chunks.map((chunk) =>
        eventBus.emit({
          name: MeilisearchEvents.PRODUCTS_CHANGED,
          data: { ids: chunk },
        })
      )
    )
  } catch (error: unknown) {
    logger.error(
      `Meilisearch: Failed to process seller.${action} for seller ${sellerId}:`,
      error as Error
    )
    throw error
  }
}
