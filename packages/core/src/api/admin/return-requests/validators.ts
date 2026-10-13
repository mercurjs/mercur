import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type AdminGetReturnRequestParamsType = z.infer<
  typeof AdminGetReturnRequestParams
>
export const AdminGetReturnRequestParams = createSelectParams()

export type AdminGetReturnRequestsParamsType = z.infer<
  typeof AdminGetReturnRequestsParams
>
export const AdminGetReturnRequestsParams = createFindParams({
  offset: 0,
  limit: 20,
}).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    order_id: z.union([z.string(), z.array(z.string())]).optional(),
    return_id: z.union([z.string(), z.array(z.string())]).optional(),
    seller_id: z.union([z.string(), z.array(z.string())]).optional(),
    customer_id: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export type AdminCreateReturnRequestType = z.infer<
  typeof AdminCreateReturnRequest
>
export const AdminCreateReturnRequest = z.object({
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
  requested_by_type: z.enum(["customer", "seller"]),
})

export type AdminAcceptReturnRequestType = z.infer<
  typeof AdminAcceptReturnRequest
>
export const AdminAcceptReturnRequest = z
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

export type AdminDeclineReturnRequestType = z.infer<
  typeof AdminDeclineReturnRequest
>
export const AdminDeclineReturnRequest = z.object({
  decline_reason: z.string().min(1).max(1000),
  decline_code: z.string().max(100).optional(),
})

export type AdminApproveReturnRequestType = z.infer<
  typeof AdminApproveReturnRequest
>
export const AdminApproveReturnRequest = z.object({
  refund_amount: z.number().positive().optional(),
  refund_note: z.string().max(1000).optional(),
  refund_shipping: z.boolean().optional(),
})
