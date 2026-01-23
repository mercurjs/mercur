import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetOrderParamsType = z.infer<typeof VendorGetOrderParams>
export const VendorGetOrderParams = createSelectParams()

export type VendorGetOrdersParamsType = z.infer<typeof VendorGetOrdersParams>
export const VendorGetOrdersParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    customer_id: z.union([z.string(), z.array(z.string())]).optional(),
    sales_channel_id: z.union([z.string(), z.array(z.string())]).optional(),
    region_id: z.union([z.string(), z.array(z.string())]).optional(),
    currency_code: z.union([z.string(), z.array(z.string())]).optional(),
    fulfillment_status: z.string().optional(),
    payment_status: z.string().optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export type VendorGetOrderChangesParamsType = z.infer<
  typeof VendorGetOrderChangesParams
>
export const VendorGetOrderChangesParams = createSelectParams()

export type VendorCreateFulfillmentType = z.infer<typeof VendorCreateFulfillment>
export const VendorCreateFulfillment = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number().int().min(0),
    })
  ),
  requires_shipping: z.boolean(),
  location_id: z.string(),
})

export type VendorCreateShipmentType = z.infer<typeof VendorCreateShipment>
export const VendorCreateShipment = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number(),
    })
  ),
  labels: z
    .array(
      z.object({
        tracking_number: z.string(),
        tracking_url: z.string(),
        label_url: z.string(),
      })
    )
    .optional(),
})
