import { defineLink } from '@medusajs/framework/utils'

import SellerModule from '@mercurjs/seller'

import ReviewModule from '../modules/reviews'

export default defineLink(SellerModule.linkable.seller, {
  linkable: ReviewModule.linkable.review,
  isList: true
})
