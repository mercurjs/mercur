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
