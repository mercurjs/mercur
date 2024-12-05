import { defineLink } from '@medusajs/framework/utils'
import StockLocationModule from '@medusajs/medusa/stock-location'

import SellerModule from '../modules/seller'

export default defineLink(
  SellerModule.linkable.seller,
  StockLocationModule.linkable.stockLocation
)
