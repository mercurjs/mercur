import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators"

export const VendorGetExchangesParams = createFindParams({
  limit: 20,
  offset: 0,
}).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    order_id: z.union([z.string(), z.array(z.string())]).optional(),
    return_id: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)
export type VendorGetExchangesParamsType = z.infer<
  typeof VendorGetExchangesParams
>

export const VendorPostOrderExchangesReq = z.object({
  order_id: z.string(),
  description: z.string().optional(),
  internal_note: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})
export type VendorPostOrderExchangesReqType = z.infer<
  typeof VendorPostOrderExchangesReq
>

export const VendorPostCancelExchangeReq = z.object({
  no_notification: z.boolean().optional(),
})
export type VendorPostCancelExchangeReqType = z.infer<
  typeof VendorPostCancelExchangeReq
>

export const VendorPostExchangesReturnRequestItemsReq = z.object({
  location_id: z.string().optional(),
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number(),
      description: z.string().optional(),
      internal_note: z.string().optional(),
      reason_id: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })
  ),
})
export type VendorPostExchangesReturnRequestItemsReqType = z.infer<
  typeof VendorPostExchangesReturnRequestItemsReq
>

export const VendorPostExchangesRequestItemsReturnActionReq = z.object({
  quantity: z.number().optional(),
  internal_note: z.string().nullish().optional(),
  reason_id: z.string().nullish().optional(),
  metadata: z.record(z.string(), z.unknown()).nullish().optional(),
})
export type VendorPostExchangesRequestItemsReturnActionReqType = z.infer<
  typeof VendorPostExchangesRequestItemsReturnActionReq
>

export const VendorPostExchangesAddItemsReq = z.object({
  items: z.array(
    z
      .object({
        variant_id: z.string().optional(),
        offer_id: z.string().optional(),
        quantity: z.number(),
        unit_price: z.number().optional(),
        internal_note: z.string().optional(),
        allow_backorder: z.boolean().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
      .refine(
        (data) => !!data.offer_id || !!data.variant_id,
        "Each item must include either offer_id or variant_id"
      )
  ),
})
export type VendorPostExchangesAddItemsReqType = z.infer<
  typeof VendorPostExchangesAddItemsReq
>

export const VendorPostExchangesItemsActionReq = z.object({
  quantity: z.number().optional(),
  internal_note: z.string().nullish().optional(),
})
export type VendorPostExchangesItemsActionReqType = z.infer<
  typeof VendorPostExchangesItemsActionReq
>

export const VendorPostExchangesShippingReq = z.object({
  shipping_option_id: z.string(),
  custom_amount: z.number().optional(),
  description: z.string().optional(),
  internal_note: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})
export type VendorPostExchangesShippingReqType = z.infer<
  typeof VendorPostExchangesShippingReq
>

export const VendorPostExchangesShippingActionReq = z.object({
  custom_amount: z.number().nullish().optional(),
  internal_note: z.string().nullish().optional(),
  metadata: z.record(z.string(), z.unknown()).nullish().optional(),
})
export type VendorPostExchangesShippingActionReqType = z.infer<
  typeof VendorPostExchangesShippingActionReq
>
