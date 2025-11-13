import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export const VendorGetProductTypesParamsFields = z.object({
  q: z.string().optional()
})

export type VendorGetProductTypesParamsType = z.infer<
  typeof VendorGetProductTypesParams
>
export const VendorGetProductTypesParams = createFindParams({
  limit: 50,
  offset: 0
})
  .merge(VendorGetProductTypesParamsFields)
  .strict()
