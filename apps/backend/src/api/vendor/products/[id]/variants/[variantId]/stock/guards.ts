import { AuthenticatedMedusaRequest } from '@medusajs/framework'

import sellerProductLink from '../../../../../../../links/seller-product'
import sellerStockLocationLink from '../../../../../../../links/seller-stock-location'
import { checkResourceOwnershipByResourceId } from '../../../../../../../shared/infra/http/middlewares'
import { checkChildParentRelation } from '../../../../../../../shared/infra/http/middlewares/check-parent-relation'
import { VendorUpdateInventoryLevel } from '../../../../validators'

export const inventoryItemRelationshipGuardMiddleware = [
  checkChildParentRelation({
    parentResource: 'product',
    childField: 'variant.id',
    childId: (req) => req.params.variantId
  }),
  checkChildParentRelation({
    parentResource: 'variant',
    childField: 'inventory_items.id',
    childId: (req: AuthenticatedMedusaRequest<VendorUpdateInventoryLevel>) =>
      req.body.inventory_item_id,
    parentId: (req) => req.params.variantId
  })
]

export const inventoryItemOwnershipGuardMiddleware = [
  checkResourceOwnershipByResourceId({
    entryPoint: sellerProductLink.entryPoint,
    filterField: 'product_id'
  }),
  checkResourceOwnershipByResourceId({
    entryPoint: sellerStockLocationLink.entryPoint,
    filterField: 'stock_location_id',
    resourceId: (req: AuthenticatedMedusaRequest<VendorUpdateInventoryLevel>) =>
      req.body.location_id
  })
]
