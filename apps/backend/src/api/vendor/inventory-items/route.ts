import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerInventoryItemLink from '../../../links/seller-inventory-item'
import { VendorGetProductParamsType } from '../products/validators'

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
    entity: sellerInventoryItemLink.entryPoint,
    fields: req.remoteQueryConfig.fields.map(
      (field) => `inventory_item.${field}`
    ),
    filters: req.filterableFields,
    pagination: req.remoteQueryConfig.pagination
  })

  res.json({
    inventory_items: inventory_items.map((relation) => relation.inventory_item),
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}
