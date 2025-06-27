import { MedusaContainer } from '@medusajs/framework'

export async function getAvgRating(
  container: MedusaContainer,
  type: 'seller' | 'product',
  id: string
): Promise<string | null> {
  const knex = container.resolve('__pg_connection__')

  const joinField = type === 'product' ? 'product_id' : 'seller_id'
  const joinTable =
    type === 'product'
      ? 'product_product_review_review'
      : 'seller_seller_review_review'

  const [result] = await knex('review')
    .avg('review.rating')
    .leftJoin(joinTable, `${joinTable}.review_id`, 'review.id')
    .where(`${joinTable}.${joinField}`, id)

  return result.avg
}

export async function getSellersWithRating(
  container: MedusaContainer,
  fields: string[]
) {
  const knex = container.resolve('__pg_connection__')

  const result = await knex
    .select(...fields.map((f) => `seller.${f}`))
    .avg('review.rating as rating')
    .from('product')
    .leftJoin(
      'seller_seller_review_review',
      'seller.id',
      'seller_seller_review_review.product_id'
    )
    .leftJoin('review', 'review.id', 'seller_seller_review_review.review_id')
    .groupBy('seller.id')

  return result
}

export async function getProductsWithRating(
  container: MedusaContainer,
  fields: string[]
) {
  const knex = container.resolve('__pg_connection__')

  const result = await knex
    .select(...fields.map((f) => `product.${f}`))
    .avg('review.rating as rating')
    .from('product')
    .leftJoin(
      'product_product_review_review',
      'product.id',
      'product_product_review_review.product_id'
    )
    .leftJoin('review', 'review.id', 'product_product_review_review.review_id')
    .groupBy('product.id')

  return result
}
