import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export const VendorGetCommissionLinesParams = createFindParams({
  limit: 15,
  offset: 0
}).merge(
  z.object({
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional()
  })
)
export type VendorGetCommissionLinesParamsType = z.infer<
  typeof VendorGetCommissionLinesParams
>
