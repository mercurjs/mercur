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

/**
 * @schema VendorCreateReservation
 * type: object
 * properties:
 *   description:
 *     type: string
 *     description: The description of the reservation.
 *   location_id:
 *     type: string
 *     description: The location id of the reservation.
 *   inventory_item_id:
 *     type: string
 *     description: The inventory item id of the reservation.
 *   line_item_id:
 *     type: string
 *     description: The line item id of the reservation.
 *   quantity:
 *     type: number
 *     description: The number of items in the reservation.
 */
export type VendorCreateReservationType = z.infer<
  typeof VendorCreateReservation
>
export const VendorCreateReservation = z
  .object({
    line_item_id: z.string().nullish(),
    location_id: z.string(),
    inventory_item_id: z.string(),
    quantity: z.number(),
    description: z.string().nullish()
  })
  .strict()
