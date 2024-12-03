import { z } from 'zod'

import { createSelectParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetStockLocationParamsType = z.infer<
  typeof VendorGetStockLocationParams
>

export const VendorGetStockLocationParams = createSelectParams()
