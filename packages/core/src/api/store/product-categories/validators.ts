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

export type StoreProductCategoryParamsType = z.infer<typeof StoreProductCategoryParams>
export const StoreProductCategoryParams = createSelectParams().merge(
  z.object({
    include_ancestors_tree: booleanString().optional(),
    include_descendants_tree: booleanString().optional(),
  })
)

const StoreProductCategoriesParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  handle: z.union([z.string(), z.array(z.string())]).optional(),
  parent_category_id: z.union([z.string(), z.array(z.string())]).optional(),
  include_ancestors_tree: booleanString().optional(),
  include_descendants_tree: booleanString().optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
})

export type StoreGetProductCategoriesParamsType = z.infer<typeof StoreGetProductCategoriesParams>
export const StoreGetProductCategoriesParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(StoreProductCategoriesParamsFields)
  .merge(applyAndAndOrOperators(StoreProductCategoriesParamsFields))
