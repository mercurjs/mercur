import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetProductTypesParamsType = z.infer<
  typeof VendorGetProductTypesParams
>
export const VendorGetProductTypesParams = createFindParams({
  limit: 50,
  offset: 0
})
