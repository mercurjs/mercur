import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type StoreGetOrderReturnRequestParamsType = z.infer<
  typeof StoreGetOrderReturnRequestParams
>
export const StoreGetOrderReturnRequestParams = createFindParams({
  offset: 0,
  limit: 50
})

/**
 * @schema StoreCreateOrderReturnRequest
 * title: "Create Order Return Request"
 * description: "A schema for the creation of order return request."
 * x-resourceId: StoreCreateOrderReturnRequest
 * type: object
 * properties:
 *   order_id:
 *     type: string
 *     description: ID of the order
 *   customer_note:
 *     type: string
 *     description: Customer note.
 *   shipping_option_id:
 *     type: string
 *     description: ID of the shipping option
 *   line_items:
 *     type: array
 *     description: Array of items to return
 *     items:
 *       type: object
 *       properties:
 *         line_item_id:
 *           type: string
 *         quantity:
 *           type: number
 *         reason_id:
 *           type: string
 *           description: ID of the reason for return
 */
export type StoreCreateReturnRequestType = z.infer<
  typeof StoreCreateReturnRequest
>
export const StoreCreateReturnRequest = z
  .object({
    order_id: z.string(),
    shipping_option_id: z.string(),
    line_items: z.array(
      z.object({
        line_item_id: z.string(),
        quantity: z.number(),
        reason_id: z.string().optional()
      })
    ),
    customer_note: z.string()
  })
  .strict()
