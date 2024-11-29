import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  deleteServiceZonesWorkflow,
  updateServiceZonesWorkflow
} from '@medusajs/medusa/core-flows'

import { VendorUpdateServiceZoneType } from '../validators'

/**
 * @oas [get] /vendor/service-zones/{id}
 * operationId: "VendorGetServiceZone"
 * summary: "Get a Service Zone"
 * description: "Retrieves a service zone by its ID."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Service Zone.
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
 *             service_zone:
 *               $ref: "#/components/schemas/VendorServiceZone"
 * tags:
 *   - Service Zone
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [serviceZone]
  } = await query.graph(
    {
      entity: 'service_zone',
      fields: req.remoteQueryConfig.fields,
      filters: { id: req.params.id }
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ service_zone: serviceZone })
}

/**
 * @oas [post] /vendor/service-zones/{id}
 * operationId: "VendorPostServiceZonesServiceZone"
 * summary: "Update a Service Zone"
 * description: "Updates a Service Zone."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Service Zone.
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorUpdateServiceZone"
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             service_zone:
 *               $ref: "#/components/schemas/VendorServiceZone"
 * tags:
 *   - Service Zone
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateServiceZoneType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await updateServiceZonesWorkflow(req.scope).run({
    input: {
      selector: { id: req.params.id },
      update: req.validatedBody
    }
  })

  const {
    data: [serviceZone]
  } = await query.graph(
    {
      entity: 'service_zone',
      fields: req.remoteQueryConfig.fields,
      filters: { id: result[0].id }
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ service_zone: serviceZone })
}

/**
 * @oas [delete] /vendor/service-zones/{id}
 * operationId: "VendorDeleteServiceZonesServiceZone"
 * summary: "Delete a Service Zone"
 * description: "Deletes a Service Zone."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Service Zone.
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
 *               description: The ID of the deleted Service Zone.
 *             object:
 *               type: string
 *               description: The type of the object that was deleted.
 *               default: service_zone
 *             deleted:
 *               type: boolean
 *               description: Whether or not the items were deleted.
 *               default: true
 * tags:
 *   - Service Zone
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  await deleteServiceZonesWorkflow(req.scope).run({
    input: {
      ids: [id]
    }
  })

  res.json({ id, object: 'service_zone', deleted: true })
}
