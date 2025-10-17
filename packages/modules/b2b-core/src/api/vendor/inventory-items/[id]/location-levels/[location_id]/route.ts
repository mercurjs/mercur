import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { updateInventoryLevelsWorkflow } from '@medusajs/medusa/core-flows'

import { IntermediateEvents } from '@mercurjs/framework'

import { VendorUpdateInventoryLevelType } from '../../../validators'

/**
 * @oas [post] /vendor/inventory-items/{id}/location-levels/{location_id}
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
 *     name: location_id
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
 *   - Vendor Inventory Items
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateInventoryLevelType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  await updateInventoryLevelsWorkflow.run({
    input: {
      updates: [
        {
          location_id: req.params.location_id,
          inventory_item_id: req.params.id,
          ...req.validatedBody
        }
      ]
    },
    container: req.scope
  })

  const eventBus = req.scope.resolve(Modules.EVENT_BUS)
  await eventBus.emit({
    name: IntermediateEvents.INVENTORY_ITEM_CHANGED,
    data: { id: req.params.id }
  })

  const {
    data: [location_level]
  } = await query.graph({
    entity: 'inventory_level',
    fields: req.queryConfig.fields,
    filters: {
      inventory_item_id: req.params.id,
      location_id: req.params.location_id
    }
  })

  res.json({
    location_level
  })
}

/**
 * @oas [get] /vendor/inventory-items/{id}/location-levels/{location_id}
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
 *     name: location_id
 *     required: true
 *     description: The ID of the Stock Location.
 *     schema:
 *       type: string
 * responses:
 *   "200":
 *     description: Inventory level
 * tags:
 *   - Vendor Inventory Items
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
    fields: req.queryConfig.fields,
    filters: {
      inventory_item_id: req.params.id,
      location_id: req.params.location_id
    }
  })

  res.json({
    location_level
  })
}
