import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"
import {
  applyAndAndOrOperators,
  booleanString,
} from "@medusajs/medusa/api/utils/common-validators/common"

export type VendorGetProductBrandParamsType = z.infer<
  typeof VendorGetProductBrandParams
>
export const VendorGetProductBrandParams = createSelectParams()

const VendorProductBrandsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  handle: z.union([z.string(), z.array(z.string())]).optional(),
  is_restricted: booleanString().optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
})

export type VendorGetProductBrandsParamsType = z.infer<
  typeof VendorGetProductBrandsParams
>
export const VendorGetProductBrandsParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(VendorProductBrandsParamsFields)
  .merge(applyAndAndOrOperators(VendorProductBrandsParamsFields))
