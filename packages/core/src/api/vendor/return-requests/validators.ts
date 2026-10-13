import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetReturnRequestParamsType = z.infer<
  typeof VendorGetReturnRequestParams
>
export const VendorGetReturnRequestParams = createSelectParams()

export type VendorGetReturnRequestsParamsType = z.infer<
  typeof VendorGetReturnRequestsParams
>
export const VendorGetReturnRequestsParams = createFindParams({
  offset: 0,
  limit: 20,
}).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    order_id: z.union([z.string(), z.array(z.string())]).optional(),
    return_id: z.union([z.string(), z.array(z.string())]).optional(),
    customer_id: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export type VendorCreateReturnRequestType = z.infer<
  typeof VendorCreateReturnRequest
>
export const VendorCreateReturnRequest = z.object({
  order_id: z.string(),
  items: z
    .array(
      z.object({
        id: z.string(),
        quantity: z.number().int().min(1),
        reason_id: z.string().optional(),
        note: z.string().max(1000).optional(),
      })
    )
    .min(1),
  description: z.string().max(1000).optional(),
  attachments: z.array(z.string().url()).max(10).optional(),
})

export type VendorAcceptReturnRequestType = z.infer<
  typeof VendorAcceptReturnRequest
>
export const VendorAcceptReturnRequest = z
  .object({
    return_required: z.boolean(),
    location_id: z.string().optional(),
    shipping_option_id: z.string().optional(),
    custom_amount: z.number().min(0).optional(),
  })
  .refine((data) => !data.return_required || !!data.location_id, {
    message: "location_id is required when return_required is true",
    path: ["location_id"],
  })

export type VendorDeclineReturnRequestType = z.infer<
  typeof VendorDeclineReturnRequest
>
export const VendorDeclineReturnRequest = z.object({
  decline_reason: z.string().min(1).max(1000),
  decline_code: z.string().max(100).optional(),
})
