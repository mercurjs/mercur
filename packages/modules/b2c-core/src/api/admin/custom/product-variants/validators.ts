import {
  applyAndAndOrOperators,
  booleanString,
} from "@medusajs/medusa/api/utils/common-validators/common";
import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators";
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
  has_stock_location: stringToBoolean,
  has_admin_stock_location: stringToBoolean,
  id: z.union([z.string(), z.array(z.string())]).optional(),
  manage_inventory: booleanString().optional(),
  allow_backorder: booleanString().optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional(),
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
