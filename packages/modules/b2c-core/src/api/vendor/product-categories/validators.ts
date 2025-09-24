import { z } from 'zod'
import { AdminProductCategoriesParams } from '@medusajs/medusa/api/admin/product-categories/validators'

export type VendorGetProductCategoriesParamsType = z.infer<
  typeof VendorGetProductCategoriesParams
>
export const VendorGetProductCategoriesParams = AdminProductCategoriesParams
