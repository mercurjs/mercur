import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createReservationsWorkflow } from '@medusajs/medusa/core-flows'

import sellerInventoryItem from '../../../links/seller-inventory-item'
import {
  VendorCreateReservationType,
  VendorGetReservationParamsType
} from './validators'

/**
 * @oas [get] /vendor/reservations
 * operationId: "VendorListReservations"
 * summary: "List Reservations"
 * description: "Retrieves a list of reservations for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - name: offset
 *     in: query
 *     schema:
 *       type: number
 *     required: false
 *     description: The number of items to skip before starting to collect the result set.
 *   - name: limit
 *     in: query
 *     schema:
 *       type: number
 *     required: false
 *     description: The number of items to return.
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
 *             reservations:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorReservation"
 *             count:
 *               type: integer
 *               description: The total number of items available
 *             offset:
 *               type: integer
 *               description: The number of items skipped before these items
 *             limit:
 *               type: integer
 *               description: The number of items per page
 * tags:
 *   - Vendor Reservations
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetReservationParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: inventory_items } = await query.graph({
    entity: sellerInventoryItem.entryPoint,
    fields: ['inventory_item_id'],
    filters: req.filterableFields
  })

  const { data: reservations, metadata } = await query.graph({
    entity: 'reservation',
    fields: req.queryConfig.fields,
    filters: {
      inventory_item_id: inventory_items.map((item) => item.inventory_item_id)
    },
    pagination: req.queryConfig.pagination
  })

  res.json({
    reservations,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}

/**
 * @oas [post] /vendor/reservations
 * operationId: "VendorCreateReservation"
 * summary: "Create reservation"
 * description: "Creates new reservation"
 * x-authenticated: true
 * parameters:
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
 *         $ref: "#/components/schemas/VendorCreateReservation"
 * responses:
 *   "201":
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
  req: AuthenticatedMedusaRequest<VendorCreateReservationType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await createReservationsWorkflow.run({
    container: req.scope,
    input: { reservations: [req.validatedBody] }
  })

  const {
    data: [reservation]
  } = await query.graph({
    entity: 'reservation',
    fields: req.queryConfig.fields,
    filters: {
      id: result[0].id
    }
  })

  res.status(201).json({ reservation })
}
