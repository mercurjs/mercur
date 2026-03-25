import { z } from 'zod'

import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys, arrayDifference } from '@medusajs/framework/utils'

import { MeilisearchProductValidator, MeilisearchVariantValidator } from '../../modules/meilisearch/types'

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

  for (const product of products as any[]) {
    product.options = (product.options ?? [])
      .filter((option: any) => option?.title && option?.values)
      .map((option: any) =>
        option.values.map((value: any) => {
          const entry: Record<string, string> = {}
          entry[option.title.toLowerCase()] = value.value
          return entry
        })
      )
      .flat()

    product.variants = z
      .array(MeilisearchVariantValidator)
      .parse(product.variants ?? [])

    product.variants = (product.variants ?? []).map((variant: any) =>
      (variant.options ?? []).reduce((entry: any, item: any) => {
        if (item?.option?.title) {
          entry[item.option.title.toLowerCase()] = item.value
        }
        return entry
      }, variant)
    )
  }

  return z.array(MeilisearchProductValidator).parse(products)
}
