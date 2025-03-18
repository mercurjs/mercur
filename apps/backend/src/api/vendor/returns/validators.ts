import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetReturnsParamsType = z.infer<typeof VendorGetReturnsParams>
export const VendorGetReturnsParams = createFindParams({
  offset: 0,
  limit: 50
})
