import { defineLink } from '@medusajs/framework/utils'
import ProductModule from '@medusajs/medusa/product'

import BrandModule from '../modules/brand'

export default defineLink(
  ProductModule.linkable.product,
  BrandModule.linkable.brand
)
