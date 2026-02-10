import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetReturnParamsType = z.infer<typeof VendorGetReturnParams>
export const VendorGetReturnParams = createSelectParams()

export type VendorGetReturnsParamsType = z.infer<typeof VendorGetReturnsParams>
export const VendorGetReturnsParams = createFindParams({
  limit: 20,
  offset: 0,
}).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    order_id: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export const VendorGetReturnsOrderParams = createSelectParams().merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)
export type VendorGetReturnsOrderParamsType = z.infer<
  typeof VendorGetReturnsOrderParams
>

export type VendorPostReturnsReqType = z.infer<typeof VendorPostReturnsReq>
export const VendorPostReturnsReq = z.object({
  order_id: z.string(),
  location_id: z.string().optional(),
  description: z.string().optional(),
  internal_note: z.string().optional(),
  no_notification: z.boolean().optional(),
  metadata: z.record(z.unknown()).nullish(),
})

export type VendorPostReturnsReturnReqType = z.infer<
  typeof VendorPostReturnsReturnReq
>
export const VendorPostReturnsReturnReq = z.object({
  location_id: z.string().optional(),
  no_notification: z.boolean().optional(),
  metadata: z.record(z.unknown()).nullish(),
})

export type VendorPostCancelReturnReqType = z.infer<
  typeof VendorPostCancelReturnReq
>
export const VendorPostCancelReturnReq = z.object({
  no_notification: z.boolean().optional(),
})

export type VendorPostReturnsRequestItemsReqType = z.infer<
  typeof VendorPostReturnsRequestItemsReq
>
export const VendorPostReturnsRequestItemsReq = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number(),
      description: z.string().optional(),
      internal_note: z.string().optional(),
      reason_id: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    })
  ),
})

export type VendorPostReturnsRequestItemsActionReqType = z.infer<
  typeof VendorPostReturnsRequestItemsActionReq
>
export const VendorPostReturnsRequestItemsActionReq = z.object({
  quantity: z.number().optional(),
  internal_note: z.string().nullish().optional(),
  reason_id: z.string().nullish().optional(),
  metadata: z.record(z.unknown()).nullish().optional(),
})

export type VendorPostReturnsShippingReqType = z.infer<
  typeof VendorPostReturnsShippingReq
>
export const VendorPostReturnsShippingReq = z.object({
  shipping_option_id: z.string(),
  custom_amount: z.number().optional(),
  description: z.string().optional(),
  internal_note: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type VendorPostReturnsShippingActionReqType = z.infer<
  typeof VendorPostReturnsShippingActionReq
>
export const VendorPostReturnsShippingActionReq = z.object({
  custom_amount: z.number().nullish().optional(),
  internal_note: z.string().nullish().optional(),
  metadata: z.record(z.unknown()).nullish().optional(),
})

export type VendorPostReturnsConfirmRequestReqType = z.infer<
  typeof VendorPostReturnsConfirmRequestReq
>
export const VendorPostReturnsConfirmRequestReq = z.object({
  no_notification: z.boolean().optional(),
})

export type VendorPostReceiveReturnsReqType = z.infer<
  typeof VendorPostReceiveReturnsReq
>
export const VendorPostReceiveReturnsReq = z.object({
  internal_note: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).nullish(),
})

export type VendorPostReturnsReceiveItemsReqType = z.infer<
  typeof VendorPostReturnsReceiveItemsReq
>
export const VendorPostReturnsReceiveItemsReq = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number(),
      description: z.string().optional(),
      internal_note: z.string().optional(),
    })
  ),
})

export type VendorPostReturnsReceiveItemsActionReqType = z.infer<
  typeof VendorPostReturnsReceiveItemsActionReq
>
export const VendorPostReturnsReceiveItemsActionReq = z.object({
  quantity: z.number().optional(),
  internal_note: z.string().nullish().optional(),
})

export type VendorPostReturnsDismissItemsActionReqType = z.infer<
  typeof VendorPostReturnsDismissItemsActionReq
>
export const VendorPostReturnsDismissItemsActionReq = z.object({
  quantity: z.number().optional(),
  internal_note: z.string().nullish().optional(),
})
