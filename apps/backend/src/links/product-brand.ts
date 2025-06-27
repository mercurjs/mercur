import { defineLink } from '@medusajs/framework/utils'
import ProductModule from '@medusajs/medusa/product'

import BrandModule from '@mercurjs/brand'

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true
  },
  BrandModule.linkable.brand
)
