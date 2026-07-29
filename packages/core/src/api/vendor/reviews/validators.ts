import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export type VendorGetReviewsParamsType = z.infer<typeof VendorGetReviewsParams>
export const VendorGetReviewsParams = createFindParams({
  offset: 0,
  limit: 50,
}).extend({
  status: z
    .array(z.enum(["pending", "published", "rejected"]))
    .or(z.enum(["pending", "published", "rejected"]))
    .optional(),
  rating: z
    .array(z.coerce.number().int().min(1).max(5))
    .or(z.coerce.number().int().min(1).max(5))
    .optional(),
  customer_id: z.array(z.string()).or(z.string()).optional(),
})

export type VendorRespondReviewType = z.infer<typeof VendorRespondReview>
export const VendorRespondReview = z.object({
  seller_note: z.string().min(1).max(300),
})

export const REVIEW_REPORT_REASONS = [
  "irrelevant_content",
  "spam",
  "inappropriate_language",
  "bullying_or_harassment",
  "personal_information",
] as const

export type VendorReportReviewType = z.infer<typeof VendorReportReview>
export const VendorReportReview = z.object({
  reason: z.enum(REVIEW_REPORT_REASONS),
})
