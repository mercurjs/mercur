import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerProductLink from '../../../links/seller-product'
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
