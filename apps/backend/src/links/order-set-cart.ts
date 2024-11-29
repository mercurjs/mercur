import { defineLink } from '@medusajs/framework/utils'
import CartModule from '@medusajs/medusa/cart'

import MarketplaceModule from '../modules/marketplace'

export default defineLink(
  MarketplaceModule.linkable.orderSet,
  CartModule.linkable.cart
)
