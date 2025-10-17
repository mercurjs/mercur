import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetRegionsParamsType = z.infer<typeof VendorGetRegionsParams>
export const VendorGetRegionsParams = createFindParams({
  limit: 50,
  offset: 0
})
