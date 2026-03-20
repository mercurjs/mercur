import { createFindParams } from '@medusajs/medusa/api/utils/validators'
import { z } from 'zod'

export const StoreGetOrderSetParams = createFindParams({
  offset: 0,
  limit: 50
}).merge(
  z.object({
    order: z.string().optional()
  })
)
