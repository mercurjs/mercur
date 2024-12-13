import * as z from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

/**
 * @schema VendorGetOrderParams
 * type: object
 * properties:
 *   limit:
 *     type: number
 *     description: The number of items to return. Default 50.
 *   offset:
 *     type: number
 *     description: The number of items to skip before starting the response. Default 0.
 *   fields:
 *     type: string
 *     description: Comma-separated fields that should be included in the returned data.
 *   expand:
 *     type: string
 *     description: Comma-separated relations that should be expanded in the returned data.
 *   order:
 *     type: string
 *     description: Field used to order the results.
 */
export type VendorGetOrderParamsType = z.infer<typeof VendorGetOrderParams>
export const VendorGetOrderParams = createFindParams({
  offset: 0,
  limit: 50
})

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
