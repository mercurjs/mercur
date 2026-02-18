import {
  InjectManager,
  MedusaContext,
  MedusaService,
} from '@medusajs/framework/utils'
import { Context } from '@medusajs/framework/types'
import { EntityManager } from '@medusajs/framework/mikro-orm/knex'

import { Review } from './models/review'

class ReviewModuleService extends MedusaService({
  Review
}) {
  @InjectManager()
  async getAvgRating(
    type: 'seller' | 'product',
    id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<string | null> {
    const knex = sharedContext!.manager!.getKnex()

    const joinField = type === 'product' ? 'product_id' : 'seller_id'
    const joinTable =
      type === 'product'
        ? 'product_product_review_review'
        : 'seller_seller_review_review'

    const [result] = await knex('review')
      .avg('review.rating')
      .leftJoin(joinTable, `${joinTable}.review_id`, 'review.id')
      .where(`${joinTable}.${joinField}`, id)

    return result?.avg ?? null
  }

  @InjectManager()
  async getSellersWithRating(
    fields: string[],
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const knex = sharedContext!.manager!.getKnex()

    const result = await knex
      .select(...fields.map((f) => `seller.${f}`))
      .avg('review.rating as rating')
      .from('seller')
      .leftJoin(
        'seller_seller_review_review',
        'seller.id',
        'seller_seller_review_review.seller_id'
      )
      .leftJoin('review', 'review.id', 'seller_seller_review_review.review_id')
      .groupBy('seller.id')

    return result
  }

  @InjectManager()
  async getProductsWithRating(
    fields: string[],
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const knex = sharedContext!.manager!.getKnex()

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
}

export default ReviewModuleService
