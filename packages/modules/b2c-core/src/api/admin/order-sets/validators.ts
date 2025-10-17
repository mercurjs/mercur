import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type AdminOrderSetParamsType = z.infer<typeof AdminOrderSetParams>
export const AdminOrderSetParams = createFindParams({
  offset: 0,
  limit: 50
}).merge(
  z.object({
    order_id: z.string().optional()
  })
)
