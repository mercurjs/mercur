import { defineLink } from '@medusajs/framework/utils'
import CustomerModule from '@medusajs/medusa/customer'

import ReviewModule from '@mercurjs/reviews'

export default defineLink(CustomerModule.linkable.customer, {
  linkable: ReviewModule.linkable.review,
  isList: true
})
