import { z } from "zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

export type VendorGetReviewsParamsType = z.infer<typeof VendorGetReviewsParams>;
export const VendorGetReviewsParams = createFindParams({
  offset: 0,
  limit: 50,
});

/**
 * @schema VendorUpdateReview
 * title: "Update Review"
 * description: "A schema for the review update."
 * x-resourceId: VendorUpdateReview
 * type: object
 * properties:
 *   seller_note:
 *     type: string
 *     description: The seller response to a review.
 *     maxLength: 300
 */
export type VendorUpdateReviewType = z.infer<typeof VendorUpdateReview>;
export const VendorUpdateReview = z.object({
  seller_note: z.string().max(300),
});
