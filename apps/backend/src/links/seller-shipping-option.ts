import { defineLink } from '@medusajs/framework/utils'
import FulfillmentModule from '@medusajs/medusa/fulfillment'

import SellerModule from '@mercurjs/seller'

export default defineLink(SellerModule.linkable.seller, {
  linkable: FulfillmentModule.linkable.shippingOption,
  isList: true
})
