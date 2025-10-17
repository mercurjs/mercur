import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetFulfillmentProvidersParamsType = z.infer<
  typeof VendorGetFulfillmentProvidersParams
>
export const VendorGetFulfillmentProvidersParams = createFindParams({
  offset: 0,
  limit: 50
})
