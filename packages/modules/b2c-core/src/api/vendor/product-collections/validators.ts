import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetProductCollectionsParamsType = z.infer<
  typeof VendorGetProductCollectionsParams
>
export const VendorGetProductCollectionsParams = createFindParams({
  limit: 20,
  offset: 0
})
