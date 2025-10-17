import { z } from 'zod'

import { createSelectParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetStoresParamsType = z.infer<typeof VendorGetStoresParams>

export const VendorGetStoresParams = createSelectParams()
