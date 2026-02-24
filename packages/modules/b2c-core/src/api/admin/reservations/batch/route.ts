import { MedusaRequest, MedusaResponse } from '@medusajs/framework';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';

import { batchReservationsWorkflow } from '../../../../workflows/reservations';
import { AdminBatchReservationsBodyType } from '../validators';

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
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { result } = await batchReservationsWorkflow(req.scope).run({
    input: req.validatedBody
  });

  const { createdIds, updatedIds, deletedIds } = result;

  const fetchByIds = async (ids: string[]) => {
    if (!ids.length) {
      return [];
    }

    const { data } = await query.graph({
      entity: 'reservation',
      fields: req.queryConfig.fields,
      filters: {
        id: ids
      }
    });

    const byId = new Map(
      data.map((reservation) => [reservation.id, reservation])
    );
    return ids.map((id) => byId.get(id)).filter(Boolean);
  };

  const [created, updated] = await Promise.all([
    fetchByIds(createdIds),
    fetchByIds(updatedIds)
  ]);

  res.status(201).json({
    created,
    updated,
    deleted: deletedIds
  });
};
