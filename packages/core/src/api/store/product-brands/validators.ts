import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"
import { applyAndAndOrOperators } from "@medusajs/medusa/api/utils/common-validators/common"

export type StoreGetProductBrandParamsType = z.infer<typeof StoreGetProductBrandParams>
export const StoreGetProductBrandParams = createSelectParams()

const StoreProductBrandsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  handle: z.union([z.string(), z.array(z.string())]).optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
})

export type StoreGetProductBrandsParamsType = z.infer<typeof StoreGetProductBrandsParams>
export const StoreGetProductBrandsParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(StoreProductBrandsParamsFields)
  .merge(applyAndAndOrOperators(StoreProductBrandsParamsFields))
