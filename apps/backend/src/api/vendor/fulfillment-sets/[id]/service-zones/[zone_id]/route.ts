import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { updateServiceZonesWorkflow } from '@medusajs/medusa/core-flows'

import { IntermediateEvents } from '@mercurjs/framework'

import { fetchSellerByAuthActorId } from '../../../../../../shared/infra/http/utils'
import { deleteVendorServiceZonesWorkflow } from '../../../../../../workflows/fulfillment-set/workflows'
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
 *   - Vendor Fulfillment Sets
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateServiceZoneType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const eventBus = req.scope.resolve(Modules.EVENT_BUS)

  await updateServiceZonesWorkflow.run({
    container: req.scope,
    input: {
      selector: {
        id: req.params.zone_id
      },
      update: req.validatedBody
    }
  })

  await eventBus.emit({
    name: IntermediateEvents.SERVICE_ZONE_CHANGED,
    data: { id: req.params.zone_id }
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
 *   - Vendor Fulfillment Sets
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { zone_id } = req.params

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )
  await deleteVendorServiceZonesWorkflow.run({
    container: req.scope,
    input: {
      ids: [zone_id],
      seller_id: seller.id
    }
  })

  res.json({ id: zone_id, object: 'service_zone', deleted: true })
}
