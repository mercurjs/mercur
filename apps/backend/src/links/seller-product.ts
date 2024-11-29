import { defineLink } from '@medusajs/framework/utils'
import ProductModule from '@medusajs/medusa/product'

import SellerModule from '../modules/seller'

export default defineLink(
  SellerModule.linkable.seller,
  ProductModule.linkable.product
)
