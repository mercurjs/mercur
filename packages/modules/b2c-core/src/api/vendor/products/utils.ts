import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  batchVariantImagesWorkflow,
  updateProductVariantsWorkflow
} from '@medusajs/medusa/core-flows'

import { VariantImagesType } from './validators'

export const VARIANT_IMAGE_METADATA_KEY = 'variant_image_key'

type OrderDirection = 'ASC' | 'DESC' | 'asc' | 'desc'
export type OrderObject = Record<
  string,
  OrderDirection | Record<string, OrderDirection>
>

const cleanKey = (key: string): string => {
  return key.split('=').pop()?.replace(/^\*/, '') || key
}

const normalizeDirection = (direction: string): 'asc' | 'desc' => {
  return direction.toLowerCase() === 'desc' ? 'desc' : 'asc'
}

const addOrderEntry = (
  orderBy: Array<{ column: string; order: 'asc' | 'desc' }>,
  key: string,
  direction: string
): void => {
  const column = key.includes('.') ? key : `product.${key}`
  orderBy.push({ column, order: normalizeDirection(direction) })
}

const parseOrderForKnex = (
  order: OrderObject | null | undefined
): Array<{ column: string; order: 'asc' | 'desc' }> => {
  if (!order || typeof order !== 'object') {
    return []
  }

  const orderBy: Array<{ column: string; order: 'asc' | 'desc' }> = []

  for (const [key, value] of Object.entries(order)) {
    if (typeof value === 'string') {
      addOrderEntry(orderBy, cleanKey(key), value)
    } else if (value && typeof value === 'object') {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (typeof nestedValue === 'string') {
          addOrderEntry(orderBy, nestedKey, nestedValue)
        }
      }
    }
  }

  return orderBy
}

export type ProductFilters = {
  q?: string
  id?: string | string[]
  status?: string | string[]
  type_id?: string | string[]
  collection_id?: string | string[]
  categories?: { id?: string | string[] }
  tags?: { id?: string | string[] }
  created_at?: Record<string, string>
  updated_at?: Record<string, string>
}

export const filterProductsBySeller = async (
  container: MedusaContainer,
  sellerId: string,
  skip: number,
  take: number,
  salesChannelId?: string,
  order?: OrderObject,
  filters?: ProductFilters
) => {
  const q = filters?.q
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  let baseQuery = knex('product')
    .distinct('product.id')
    .innerJoin(
      'seller_seller_product_product',
      'product.id',
      'seller_seller_product_product.product_id'
    )
    .where({
      'seller_seller_product_product.seller_id': sellerId,
      'seller_seller_product_product.deleted_at': null,
      'product.deleted_at': null
    })

  if (q) {
    const searchTerm = `%${q}%`
    baseQuery = baseQuery.andWhere(function () {
      this.whereILike('product.title', searchTerm).orWhereILike(
        'product.id',
        searchTerm
      )
    })
  }

  if (salesChannelId) {
    baseQuery = baseQuery
      .innerJoin(
        'product_sales_channel',
        'product.id',
        'product_sales_channel.product_id'
      )
      .where('product_sales_channel.sales_channel_id', salesChannelId)
  }

  if (filters) {
    if (filters.id) {
      const ids = Array.isArray(filters.id) ? filters.id : [filters.id]
      baseQuery = baseQuery.whereIn('product.id', ids)
    }

    if (filters.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status]
      baseQuery = baseQuery.whereIn('product.status', statuses)
    }

    if (filters.type_id) {
      const typeIds = Array.isArray(filters.type_id)
        ? filters.type_id
        : [filters.type_id]
      baseQuery = baseQuery.whereIn('product.type_id', typeIds)
    }

    if (filters.collection_id) {
      const collectionIds = Array.isArray(filters.collection_id)
        ? filters.collection_id
        : [filters.collection_id]
      baseQuery = baseQuery.whereIn('product.collection_id', collectionIds)
    }

    if (filters.categories?.id) {
      const categoryIds = Array.isArray(filters.categories.id)
        ? filters.categories.id
        : [filters.categories.id]
      baseQuery = baseQuery
        .innerJoin(
          'product_category_product',
          'product.id',
          'product_category_product.product_id'
        )
        .whereIn('product_category_product.product_category_id', categoryIds)
    }

    if (filters.tags?.id) {
      const tagIds = Array.isArray(filters.tags.id)
        ? filters.tags.id
        : [filters.tags.id]
      baseQuery = baseQuery
        .innerJoin('product_tags', 'product.id', 'product_tags.product_id')
        .whereIn('product_tags.product_tag_id', tagIds)
    }

    if (filters.created_at) {
      baseQuery = applyDateFilter(
        baseQuery,
        'product.created_at',
        filters.created_at
      )
    }

    if (filters.updated_at) {
      baseQuery = applyDateFilter(
        baseQuery,
        'product.updated_at',
        filters.updated_at
      )
    }
  }

  const countQuery = baseQuery
    .clone()
    .clearSelect()
    .countDistinct('product.id as count')
  const [{ count }] = await countQuery
  const totalCount = parseInt(count as string, 10)

  if (order) {
    const parsedOrder = parseOrderForKnex(order)
    if (parsedOrder.length > 0) {
      const orderColumns = parsedOrder.map((o) => o.column)
      const selectColumns = [
        'product.id',
        ...orderColumns.filter((col) => col !== 'product.id')
      ]

      baseQuery = baseQuery.distinct(...selectColumns)
      baseQuery = baseQuery.orderBy(parsedOrder)
    }
  }

  const productIds = await baseQuery
    .offset(skip)
    .limit(take)
    .pluck('product.id')

  return { productIds, count: totalCount }
}

