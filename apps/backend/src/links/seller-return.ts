import { defineLink } from '@medusajs/framework/utils'
import OrderModule from '@medusajs/medusa/order'

import SellerModule from '../modules/seller'

export default defineLink(
  SellerModule.linkable.seller,
  OrderModule.linkable.return
)
