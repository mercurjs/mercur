import { z } from "zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

export type VendorGetReviewsParamsType = z.infer<typeof VendorGetReviewsParams>;
export const VendorGetReviewsParams = createFindParams({
  offset: 0,
  limit: 50,
});

export type VendorUpdateReviewType = z.infer<typeof VendorUpdateReview>;
export const VendorUpdateReview = z.object({
  seller_note: z.string().max(300),
});
