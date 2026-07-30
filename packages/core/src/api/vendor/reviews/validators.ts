import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export type VendorGetReviewsParamsType = z.infer<typeof VendorGetReviewsParams>
export const VendorGetReviewsParams = createFindParams({
  offset: 0,
  limit: 50,
}).extend({
  q: z.string().optional(),
  customer_id: z.union([z.string(), z.array(z.string())]).optional(),
  status: z
    .union([
      z.enum(["pending", "published", "rejected"]),
      z.array(z.enum(["pending", "published", "rejected"])),
    ])
    .optional(),
  rating: z
    .union([
      z.coerce.number().int().min(1).max(5),
      z.array(z.coerce.number().int().min(1).max(5)),
    ])
    .optional(),
})

export type VendorRespondReviewType = z.infer<typeof VendorRespondReview>
export const VendorRespondReview = z.object({
  seller_note: z.string().min(1).max(300),
  // Accepted but ignored — vendors may not change a review's status or rating.
  status: z.enum(["pending", "published", "rejected"]).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
})
