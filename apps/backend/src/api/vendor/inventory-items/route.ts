import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createInventoryItemsWorkflow } from '@medusajs/medusa/core-flows'

import sellerProductLink from '../../../links/seller-product'
import { VendorGetProductParamsType } from '../products/validators'
import { VendorCreateInventoryItemType } from './validators'

/**
 * @oas [get] /vendor/inventory-items
 * operationId: "VendorListInventoryItem"
 * summary: "List InventoryItems"
 * description: "Retrieves list of InventoryItems"
 * x-authenticated: true
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
  req: AuthenticatedMedusaRequest<VendorGetProductParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: inventory_items, metadata } = await query.graph({
    entity: sellerProductLink.entryPoint,
    fields: req.remoteQueryConfig.fields.map(
      (field) => `product.variants.inventory_items.inventory.${field}`
    ),
    filters: req.filterableFields,
    pagination: req.remoteQueryConfig.pagination
  })

  res.json({
    inventory_items: inventory_items
      .map((product) =>
        product.product.variants.map((variant) =>
          variant.inventory_items.map((item) => item.inventory)
        )
      )
      .flat(2),
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}

/**
 * @oas [post] /vendor/inventory-items
 * operationId: "VendorCreateInventoryItem"
 * summary: "Create InventoryItem"
 * description: "Creates InventoryItem"
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorCreateInventoryItem"
 * responses:
 *   "201":
 *     description: Ok
 * tags:
 *   - Product
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateInventoryItemType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await createInventoryItemsWorkflow(req.scope).run({
    input: { items: [req.validatedBody] }
  })

  const {
    data: [inventory_item]
  } = await query.graph({
    entity: 'inventory_item',
    fields: req.remoteQueryConfig.fields,
    filters: {
      id: result[0].id
    }
  })

  res.status(201).json({
    inventory_item
  })
}
