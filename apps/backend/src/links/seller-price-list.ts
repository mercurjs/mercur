import { defineLink } from '@medusajs/framework/utils'
import PricingModule from '@medusajs/medusa/pricing'

import SellerModule from '../modules/seller'

export default defineLink(
  SellerModule.linkable.seller,
  PricingModule.linkable.priceList
)