const applyDateFilter = <T extends { where: (...args: unknown[]) => T }>(
  query: T,
  column: string,
  dateFilter: Record<string, string>
): T => {
  let result = query
  if (dateFilter.$gte) {
    result = result.where(column, '>=', dateFilter.$gte)
  }
  if (dateFilter.$gt) {
    result = result.where(column, '>', dateFilter.$gt)
  }
  if (dateFilter.$lte) {
    result = result.where(column, '<=', dateFilter.$lte)
  }
  if (dateFilter.$lt) {
    result = result.where(column, '<', dateFilter.$lt)
  }
  if (dateFilter.$eq) {
    result = result.where(column, '=', dateFilter.$eq)
  }
  return result
}

export const mergeVariantImages = (
  existingImages: Array<{ url: string }> | undefined,
  variantImagePayload: VariantImagesType[] | undefined
) => {
  const existingImageUrls = new Set(existingImages?.map((img) => img.url) ?? [])
  const allVariantImageUrls = new Set<string>()
  for (const vi of variantImagePayload ?? []) {
    vi.image_urls?.forEach((url) => allVariantImageUrls.add(url))
    if (vi.thumbnail_url) {
      allVariantImageUrls.add(vi.thumbnail_url)
    }
  }

  const newVariantImages = [...allVariantImageUrls]
    .filter((url) => !existingImageUrls.has(url))
    .map((url) => ({ url }))

  return [...(existingImages ?? []), ...newVariantImages]
}

type ProductVariantWithMetadata = {
  id: string
  metadata?: Record<string, unknown> | null
}

type ProductImage = {
  id?: string
  url: string
}

export const assignVariantImages = async (
  container: MedusaContainer,
  variantImagePayload: VariantImagesType[] | undefined,
  createdProduct: {
    variants?: ProductVariantWithMetadata[]
    images?: ProductImage[]
  }
) => {
  if (!variantImagePayload?.length || !createdProduct.variants?.length) {
    return
  }

  const { variants, images = [] } = createdProduct

  const variantEntries = variants
    .map((variant) => {
      const key = variant.metadata?.[VARIANT_IMAGE_METADATA_KEY]
      if (!key || typeof key !== 'string') {
        return undefined
      }
      return [key, variant] as const
    })
    .filter((entry): entry is readonly [string, ProductVariantWithMetadata] =>
      Boolean(entry)
    )
  const variantByKey = new Map(variantEntries)
  const imageUrlToId = new Map(images.map((img) => [img.url, img.id]))

  const tasks = variantImagePayload.map(
    async ({ variant_image_key, image_urls, thumbnail_url }) => {
      const variant = variantByKey.get(variant_image_key)
      if (!variant) {
        return
      }

      const ops: Promise<unknown>[] = []

      if (image_urls?.length) {
        const uniqueImageUrls = [...new Set(image_urls)]
        const imageIds = uniqueImageUrls
          .map((url) => imageUrlToId.get(url))
          .filter((id): id is string => !!id)

        if (imageIds.length) {
          ops.push(
            batchVariantImagesWorkflow.run({
              container,
              input: { variant_id: variant.id, add: imageIds }
            })
          )
        }
      }

      if (thumbnail_url && imageUrlToId.has(thumbnail_url)) {
        ops.push(
          updateProductVariantsWorkflow.run({
            container,
            input: {
              selector: { id: variant.id },
              update: { thumbnail: thumbnail_url }
            }
          })
        )
      }

      if (ops.length) {
        await Promise.all(ops)
      }
    }
  )

  await Promise.all(tasks)
}
