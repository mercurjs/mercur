import { z } from "zod"

// Mirrors admin's ClaimCreateSchema with one architectural divergence:
// vendor's `outbound_items` carries `offer_id` (Mercur uses sellers'
// offers to drive replacement shipments, not raw `variant_id`). The
// remaining fields match admin shape-for-shape so the rest of the form
// can stay aligned 1:1.
export const ClaimCreateSchema = z.object({
  inbound_items: z.array(
    z.object({
      item_id: z.string(),
      variant_id: z.string().nullish(),
      quantity: z.number(),
      reason_id: z.string().nullish(),
      note: z.string().nullish(),
    })
  ),
  outbound_items: z.array(
    z.object({
      offer_id: z.string(),
      variant_id: z.string().nullish(),
      product_title: z.string().nullish(),
      variant_title: z.string().nullish(),
      thumbnail: z.string().nullish(),
      sku: z.string().nullish(),
      quantity: z.number(),
    })
  ),
  location_id: z.string().nullish(),
  inbound_option_id: z.string().nullish(),
  outbound_option_id: z.string().nullish(),
  send_notification: z.boolean().optional(),
})

export type CreateClaimSchemaType = z.infer<typeof ClaimCreateSchema>
