import { z } from "zod";

import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { dateFilterSchema } from "../../../shared/infra/http/utils";

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
