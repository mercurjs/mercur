import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse
} from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { createServiceZonesWorkflow } from '@medusajs/medusa/core-flows'

import sellerServiceZoneLink from '../../../links/seller-service-zone'
import { SELLER_MODULE } from '../../../modules/seller'
import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'
import {
  remapSellerServiceZoneQuery,
  remapServiceZoneFieldsToSellerServiceZone
} from './helpers'
import {
  VendorCreateServiceZoneType,
  VendorGetServiceZoneParamsType
} from './validators'

/**
 * @oas [get] /vendor/service-zones
 * operationId: "VendorListServiceZones"
 * summary: "List Service Zones"
 * description: "Retrieves a list of service zones for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: query
 *     name: fields
 *     description: The comma-separated fields to include in the response
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
 *             service_zones:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/AdminServiceZone"
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
 *   - Service Zone
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: MedusaRequest<VendorGetServiceZoneParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: serviceZones, metadata } = await query.graph({
    entity: sellerServiceZoneLink.entryPoint,
    fields: remapServiceZoneFieldsToSellerServiceZone(
      req.remoteQueryConfig.fields
    ),
    filters: req.filterableFields,
    pagination: req.remoteQueryConfig.pagination
  })

  res.json({
    service_zones: remapSellerServiceZoneQuery(serviceZones),
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}

/**
 * @oas [post] /vendor/service-zones
 * operationId: "VendorCreateServiceZone"
 * summary: "Create a Service Zone"
 * description: "Creates a new service zone for the authenticated vendor."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorCreateServiceZone"
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             service_zone:
 *               $ref: "#/components/schemas/AdminServiceZone"
 * tags:
 *   - Service Zone
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
    req.auth_context?.actor_id,
    req.scope
  )

  const { result } = await createServiceZonesWorkflow(req.scope).run({
    input: { data: [req.validatedBody] }
  })

  // TODO: Move this into a workflow hook
  // Currently createServiceZonesWorkflow does not support hooks
  await remoteLink.create({
    [SELLER_MODULE]: {
      seller_id: seller.id
    },
    [Modules.FULFILLMENT]: {
      service_zone_id: result[0].id
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

  res.status(201).json({ service_zone: serviceZone })
}
