import { defineLink } from '@medusajs/framework/utils'
import PricingModule from '@medusajs/medusa/pricing'

import SellerModule from '@mercurjs/seller'

export default defineLink(SellerModule.linkable.seller, {
  linkable: PricingModule.linkable.priceList,
  isList: true
})
