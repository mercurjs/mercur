import { defineLink } from '@medusajs/framework/utils'
import OrderModule from '@medusajs/medusa/order'

import MarketplaceModule from '@mercurjs/marketplace'

export default defineLink(MarketplaceModule.linkable.orderSet, {
  linkable: OrderModule.linkable.order,
  isList: true
})
