import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type StoreGetCustomerMeParamsType = z.infer<
  typeof StoreGetCustomerMeParams
>
export const StoreGetCustomerMeParams = createFindParams()
