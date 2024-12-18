import { defineLink } from '@medusajs/framework/utils'
import InventoryModule from '@medusajs/medusa/inventory'

import SellerModule from '../modules/seller'

export default defineLink(
  SellerModule.linkable.seller,
  InventoryModule.linkable.inventoryItem
)
