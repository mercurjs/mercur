import {
  createReservationsWorkflow,
  deleteReservationsWorkflow,
  updateReservationsWorkflow
} from '@medusajs/core-flows'
import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { AdminBatchReservationsBodyType } from '../validators'

/**
 * @oas [post] /admin/reservations/batch
 * operationId: "AdminBatchCreateReservations"
 * summary: "Batch create/update/delete reservations"
 * description: "Creates, updates, and deletes reservations in a single request."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           create:
 *             type: array
 *             items:
 *               $ref: "#/components/schemas/AdminCreateReservation"
 *           update:
 *             type: array
 *             items:
 *               allOf:
 *                 - $ref: "#/components/schemas/AdminUpdateReservation"
 *                 - type: object
 *                   properties:
 *                     id:
 *                       type: string
 *           delete:
 *             type: array
 *             items:
 *               type: string
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             created:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Reservation"
 *             updated:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Reservation"
 *             deleted:
 *               type: array
 *               items:
 *                 type: string
 * tags:
 *   - Admin Reservations
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: MedusaRequest<AdminBatchReservationsBodyType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    create = [],
    update = [],
    delete: idsToDelete = []
  } = req.validatedBody

  const createdResults = create.length
    ? await createReservationsWorkflow(req.scope).run({
        input: { reservations: create }
      })
    : { result: [] }

  const updatedResults = update.length
    ? await updateReservationsWorkflow(req.scope).run({
        input: { updates: update }
      })
    : { result: [] }

  if (idsToDelete.length) {
    await deleteReservationsWorkflow(req.scope).run({
      input: { ids: idsToDelete }
    })
  }

  const fetchByIds = async (ids: string[]) => {
    if (!ids.length) {
      return []
    }

    const { data } = await query.graph({
      entity: 'reservation',
      fields: req.queryConfig.fields,
      filters: {
        id: ids
      }
    })

    const byId = new Map(
      data.map((reservation) => [reservation.id, reservation])
    )
    return ids.map((id) => byId.get(id)).filter(Boolean)
  }

  const createdIds = createdResults.result.map((reservation) => reservation.id)
  const updatedIds = updatedResults.result.map((reservation) => reservation.id)

  const [created, updated] = await Promise.all([
    fetchByIds(createdIds),
    fetchByIds(updatedIds)
  ])

  res.status(201).json({
    created,
    updated,
    deleted: idsToDelete
  })
}
