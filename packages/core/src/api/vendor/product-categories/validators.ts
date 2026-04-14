import { z } from "zod"
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"
import { booleanString } from "@medusajs/medusa/api/utils/common-validators/common"

export type VendorGetProductCategoryParamsType = z.infer<
  typeof VendorGetProductCategoryParams
>
export const VendorGetProductCategoryParams = createSelectParams()

export type VendorGetProductCategoriesParamsType = z.infer<
  typeof VendorGetProductCategoriesParams
>
export const VendorGetProductCategoriesParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    name: z.union([z.string(), z.array(z.string())]).optional(),
    handle: z.union([z.string(), z.array(z.string())]).optional(),
    parent_category_id: z.union([z.string(), z.array(z.string())]).optional(),
    include_ancestors_tree: booleanString().optional(),
    include_descendants_tree: booleanString().optional(),
    is_active: booleanString().optional(),
    is_internal: booleanString().optional(),
  })
)

