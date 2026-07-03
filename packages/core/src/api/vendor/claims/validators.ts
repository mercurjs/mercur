import { ClaimReason, ClaimType } from "@medusajs/framework/utils"
import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetClaimParamsType = z.infer<typeof VendorGetClaimParams>
export const VendorGetClaimParams = createSelectParams()

export const VendorGetClaimsParams = createFindParams({
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
export type VendorGetClaimsParamsType = z.infer<typeof VendorGetClaimsParams>

export const VendorPostOrderClaimsReq = z.object({
  type: z.nativeEnum(ClaimType),
  order_id: z.string(),
  description: z.string().optional(),
  internal_note: z.string().optional(),
  reason_id: z.string().nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})
export type VendorPostOrderClaimsReqType = z.infer<
  typeof VendorPostOrderClaimsReq
>

export const VendorPostCancelClaimReq = z.object({
  no_notification: z.boolean().optional(),
})
export type VendorPostCancelClaimReqType = z.infer<
  typeof VendorPostCancelClaimReq
>

export const VendorPostClaimItemsReq = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number(),
      reason: z.nativeEnum(ClaimReason).optional(),
      description: z.string().optional(),
      internal_note: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).nullish(),
    })
  ),
})
export type VendorPostClaimItemsReqType = z.infer<typeof VendorPostClaimItemsReq>

export const VendorPostClaimsItemsActionReq = z.object({
  quantity: z.number().optional(),
  reason_id: z.string().nullish(),
  internal_note: z.string().nullish().optional(),
})
export type VendorPostClaimsItemsActionReqType = z.infer<
  typeof VendorPostClaimsItemsActionReq
>

export const VendorPostClaimsRequestReturnItemsReq = z.object({
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
export type VendorPostClaimsRequestReturnItemsReqType = z.infer<
  typeof VendorPostClaimsRequestReturnItemsReq
>

export const VendorPostClaimsRequestItemsReturnActionReq = z.object({
  quantity: z.number().optional(),
  internal_note: z.string().nullish().optional(),
  reason_id: z.string().nullish().optional(),
  metadata: z.record(z.string(), z.unknown()).nullish().optional(),
})
export type VendorPostClaimsRequestItemsReturnActionReqType = z.infer<
  typeof VendorPostClaimsRequestItemsReturnActionReq
>

export const VendorPostClaimsAddItemsReq = z.object({
  items: z.array(
    z
      .object({
        variant_id: z.string().optional(),
        offer_id: z.string().optional(),
        quantity: z.number(),
        unit_price: z.number().optional(),
        internal_note: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
      .refine(
        (data) => !!data.offer_id || !!data.variant_id,
        "Each item must include either offer_id or variant_id"
      )
  ),
})
export type VendorPostClaimsAddItemsReqType = z.infer<
  typeof VendorPostClaimsAddItemsReq
>

export const VendorPostClaimsAddItemsActionReq = z.object({
  quantity: z.number().optional(),
  internal_note: z.string().nullish().optional(),
})
export type VendorPostClaimsAddItemsActionReqType = z.infer<
  typeof VendorPostClaimsAddItemsActionReq
>

export const VendorPostClaimsShippingReq = z.object({
  shipping_option_id: z.string(),
  custom_amount: z.number().optional(),
  description: z.string().optional(),
  internal_note: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})
export type VendorPostClaimsShippingReqType = z.infer<
  typeof VendorPostClaimsShippingReq
>

export const VendorPostClaimsShippingActionReq = z.object({
  custom_amount: z.number().nullish().optional(),
  internal_note: z.string().nullish().optional(),
  metadata: z.record(z.string(), z.unknown()).nullish().optional(),
})
export type VendorPostClaimsShippingActionReqType = z.infer<
  typeof VendorPostClaimsShippingActionReq
>
