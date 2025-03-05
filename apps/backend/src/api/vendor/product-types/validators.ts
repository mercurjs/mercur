import { z } from 'zod'

import { createSelectParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetProductTypesParamsType = z.infer<
  typeof VendorGetProductTypesParams
>
export const VendorGetProductTypesParams = createSelectParams()
