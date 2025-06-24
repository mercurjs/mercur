import { defineLink } from '@medusajs/framework/utils'
import OrderModule from '@medusajs/medusa/order'

import ReviewModule from '@mercurjs/reviews'

export default defineLink(OrderModule.linkable.order, {
  linkable: ReviewModule.linkable.review,
  isList: true
})
