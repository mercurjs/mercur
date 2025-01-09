import { z } from 'zod'

import { createSelectParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetOrderReturnRequestParamsType = z.infer<
  typeof VendorGetOrderReturnRequestParams
>
export const VendorGetOrderReturnRequestParams = createSelectParams()

export type VendorUpdateOrderReturnRequestType = z.infer<
  typeof VendorUpdateOrderReturnRequest
>
export const VendorUpdateOrderReturnRequest = z
  .object({
    vendor_reviewer_note: z.string(),
    status: z.enum(['refunded', 'withdrawn', 'escalated'])
  })
  .strict()
