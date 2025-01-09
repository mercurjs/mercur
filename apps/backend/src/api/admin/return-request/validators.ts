import { z } from 'zod'

import { createSelectParams } from '@medusajs/medusa/api/utils/validators'

export type AdminGetOrderReturnRequestParamsType = z.infer<
  typeof AdminGetOrderReturnRequestParams
>
export const AdminGetOrderReturnRequestParams = createSelectParams()

export type AdminUpdateOrderReturnRequestType = z.infer<
  typeof AdminUpdateOrderReturnRequest
>
export const AdminUpdateOrderReturnRequest = z
  .object({
    admin_reviewer_note: z.string(),
    status: z.enum(['refunded', 'canceled'])
  })
  .strict()
