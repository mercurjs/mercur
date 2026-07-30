import { z } from "zod"

import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export type AdminGetReviewsParamsType = z.infer<typeof AdminGetReviewsParams>
export const AdminGetReviewsParams = createFindParams({
  offset: 0,
  limit: 50,
}).extend({
  q: z.string().optional(),
  seller_id: z.union([z.string(), z.array(z.string())]).optional(),
  customer_id: z.union([z.string(), z.array(z.string())]).optional(),
  reference: z.enum(["product", "seller"]).optional(),
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

export type AdminUpdateReviewType = z.infer<typeof AdminUpdateReview>
export const AdminUpdateReview = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  customer_note: z.string().max(1000).optional(),
  status: z.enum(["pending", "published", "rejected"]).optional(),
})

export type AdminRespondReviewType = z.infer<typeof AdminRespondReview>
export const AdminRespondReview = z.object({
  seller_note: z.string().min(1).max(300),
})
