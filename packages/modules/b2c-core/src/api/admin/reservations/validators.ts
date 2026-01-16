import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type AdminGetReservationParamsType = z.infer<
  typeof AdminGetReservationParams
>
export const AdminGetReservationParams = createFindParams({
  offset: 0,
  limit: 50
})

/**
 * @schema AdminCreateReservation
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
 *   metadata:
 *     type: object
 *     description: The reservation metadata.
 */
export const AdminCreateReservation = z
  .object({
    line_item_id: z.string().nullish(),
    location_id: z.string(),
    inventory_item_id: z.string(),
    quantity: z.number(),
    description: z.string().nullish(),
    metadata: z.record(z.unknown()).optional()
  })
  .strict()

export type AdminCreateReservationInput = z.infer<typeof AdminCreateReservation>

/**
 * @schema AdminCreateReservations
 * type: object
 * properties:
 *   reservations:
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/AdminCreateReservation"
 */
export const AdminCreateReservations = z
  .object({
    reservations: z.array(AdminCreateReservation).min(1)
  })
  .strict()

export type AdminCreateReservationsBodyType = z.infer<
  typeof AdminCreateReservations
>
