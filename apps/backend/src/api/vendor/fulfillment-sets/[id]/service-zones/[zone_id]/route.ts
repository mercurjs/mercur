import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  deleteServiceZonesWorkflow,
  updateServiceZonesWorkflow
} from '@medusajs/medusa/core-flows'

import { VendorUpdateServiceZoneType } from '../../../validators'

/**
 * @oas [post] /vendor/fulfillment-sets/{id}/service-zones/{zone_id}
 * operationId: "VendorUpdateServiceZoneById"
 * summary: "Update a Service Zone"
 * description: "Updates a Service Zone."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Fulfillment Set.
 *     schema:
 *       type: string
 *   - in: path
 *     name: zone_id
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
 *             fulfillment_set:
 *               $ref: "#/components/schemas/VendorFulfillmentSet"
 * tags:
 *   - Fulfillment Set
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateServiceZoneType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await updateServiceZonesWorkflow(req.scope).run({
    input: {
      selector: {
        id: req.params.zone_id
      },
      update: req.validatedBody
    }
  })

  const {
    data: [fulfillmentSet]
  } = await query.graph(
    {
      entity: 'fulfillment_set',
      fields: req.queryConfig.fields,
      filters: {
        id: req.params.id
      }
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ fulfillment_set: fulfillmentSet })
}

/**
 * @oas [delete] /vendor/fulfillment-sets/{id}/service-zones/{zone_id}
 * operationId: "VendorDeleteServiceZoneById"
 * summary: "Delete a Service Zone"
 * description: "Deletes a Service Zone."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Fulfillment Set.
 *     schema:
 *       type: string
 *   - in: path
 *     name: zone_id
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
  const { zone_id } = req.params
  await deleteServiceZonesWorkflow(req.scope).run({
    input: {
      ids: [zone_id]
    }
  })

  res.json({ id: zone_id, object: 'service_zone', deleted: true })
}
