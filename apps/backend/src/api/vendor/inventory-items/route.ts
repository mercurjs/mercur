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

  // First, get the inventory item IDs linked to this seller
  const { data: links } = await query.graph({
    entity: sellerInventoryItemLink.entryPoint,
    fields: ['inventory_item_id'],
    filters: {
      seller_id: req.filterableFields?.seller_id
    }
  })
  // Then query inventory items directly with sorting
  const inventoryItemIds = links.map((link) => link.inventory_item_id)
  
  // Build filters object conditionally
  const filters: any = {
    id: { $in: inventoryItemIds }
  }
  
  // Only add q filter if it exists
  if (req.filterableFields?.q) {
    filters.q = req.filterableFields.q
  }

  const { data: inventory_items, metadata } = await query.graph({
    entity: 'inventory_item',
    fields: req.queryConfig.fields,
    filters,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    inventory_items: inventory_items,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}
