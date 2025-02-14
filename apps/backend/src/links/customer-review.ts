import { defineLink } from '@medusajs/framework/utils'
import CustomerModule from '@medusajs/medusa/customer'

import ReviewModule from '../modules/reviews'

export default defineLink(
  CustomerModule.linkable.customer,
  ReviewModule.linkable.review
)
