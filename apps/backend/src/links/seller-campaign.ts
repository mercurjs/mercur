import { defineLink } from '@medusajs/framework/utils'
import PromotionModule from '@medusajs/medusa/promotion'

import SellerModule from '@mercurjs/seller'

export default defineLink(SellerModule.linkable.seller, {
  linkable: PromotionModule.linkable.campaign,
  isList: true
})
