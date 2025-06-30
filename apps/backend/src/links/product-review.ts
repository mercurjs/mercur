import { defineLink } from '@medusajs/framework/utils'
import ProductModule from '@medusajs/medusa/product'

import ReviewModule from '@mercurjs/reviews'

export default defineLink(ProductModule.linkable.product, {
  linkable: ReviewModule.linkable.review,
  isList: true
})
