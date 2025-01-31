import { z } from 'zod'

import { createSelectParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetOrderReturnRequestParamsType = z.infer<
  typeof VendorGetOrderReturnRequestParams
>
export const VendorGetOrderReturnRequestParams = createSelectParams()

/**
 * @schema VendorUpdateOrderReturnRequest
 * title: "Update Order Return Request"
 * description: "A schema for the update of order return request."
 * x-resourceId: VendorUpdateOrderReturnRequest
 * type: object
 * properties:
 *   vendor_reviewer_note:
 *     type: string
 *     description: Reviewer note.
 *   status:
 *     type: string
 *     enum:
 *       - refunded
 *       - withdrawn
 *       - escalated
 *     description: A status of the request
 */
export type VendorUpdateOrderReturnRequestType = z.infer<
  typeof VendorUpdateOrderReturnRequest
>
export const VendorUpdateOrderReturnRequest = z
  .object({
    vendor_reviewer_note: z.string(),
    status: z.enum(['refunded', 'withdrawn', 'escalated'])
  })
  .strict()
