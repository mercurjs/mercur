import { z } from 'zod'

import { applyAndAndOrOperators } from '@medusajs/medusa/api/utils/common-validators/common'
import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export const VendorGetPricePreferencesParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  attribute: z.union([z.string(), z.array(z.string())]).optional(),
  value: z.union([z.string(), z.array(z.string())]).optional()
})

export const VendorGetPricePreferencesParams = createFindParams({
  offset: 0,
  limit: 300
})
  .merge(VendorGetPricePreferencesParamsFields)
  .merge(applyAndAndOrOperators(VendorGetPricePreferencesParamsFields))
