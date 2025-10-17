import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { createInventoryLevelsWorkflow } from '@medusajs/medusa/core-flows'

import { IntermediateEvents } from '@mercurjs/framework'

import { VendorCreateInventoryLocationLevelType } from '../../validators'

/**
 * @oas [get] /vendor/inventory-items/{id}/location-levels
 * operationId: "VendorGetItemInventoryLevel"
 * summary: "Get InventoryLevels of specified InventoryItem "
 * description: "Retrieves inventory levels of the InventoryItem"
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the InventoryItem.
 *     schema:
 *       type: string
 * responses:
 *   "200":
 *     description: Ok
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

  const { data: location_levels } = await query.graph({
    entity: 'inventory_level',
    fields: req.queryConfig.fields,
    filters: {
      inventory_item_id: req.params.id
    }
  })

  res.json({
    location_levels
  })
}

/**
 * @oas [post] /vendor/inventory-items/{id}/location-levels
 * operationId: "VendorCreateInventoryLevel"
 * summary: "Create inventory level"
 * description: "Creates inventory level of the InventoryItem in the specified location"
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the InventoryItem.
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorCreateInventoryLevel"
 * responses:
 *   "201":
 *     description: Ok
 * tags:
 *   - Vendor Inventory Items
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateInventoryLocationLevelType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  const { result } = await createInventoryLevelsWorkflow(req.scope).run({
    input: {
      inventory_levels: [
        {
          ...req.validatedBody,
          inventory_item_id: id
        }
      ]
    }
  })

  const eventBus = req.scope.resolve(Modules.EVENT_BUS)
  await eventBus.emit({
    name: IntermediateEvents.INVENTORY_ITEM_CHANGED,
    data: { id }
  })

  const {
    data: [location_level]
  } = await query.graph({
    entity: 'inventory_level',
    fields: req.queryConfig.fields,
    filters: {
      inventory_item_id: result[0].id
    }
  })
  res.status(201).json({ location_level })
}
