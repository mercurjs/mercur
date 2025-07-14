import { z } from 'zod'

import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { AlgoliaReviewValidator } from '@mercurjs/framework'

/**
 * *
 * This function "Transforms reviews for Algolia using specified IDs."
 * 
 * @param {MedusaContainer} container - Medusa infrastructure and service access point
 * @param {string[]} ids - The IDs of the "/ users/mslusarczyk/ desktop/mercur/apps/backend/src/subscribers/utils/algolia-reviews".
 * @returns {Promise<{ id: string; reference_id: string; reference: string; rating: number; customer_note: string; seller_note: string; }[]>} Represents the completion of an asynchronous operation

 */
export async function findAndTransformAlgoliaReviews(
  container: MedusaContainer,
  ids: string[] = []
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: reviews } = await query.graph({
    entity: 'review',
    fields: ['*', 'seller.id', 'product.id'],
    filters: ids.length
      ? {
          id: ids
        }
      : {}
  })

  for (const review of reviews) {
    review.reference_id = review.seller?.id || review.product?.id
  }

  return z.array(AlgoliaReviewValidator).parse(reviews)
}
