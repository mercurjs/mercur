import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

export const filterProductsBySeller = async (
  container: MedusaContainer,
  sellerId: string,
  skip: number,
  take: number,
  salesChannelId?: string
) => {
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

  if (salesChannelId) {
    baseQuery = baseQuery
      .innerJoin(
        'product_sales_channel',
        'product.id',
        'product_sales_channel.product_id'
      )
      .where('product_sales_channel.sales_channel_id', salesChannelId)
  }

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
