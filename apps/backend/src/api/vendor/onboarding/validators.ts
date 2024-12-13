import { z } from 'zod'

import { createSelectParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetOnboardingParamsType = z.infer<
  typeof VendorGetOnboardingParams
>
export const VendorGetOnboardingParams = createSelectParams()
