import { z } from "zod"

/**
 * 1:1 ports of the admin validators at
 * `medusa/packages/medusa/src/api/admin/order-edits/validators.ts`.
 * Kept identical so the typed-client route map shares input shapes
 * with `/admin/order-edits`.
 */

export type VendorPostOrderEditsReqType = z.infer<
  typeof VendorPostOrderEditsReq
>
export const VendorPostOrderEditsReq = z.object({
  order_id: z.string(),
  description: z.string().optional(),
  internal_note: z.string().optional(),
  metadata: z.record(z.unknown()).nullish(),
})

export type VendorPostOrderEditsShippingReqType = z.infer<
  typeof VendorPostOrderEditsShippingReq
>
export const VendorPostOrderEditsShippingReq = z.object({
  shipping_option_id: z.string(),
  custom_amount: z.number().optional(),
  description: z.string().optional(),
  internal_note: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type VendorPostOrderEditsShippingActionReqType = z.infer<
  typeof VendorPostOrderEditsShippingActionReq
>
export const VendorPostOrderEditsShippingActionReq = z.object({
  custom_amount: z.number().nullish().optional(),
  internal_note: z.string().nullish().optional(),
  metadata: z.record(z.unknown()).nullish().optional(),
})

export type VendorPostOrderEditsAddItemsReqType = z.infer<
  typeof VendorPostOrderEditsAddItemsReq
>
export const VendorPostOrderEditsAddItemsReq = z.object({
  items: z.array(
    z
      .object({
        variant_id: z.string().optional(),
        offer_id: z.string().optional(),
        quantity: z.number(),
        unit_price: z.number().nullish(),
        compare_at_unit_price: z.number().nullish(),
        internal_note: z.string().nullish(),
        allow_backorder: z.boolean().optional(),
        metadata: z.record(z.unknown()).optional(),
      })
      .refine(
        (data) => !!data.offer_id || !!data.variant_id,
        "Each item must include either offer_id or variant_id"
      )
  ),
})

export type VendorPostOrderEditsItemsActionReqType = z.infer<
  typeof VendorPostOrderEditsItemsActionReq
>
export const VendorPostOrderEditsItemsActionReq = z.object({
  quantity: z.number().optional(),
  unit_price: z.number().nullish(),
  compare_at_unit_price: z.number().nullish(),
  internal_note: z.string().nullish().optional(),
})

export type VendorPostOrderEditsUpdateItemQuantityReqType = z.infer<
  typeof VendorPostOrderEditsUpdateItemQuantityReq
>
export const VendorPostOrderEditsUpdateItemQuantityReq = z.object({
  quantity: z.number(),
  unit_price: z.number().nullish(),
  compare_at_unit_price: z.number().nullish(),
  internal_note: z.string().nullish().optional(),
  metadata: z.record(z.unknown()).nullish(),
})
