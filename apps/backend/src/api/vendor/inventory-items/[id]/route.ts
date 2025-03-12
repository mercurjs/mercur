import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { updateInventoryItemsWorkflow } from '@medusajs/medusa/core-flows'

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
 *   - Product
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
