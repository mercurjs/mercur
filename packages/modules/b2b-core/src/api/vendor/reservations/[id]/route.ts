import {
  deleteReservationsWorkflow,
  updateReservationsWorkflow
} from '@medusajs/core-flows'
import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

import sellerStockLocation from '../../../../links/seller-stock-location'
import { fetchSellerByAuthActorId } from '../../../../shared/infra/http/utils'
import { VendorUpdateReservationType } from '../validators'

/**
 * @oas [get] /vendor/reservations/{id}
 * operationId: "VendorGetReservationById"
 * summary: "Get reservation"
 * description: "Retrieves reservation by id for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the reservation.
 *     schema:
 *       type: string
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             reservation:
 *               $ref: "#/components/schemas/VendorReservation"
 * tags:
 *   - Vendor Reservations
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  const {
    data: [reservation]
  } = await query.graph({
    entity: 'reservation',
    fields: req.queryConfig.fields,
    filters: {
      id
    }
  })

  res.json({ reservation })
}

/**
 * @oas [post] /vendor/reservations/{id}
 * operationId: "VendorUpdateReservationById"
 * summary: "Update reservation"
 * description: "Updates an existing reservation for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Reservation.
 *     schema:
 *       type: string
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorUpdateReservation"
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             reservation:
 *               $ref: "#/components/schemas/VendorReservation"
 * tags:
 *   - Vendor Reservations
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateReservationType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  if (req.validatedBody.location_id) {
    const seller = await fetchSellerByAuthActorId(
      req.auth_context.actor_id,
      req.scope
    )

    const {
      data: [relation]
    } = await query.graph({
      entity: sellerStockLocation.entryPoint,
      fields: ['seller_id'],
      filters: {
        stock_location_id: req.validatedBody.location_id
      }
    })

    if (relation.seller_id !== seller.id) {
      throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        'You can modify stock only in your own locations.'
      )
    }
  }

  await updateReservationsWorkflow.run({
    container: req.scope,
    input: {
      updates: [{ ...req.validatedBody, id }]
    }
  })

  const {
    data: [reservation]
  } = await query.graph({
    entity: 'reservation',
    fields: req.queryConfig.fields,
    filters: {
      id
    }
  })

  res.json({ reservation })
}

/**
 * @oas [delete] /vendor/reservations/{id}
 * operationId: "VendorDeleteReservationById"
 * summary: "Delete reservation"
 * description: "Deletes reservation by id for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the reservation.
 *     schema:
 *       type: string
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: The ID of the deleted reservation
 *             object:
 *               type: string
 *               description: The type of the object that was deleted
 *             deleted:
 *               type: boolean
 *               description: Whether or not the items were deleted
 * tags:
 *   - Vendor Reservations
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await deleteReservationsWorkflow.run({
    container: req.scope,
    input: { ids: [id] }
  })

  res.status(200).json({
    id,
    object: 'reservation',
    deleted: true
  })
}
