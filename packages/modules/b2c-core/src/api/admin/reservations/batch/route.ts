import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createReservationsWorkflow } from '@medusajs/medusa/core-flows'

import { AdminCreateReservationsBodyType } from '../validators'

/**
 * @oas [post] /admin/reservations/batch
 * operationId: "AdminBatchCreateReservations"
 * summary: "Create reservations in bulk"
 * description: "Creates multiple reservations in a single request."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/AdminCreateReservations"
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             reservations:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Reservation"
 *             count:
 *               type: integer
 * tags:
 *   - Admin Reservations
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: MedusaRequest<AdminCreateReservationsBodyType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await createReservationsWorkflow.run({
    container: req.scope,
    input: { reservations: req.validatedBody.reservations }
  })

  const reservationIds = result.map((reservation) => reservation.id)
  const { data: created } = await query.graph({
    entity: 'reservation',
    fields: req.queryConfig.fields,
    filters: {
      id: reservationIds
    }
  })

  const reservationById = new Map(
    created.map((reservation) => [reservation.id, reservation])
  )
  const ordered = reservationIds
    .map((id) => reservationById.get(id))
    .filter(Boolean)

  res.status(201).json({
    reservations: ordered,
    count: ordered.length
  })
}
