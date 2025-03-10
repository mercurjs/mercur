import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetReservationParamsType = z.infer<
  typeof VendorGetReservationParams
>
export const VendorGetReservationParams = createFindParams({
  offset: 0,
  limit: 50
})
