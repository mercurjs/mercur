import { z } from "zod"

import {
  applyAndAndOrOperators,
  booleanString,
} from "@medusajs/medusa/api/utils/common-validators/common"
import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators"

export const VendorGetProductVariantsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  manage_inventory: booleanString().optional(),
  allow_backorder: booleanString().optional(),
  sku: z.union([z.string(), z.array(z.string())]).optional(),
  ean: z.union([z.string(), z.array(z.string())]).optional(),
  upc: z.union([z.string(), z.array(z.string())]).optional(),
  barcode: z.union([z.string(), z.array(z.string())]).optional(),
  product_id: z.union([z.string(), z.array(z.string())]).optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional(),
})

export type VendorGetProductVariantsParamsType = z.infer<
  typeof VendorGetProductVariantsParams
>
export const VendorGetProductVariantsParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(VendorGetProductVariantsParamsFields)
  .merge(applyAndAndOrOperators(VendorGetProductVariantsParamsFields))
