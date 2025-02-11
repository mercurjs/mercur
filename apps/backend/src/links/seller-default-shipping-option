import { defineLink } from '@medusajs/framework/utils'

import DefaultShippingOptionModule from '../modules/default-shipping-options'
import SellerModule from '../modules/seller'

export default defineLink(SellerModule.linkable.seller, {
  linkable: DefaultShippingOptionModule.linkable.defaultSellerShippingOption,
  isList: true
})
