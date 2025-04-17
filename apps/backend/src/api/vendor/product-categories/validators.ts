import { z } from 'zod'

import {
  applyAndAndOrOperators,
  booleanString
} from '@medusajs/medusa/api/utils/common-validators/common'
import {
  createFindParams,
  createOperatorMap
} from '@medusajs/medusa/api/utils/validators'

export const VendorProductCategoriesParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  description: z.union([z.string(), z.array(z.string())]).optional(),
  handle: z.union([z.string(), z.array(z.string())]).optional(),
  parent_category_id: z.union([z.string(), z.array(z.string())]).optional(),
  include_ancestors_tree: booleanString().optional(),
  include_descendants_tree: booleanString().optional(),
  is_internal: booleanString().optional(),
  is_active: booleanString().optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional()
})

export type VendorGetProductCategoriesParamsType = z.infer<
  typeof VendorGetProductCategoriesParams
>
export const VendorGetProductCategoriesParams = createFindParams({
  limit: 50,
  offset: 0
})
  .merge(VendorProductCategoriesParamsFields)
  .merge(applyAndAndOrOperators(VendorProductCategoriesParamsFields))
