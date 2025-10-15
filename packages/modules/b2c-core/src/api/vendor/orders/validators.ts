import * as z from 'zod'

import {
  createFindParams,
  createOperatorMap,
  createSelectParams
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
    region_id: z.string().optional(),
    sales_channel_id: z.string().optional(),
    q: z.string().optional()
  })
)

export type VendorGetOrderChangesParamsType = z.infer<
  typeof VendorGetOrderChangesParams
>
export const VendorGetOrderChangesParams = createSelectParams()

/**
 * @schema VendorCreateFulfillment
 * type: object
 * properties:
 *   requires_shipping:
 *     type: boolean
 *   location_id:
 *     type: string
 *     description: The location id.
 *   items:
 *     type: array
 *     description: Items to create fulfillment.
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

/**
 * @schema VendorOrderCreateShipment
 * type: object
 * properties:
 *   items:
 *     type: array
 *     description: Items in the shipment.
 *     items:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         quantity:
 *           type: number
 *   labels:
 *     type: array
 *     description: Labels of the shipment
 *     items:
 *       type: object
 *       properties:
 *         tracking_number:
 *           type: string
 *         tracking_url:
 *           type: string
 *         label_url:
 *           type: string
 */
export type VendorOrderCreateShipmentType = z.infer<
  typeof VendorOrderCreateShipment
>
export const VendorOrderCreateShipment = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number()
    })
  ),
  labels: z
    .array(
      z.object({
        tracking_number: z.string(),
        tracking_url: z.string(),
        label_url: z.string()
      })
    )
    .optional()
})
