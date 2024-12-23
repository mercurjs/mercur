import * as z from 'zod'

import {
  createFindParams,
  createOperatorMap
} from '@medusajs/medusa/api/utils/validators'

export type VendorGetOrderParamsType = z.infer<typeof VendorGetOrderParams>
export const VendorGetOrderParams = createFindParams({
  offset: 0,
  limit: 50
}).merge(
  z.object({
    created_at: createOperatorMap().optional(),
    status: z
      .union([z.string(), z.array(z.string()), createOperatorMap()])
      .optional(),
    fulfillment_status: z.string().optional(),
    payment_status: z.string().optional(),
    q: z.string().optional()
  })
)

/**
 * @schema VendorCreateFulfillment
 * type: object
 * properties:
 *   requires_shipping:
 *     type: boolean
 *     description: The number of items to return. Default 50.
 *   location_id:
 *     type: string
 *     description: The number of items to skip before starting the response. Default 0.
 *   items:
 *     type: array
 *     description: Sales channels to associate the product with.
 *     items:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         quantity:
 *           type: number
 */
export type VendorCreateFulfillmentType = z.infer<
  typeof VendorCreateFulfillment
>
export const VendorCreateFulfillment = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number().int().min(0)
    })
  ),
  requires_shipping: z.boolean(),
  location_id: z.string()
})
