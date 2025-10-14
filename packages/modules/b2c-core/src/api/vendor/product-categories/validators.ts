import { z } from 'zod'

import { AdminProductCategoriesParams } from '@medusajs/medusa/api/admin/product-categories/validators'
import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetProductCategoriesParamsType = z.infer<
  typeof VendorGetProductCategoriesParams
>
export const VendorGetProductCategoriesParams = AdminProductCategoriesParams

export type VendorGetProductCategoriesProductsParamsType = z.infer<
  typeof VendorGetProductCategoriesProductsParams
>
export const VendorGetProductCategoriesProductsParams = createFindParams({
  offset: 0,
  limit: 10
})
