import { z } from 'zod'

import { createSelectParams } from '@medusajs/medusa/api/utils/validators'

export type AdminGetOrderReturnRequestParamsType = z.infer<
  typeof AdminGetOrderReturnRequestParams
>
export const AdminGetOrderReturnRequestParams = createSelectParams()

/**
 * @schema AdminUpdateOrderReturnRequest
 * title: "Update Order Return Request"
 * description: "A schema for the update of order return request."
 * x-resourceId: AdminUpdateOrderReturnRequest
 * type: object
 * properties:
 *   admin_reviewer_note:
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
export type AdminUpdateOrderReturnRequestType = z.infer<
  typeof AdminUpdateOrderReturnRequest
>
export const AdminUpdateOrderReturnRequest = z
  .object({
    admin_reviewer_note: z.string(),
    status: z.enum(['refunded', 'canceled'])
  })
  .strict()
