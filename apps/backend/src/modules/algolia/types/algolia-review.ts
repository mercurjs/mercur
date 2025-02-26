import { z } from 'zod'

export type AlgoliaReview = z.infer<typeof AlgoliaReviewValidator>
export const AlgoliaReviewValidator = z.object({
  id: z.string(),
  reference: z.string(),
  reference_id: z.string(),
  rating: z.coerce.number(),
  customer_note: z.string().nullable(),
  seller_note: z.string().nullable()
})
