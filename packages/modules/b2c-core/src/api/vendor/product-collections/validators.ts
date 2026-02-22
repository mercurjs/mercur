import { z } from 'zod'

import { applyAndAndOrOperators } from '@medusajs/medusa/api/utils/common-validators/common'
import {
  createFindParams,
  createSelectParams
} from '@medusajs/medusa/api/utils/validators'

import { dateFilterSchema } from '../../../shared/infra/http/utils'
import { VendorGetProductCategoriesProductsParams } from '../product-categories/validators'

export type VendorGetProductCollectionParamsType = z.infer<
  typeof VendorGetProductCollectionParams
>
export const VendorGetProductCollectionParams = createSelectParams()

export const VendorGetProductCollectionsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  title: z.union([z.string(), z.array(z.string())]).optional(),
  handle: z.union([z.string(), z.array(z.string())]).optional(),
  created_at: dateFilterSchema,
  updated_at: dateFilterSchema,
  deleted_at: dateFilterSchema
})

export type VendorGetProductCollectionsParamsType = z.infer<
  typeof VendorGetProductCollectionsParams
>
export const VendorGetProductCollectionsParams = createFindParams({
  limit: 20,
  offset: 0
})
  .merge(VendorGetProductCollectionsParamsFields)
  .merge(applyAndAndOrOperators(VendorGetProductCollectionsParamsFields))

export type VendorGetProductCollectionsProductsParamsType = z.infer<
  typeof VendorGetProductCategoriesProductsParams
>
export const VendorGetProductCollectionsProductsParams = createFindParams({
  offset: 0,
  limit: 10
})
