import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type AdminGetRequestsParamsType = z.infer<typeof AdminGetRequestsParams>
export const AdminGetRequestsParams = createFindParams({
  offset: 0,
  limit: 50
}).extend({
  type: z
    .enum(['product_collection', 'product_category', 'product'])
    .optional(),
  status: z.enum(['accepted', 'rejected', 'pending']).optional()
})

export type AdminReviewRequestType = z.infer<typeof AdminReviewRequest>
export const AdminReviewRequest = z.object({
  status: z.enum(['accepted', 'rejected']),
  reviewer_note: z.string(),
  assign_product_to_seller: z.boolean().default(true)
})
