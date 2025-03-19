import { z } from 'zod'

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
        quantity: z.number()
      })
    ),
    customer_note: z.string()
  })
  .strict()
