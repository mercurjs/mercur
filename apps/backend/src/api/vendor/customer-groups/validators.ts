import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetCustomerGroupsParamsType = z.infer<
  typeof VendorGetCustomerGroupsParams
>
export const VendorGetCustomerGroupsParams = createFindParams({
  offset: 0,
  limit: 50
})
