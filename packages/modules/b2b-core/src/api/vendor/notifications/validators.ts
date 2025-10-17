import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetNotificationParamsType = z.infer<
  typeof VendorGetNotificationParams
>
export const VendorGetNotificationParams = createFindParams({
  offset: 0,
  limit: 50,
  order: '-created_at'
})
