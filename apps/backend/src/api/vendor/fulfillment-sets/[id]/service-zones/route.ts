import { SELLER_MODULE } from 'src/modules/seller'
import { fetchSellerByAuthActorId } from 'src/shared/infra/http/utils'

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { createServiceZonesWorkflow } from '@medusajs/medusa/core-flows'

import { VendorCreateServiceZoneType } from '../../validators'

/**
 * @oas [post] /vendor/fulfillment-sets/{id}/service-zones
 * operationId: "VendorCreateServiceZone"
 * summary: "Create a Service Zone"
 * description: "Creates a Service Zone."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Fulfillment Set.
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorCreateServiceZone"
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
  req: AuthenticatedMedusaRequest<VendorCreateServiceZoneType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const remoteLink = req.scope.resolve(ContainerRegistrationKeys.REMOTE_LINK)

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const {
    result: [serviceZone]
  } = await createServiceZonesWorkflow(req.scope).run({
    input: {
      data: [{ fulfillment_set_id: req.params.id, ...req.validatedBody }]
    }
  })

  await remoteLink.create({
    [SELLER_MODULE]: {
      seller_id: seller.id
    },
    [Modules.FULFILLMENT]: {
      service_zone_id: serviceZone.id
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
