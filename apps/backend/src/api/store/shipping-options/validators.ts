import { z } from 'zod'

import { applyAndAndOrOperators } from '@medusajs/medusa/api/utils/common-validators/common'
import {
  createFindParams,
  createSelectParams
} from '@medusajs/medusa/api/utils/validators'

export const StoreGetShippingOptionsParams = createSelectParams()

export const StoreGetShippingOptionsFields = z
  .object({
    cart_id: z.string(),
    is_return: z.boolean().optional()
  })
  .strict()

export type StoreGetShippingOptionsType = z.infer<
  typeof StoreGetShippingOptions
>
export const StoreGetShippingOptions = createFindParams({
  limit: 20,
  offset: 0
})
  .merge(StoreGetShippingOptionsFields)
  .merge(applyAndAndOrOperators(StoreGetShippingOptionsFields))
