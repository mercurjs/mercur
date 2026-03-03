import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

export const filterSellerProductsByCollection = async (
  container: MedusaContainer,
  collectionId: string,
  sellerId: string,
  skip: number,
  take: number
) => {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const baseQuery = knex('product')
    .distinct('product.id')
    .innerJoin(
      'seller_seller_product_product',
      'product.id',
      'seller_seller_product_product.product_id'
    )
    .where({
      'seller_seller_product_product.seller_id': sellerId,
      'product.collection_id': collectionId,
      'seller_seller_product_product.deleted_at': null,
      'product.deleted_at': null
    })

  const countQuery = baseQuery
    .clone()
    .clearSelect()
    .count('product.id as count')
  const [{ count }] = await countQuery
  const totalCount = parseInt(count as string, 10)

  const productIds = await baseQuery
    .offset(skip)
    .limit(take)
    .pluck('product.id')

  return { productIds, count: totalCount }
}

export const filterSellerProductIds = async (
  container: MedusaContainer,
  sellerId: string,
  productIds: string[]
): Promise<Set<string>> => {
  if (!productIds.length) {
    return new Set()
  }

  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const rows: string[] = await knex('seller_seller_product_product')
    .where({
      seller_id: sellerId,
      deleted_at: null
    })
    .whereIn('product_id', productIds)
    .pluck('product_id')

  return new Set(rows)
}
