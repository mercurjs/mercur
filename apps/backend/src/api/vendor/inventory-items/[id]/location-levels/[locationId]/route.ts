import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { updateInventoryLevelsWorkflow } from '@medusajs/medusa/core-flows'

import { VendorUpdateInventoryLevel } from '../../../validators'

/**
 * @oas [post] /vendor/inventory-items/{id}/location-levels/{locationId}
 * operationId: "VendorUpdateInventoryLevel"
 * summary: "Update inventory level"
 * description: "Updates inventory level of the InventoryItem in the specified location"
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the InventoryItem.
 *     schema:
 *       type: string
 *   - in: path
 *     name: locationId
 *     required: true
 *     description: The ID of the Stock Location.
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorUpdateInventoryLevel"
 * responses:
 *   "202":
 *     description: Accepted
 * tags:
 *   - Product
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateInventoryLevel>,
  res: MedusaResponse
) => {
  await updateInventoryLevelsWorkflow.run({
    input: {
      updates: [
        {
          location_id: req.params.locationId,
          inventory_item_id: req.params.id,
          ...req.validatedBody
        }
      ]
    },
    container: req.scope
  })

  res.status(202).end()
}

/**
 * @oas [get] /vendor/inventory-items/{id}/location-levels/{locationId}
 * operationId: "VendorGetInventoryLevel"
 * summary: "Get inventory level"
 * description: "Retrieves inventory level of the InventoryItem in the specified location"
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the InventoryItem.
 *     schema:
 *       type: string
 *   - in: path
 *     name: locationId
 *     required: true
 *     description: The ID of the Stock Location.
 *     schema:
 *       type: string
 * responses:
 *   "200":
 *     description: Inventory level
 * tags:
 *   - Product
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [location_level]
  } = await query.graph({
    entity: 'inventory_level',
    fields: req.remoteQueryConfig.fields,
    filters: {
      inventory_item_id: req.params.id,
      location_id: req.params.locationId
    }
  })

  res.json({
    location_level
  })
}
