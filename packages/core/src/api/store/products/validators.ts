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

export type StoreGetProductParamsType = z.infer<typeof StoreGetProductParams>
export const StoreGetProductParams = createSelectParams()

const StoreGetProductsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  title: z.string().optional(),
  handle: z.string().optional(),
  brand_id: z.union([z.string(), z.array(z.string())]).optional(),
  collection_id: z.union([z.string(), z.array(z.string())]).optional(),
  type_id: z.union([z.string(), z.array(z.string())]).optional(),
  category_id: z.union([z.string(), z.array(z.string())]).optional(),
  tag_id: z.union([z.string(), z.array(z.string())]).optional(),
  is_giftcard: booleanString().optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
})

export type StoreGetProductsParamsType = z.infer<typeof StoreGetProductsParams>
export const StoreGetProductsParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(StoreGetProductsParamsFields)
  .merge(applyAndAndOrOperators(StoreGetProductsParamsFields))
