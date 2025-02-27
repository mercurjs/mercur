import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetCustomersParamsType = z.infer<
  typeof VendorGetCustomersParams
>
export const VendorGetCustomersParams = createFindParams({
  offset: 0,
  limit: 50
})

export type VendorGetCustomerOrdersParamsType = z.infer<
  typeof VendorGetCustomerOrdersParams
>
export const VendorGetCustomerOrdersParams = createFindParams({
  offset: 0,
  limit: 50
})
