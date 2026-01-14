import { applyAndAndOrOperators } from "@medusajs/medusa/api/utils/common-validators/common";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { z } from "zod";

const stringToBoolean = z.preprocess((val) => {
  if (val === "true") return true;
  if (val === "false") return false;
  return undefined;
}, z.boolean().optional());

const GetProductVariantsParamsFields = z.object({
  q: z.string().optional(),
  seller_id: z.string().optional(),
  has_price: stringToBoolean,
  has_inventory: stringToBoolean,
});

export type AdminGetProductVariantsParamsType = z.infer<
  typeof AdminGetProductVariantsParams
>;

export const AdminGetProductVariantsParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(GetProductVariantsParamsFields)
  .merge(applyAndAndOrOperators(GetProductVariantsParamsFields));
