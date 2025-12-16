import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type AdminGetRequestsParamsType = z.infer<typeof AdminGetRequestsParams>
export const AdminGetRequestsParams = createFindParams({
  offset: 0,
  limit: 50
}).extend({
  type: z
    .enum([
      'product_collection',
      'product_collection_update',
      'product_category',
      'product',
      'product_import',
      'seller',
      'review_remove',
      'product_type',
      'product_tag',
      'product_update'
    ])
    .optional(),
  status: z.enum(['accepted', 'rejected', 'pending']).optional()
})

/**
 * @schema AdminReviewRequest
 * title: "Update Request"
 * description: "A schema for the admin review of request."
 * x-resourceId: AdminReviewRequest
 * type: object
 * properties:
 *   reviewer_note:
 *     type: string
 *     description: Reviewer note.
 *   status:
 *     type: string
 *     enum: [accepted,rejected]
 *     description: A status of the request
 */
export type AdminReviewRequestType = z.infer<typeof AdminReviewRequest>
export const AdminReviewRequest = z.object({
  status: z.enum(['accepted', 'rejected']),
  reviewer_note: z.string()
})
