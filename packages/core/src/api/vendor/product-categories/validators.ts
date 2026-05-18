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

export type VendorProductCategoryParamsType = z.infer<typeof VendorProductCategoryParams>
export const VendorProductCategoryParams = createSelectParams().merge(
  z.object({
    include_ancestors_tree: booleanString().optional(),
    include_descendants_tree: booleanString().optional(),
  })
)

const VendorProductCategoriesParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  handle: z.union([z.string(), z.array(z.string())]).optional(),
  parent_category_id: z.union([z.string(), z.array(z.string())]).optional(),
  is_active: booleanString().optional(),
  is_internal: booleanString().optional(),
  is_restricted: booleanString().optional(),
  include_ancestors_tree: booleanString().optional(),
  include_descendants_tree: booleanString().optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional(),
})

export type VendorGetProductCategoriesParamsType = z.infer<typeof VendorGetProductCategoriesParams>
export const VendorGetProductCategoriesParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(VendorProductCategoriesParamsFields)
  .merge(applyAndAndOrOperators(VendorProductCategoriesParamsFields))
