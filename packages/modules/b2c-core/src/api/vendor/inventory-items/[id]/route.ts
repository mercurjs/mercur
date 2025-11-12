import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys, MedusaError, Modules } from '@medusajs/framework/utils'
import { deleteInventoryItemWorkflow, updateInventoryItemsWorkflow } from '@medusajs/medusa/core-flows'

import { IntermediateEvents } from '@mercurjs/framework'

import { VendorUpdateInventoryItemType } from '../validators'

/**
 * @oas [get] /vendor/inventory-items/{id}
 * operationId: "VendorGetInventoryItem"
 * summary: "Get inventory item"
 * description: "Retrieves InventoryItem of specified id"
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

  const {
    data: [inventory_item]
  } = await query.graph({
    entity: 'inventory_item',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({
    inventory_item
  })
}

/**
 * @oas [post] /vendor/inventory-items/{id}
 * operationId: "VendorUpdateInventoryItem"
 * summary: "Update inventory item"
 * description: "Updates InventoryItem of specified id"
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
 *         $ref: "#/components/schemas/VendorUpdateInventoryItem"
 * responses:
 *   "200":
 *     description: Ok
 * tags:
 *   - Vendor Inventory Items
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateInventoryItemType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  await updateInventoryItemsWorkflow(req.scope).run({
    input: {
      updates: [{ id, ...req.validatedBody }]
    }
  })

  const eventBus = req.scope.resolve(Modules.EVENT_BUS)
  await eventBus.emit({
    name: IntermediateEvents.INVENTORY_ITEM_CHANGED,
    data: { id }
  })

  const {
    data: [inventory_item]
  } = await query.graph({
    entity: 'inventory_item',
    fields: req.queryConfig.fields,
    filters: {
      id
    }
  })

  res.json({
    inventory_item
  })
}

/**
 * @oas [delete] /vendor/inventory-items/{id}
 * operationId: "VendorDeleteInventoryItem"
 * summary: "Delete inventory item"
 * description: "Deletes InventoryItem of specified id"
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
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  const {
    data: [inventory_item]
  } = await query.graph({
    entity: 'inventory_item',
    fields: req.queryConfig.fields,
    filters: {
      id
    }
  })

  if (!inventory_item) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Inventory item with id: ${id} was not found`
    )
  }

  await deleteInventoryItemWorkflow(req.scope).run({
    input: [inventory_item.id]
  })

  res.json({
    id,
    object: "inventory_item",
    deleted: true,
    inventory_item
  })
}