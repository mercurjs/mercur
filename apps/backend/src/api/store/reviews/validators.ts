import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type StoreGetReviewsParamsType = z.infer<typeof StoreGetReviewsParams>
export const StoreGetReviewsParams = createFindParams({
  offset: 0,
  limit: 50
})

/**
 * @schema StoreCreateReview
 * title: "Create Review"
 * description: "A schema for creating a review."
 * x-resourceId: StoreCreateReview
 * type: object
 * properties:
 *   order_id:
 *     type: string
 *     description: The unique identifier of the order.
 *   reference:
 *     type: string
 *     enum: [seller, product]
 *     description: Indicates if review reference is seller or product
 *   reference_id:
 *     type: string
 *     description: The unique identifier of reference.
 *   rating:
 *     type: number
 *     description: The customer rating on the resource.
 *     maximum: 5
 *     minimum: 1
 *   customer_note:
 *     type: string
 *     description: The customer note on the resource.
 *     maxLength: 300
 */
export type StoreCreateReviewType = z.infer<typeof StoreCreateReview>
export const StoreCreateReview = z.object({
  order_id: z.string(),
  reference: z.enum(['seller', 'product']),
  reference_id: z.string(),
  rating: z.number().int().min(1).max(5),
  customer_note: z.string().max(300).nullable()
})

/**
 * @schema StoreUpdateReview
 * title: "Update Review"
 * description: "A schema for the review update."
 * x-resourceId: StoreUpdateReview
 * type: object
 * properties:
 *   rating:
 *     type: number
 *     description: The customer rating on the resource.
 *     maximum: 5
 *     minimum: 1
 *   customer_note:
 *     type: string
 *     description: The customer note on the resource.
 *     maxLength: 300
 */
export type StoreUpdateReviewType = z.infer<typeof StoreUpdateReview>
export const StoreUpdateReview = z.object({
  rating: z.number().int().min(1).max(5),
  customer_note: z.string().max(300).nullable()
})
