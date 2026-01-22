import { z } from "zod"
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

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
    include_ancestors_tree: z.boolean().optional(),
    include_descendants_tree: z.boolean().optional(),
    is_active: z.boolean().optional(),
    is_internal: z.boolean().optional(),
  })
)

export type VendorGetProductCategoryProductsParamsType = z.infer<
  typeof VendorGetProductCategoryProductsParams
>
export const VendorGetProductCategoryProductsParams = createFindParams({
  offset: 0,
  limit: 10,
})

export type VendorBatchProductsToCategoryType = z.infer<
  typeof VendorBatchProductsToCategory
>
export const VendorBatchProductsToCategory = z.object({
  add: z.array(z.string()).optional(),
  remove: z.array(z.string()).optional(),
})
