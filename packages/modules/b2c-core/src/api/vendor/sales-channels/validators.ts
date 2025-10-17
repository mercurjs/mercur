import { z } from 'zod'

import { createSelectParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetSalesChannelParamsType = z.infer<
  typeof VendorGetSalesChannelParams
>
export const VendorGetSalesChannelParams = createSelectParams()
