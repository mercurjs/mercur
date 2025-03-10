import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetReservationParamsType = z.infer<
  typeof VendorGetReservationParams
>
export const VendorGetReservationParams = createFindParams({
  offset: 0,
  limit: 50
})

/**
 * @schema VendorUpdateReservation
 * type: object
 * properties:
 *   description:
 *     type: string
 *     description: The description of the reservation.
 *   location_id:
 *     type: string
 *     description: The location id of the reservation.
 *   quantity:
 *     type: number
 *     description: The number of items in the reservation.
 */
export type VendorUpdateReservationType = z.infer<
  typeof VendorUpdateReservation
>
export const VendorUpdateReservation = z
  .object({
    location_id: z.string().optional(),
    quantity: z.number().optional(),
    description: z.string().nullish()
  })
  .strict()
