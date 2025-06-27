import { defineLink } from '@medusajs/framework/utils'

import ReviewModule from '@mercurjs/reviews'
import SellerModule from '@mercurjs/seller'

export default defineLink(SellerModule.linkable.seller, {
  linkable: ReviewModule.linkable.review,
  isList: true
})
