import { z } from "zod";

import { createFindParams } from "@medusajs/medusa/api/utils/validators";

const dateFilterSchema = z
  .preprocess(
    (val) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }
      return val;
    },
    z
      .object({
        $gte: z.string().optional(),
        $lte: z.string().optional(),
        $gt: z.string().optional(),
        $lt: z.string().optional(),
        $eq: z.string().optional(),
        $ne: z.string().optional(),
      })
      .optional()
  )
  .optional();

export const VendorGetProductTypesParamsFields = z.object({
  q: z.string().optional(),
  created_at: dateFilterSchema,
  updated_at: dateFilterSchema,
});

export type VendorGetProductTypesParamsType = z.infer<
  typeof VendorGetProductTypesParams
>;
export const VendorGetProductTypesParams = createFindParams({
  limit: 50,
  offset: 0,
})
  .merge(VendorGetProductTypesParamsFields)
  .strict();
