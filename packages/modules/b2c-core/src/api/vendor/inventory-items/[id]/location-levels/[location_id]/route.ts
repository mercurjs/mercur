import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules, MedusaError } from '@medusajs/framework/utils'
import { updateInventoryLevelsWorkflow, deleteInventoryLevelsWorkflow } from '@medusajs/medusa/core-flows'

import { IntermediateEvents } from '@mercurjs/framework'

import { VendorUpdateInventoryLevelType, VendorInventoryLevelDeleteResponse } from '../../../validators'
import { refetchInventoryItem } from '@medusajs/medusa/api/admin/inventory-items/helpers'

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

/**
 * @oas [delete] /vendor/inventory-items/{id}/location-levels/{location_id}
 * operationId: "VendorDeleteInventoryLevel"
 * summary: "Delete inventory level"
 * description: "Deletes inventory level of the InventoryItem in the specified location"
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

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorInventoryLevelDeleteResponse>
) => {
  const { id, location_id } = req.params

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const result = await query.graph({
    entity: "inventory_level",
    filters: { inventory_item_id: id, location_id },
    fields: ["id", "reserved_quantity"],
  }, { throwIfKeyNotFound: true });

  const { id: levelId, reserved_quantity: reservedQuantity } = result.data[0]

  if (reservedQuantity > 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `Cannot remove Inventory Level ${id} at Location ${location_id} because there are reservations at location`
    )
  }

  const deleteInventoryLevelWorkflow = deleteInventoryLevelsWorkflow(req.scope)

  await deleteInventoryLevelWorkflow.run({
    input: {
      id: [levelId],
    },
  })

  const inventoryItem = await refetchInventoryItem(
    id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({
    id: levelId,
    object: "inventory-level",
    deleted: true,
    parent: inventoryItem,
  })
}


