import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
  WithAdditionalData,
} from "@medusajs/medusa/api/utils/validators"
import {
  applyAndAndOrOperators,
  booleanString,
} from "@medusajs/medusa/api/utils/common-validators/common"
import { AdditionalData } from "@medusajs/framework/types"

export type AdminProductCategoryParamsType = z.infer<
  typeof AdminProductCategoryParams
>
export const AdminProductCategoryParams = createSelectParams().merge(
  z.object({
    include_ancestors_tree: booleanString().optional(),
    include_descendants_tree: booleanString().optional(),
  })
)

const AdminProductCategoriesParamsFields = z.object({
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

export type AdminProductCategoriesParamsType = z.infer<
  typeof AdminProductCategoriesParams
>
export const AdminProductCategoriesParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(AdminProductCategoriesParamsFields)
  .merge(applyAndAndOrOperators(AdminProductCategoriesParamsFields))

export type AdminCreateProductCategoryType = z.infer<
  typeof CreateProductCategory
> &
  AdditionalData
const CreateProductCategory = z.object({
  name: z.string(),
  description: z.string().optional(),
  handle: z.string().optional(),
  is_internal: z.boolean().optional(),
  is_active: z.boolean().optional(),
  is_restricted: z.boolean().optional(),
  parent_category_id: z.string().nullish(),
  attribute_ids: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).nullish(),
  rank: z.number().nonnegative().optional(),
})
export const AdminCreateProductCategory = WithAdditionalData(
  CreateProductCategory
)

export type AdminUpdateProductCategoryType = z.infer<
  typeof UpdateProductCategory
> &
  AdditionalData
const UpdateProductCategory = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  handle: z.string().optional(),
  is_internal: z.boolean().optional(),
  is_active: z.boolean().optional(),
  is_restricted: z.boolean().optional(),
  parent_category_id: z.string().nullish(),
  attribute_ids: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).nullish(),
  rank: z.number().nonnegative().optional(),
})
export const AdminUpdateProductCategory = WithAdditionalData(
  UpdateProductCategory
)

export type AdminBatchLinkProductsToCategoryType = z.infer<
  typeof AdminBatchLinkProductsToCategory
>
export const AdminBatchLinkProductsToCategory = z.object({
  add: z.array(z.string()).optional(),
  remove: z.array(z.string()).optional(),
})
