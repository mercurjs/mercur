import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

import { VendorGetProductCategoriesProductsParams } from '../product-categories/validators'

export type VendorGetProductCollectionsParamsType = z.infer<
  typeof VendorGetProductCollectionsParams
>
export const VendorGetProductCollectionsParams = createFindParams({
  limit: 20,
  offset: 0
})

export type VendorGetProductCollectionsProductsParamsType = z.infer<
  typeof VendorGetProductCategoriesProductsParams
>
export const VendorGetProductCollectionsProductsParams = createFindParams({
  offset: 0,
  limit: 10
})
