import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type AdminGetReviewsParamsType = z.infer<typeof AdminGetReviewsParams>
export const AdminGetReviewsParams = createFindParams({
  offset: 0,
  limit: 50
}).extend({
  reference: z.enum(['product', 'seller']).optional()
})
