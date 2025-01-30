import { defineLink } from '@medusajs/framework/utils'
import ProductModule from '@medusajs/medusa/product'

import Taxcode from '../modules/taxcode'

export default defineLink(
  ProductModule.linkable.productCategory,
  Taxcode.linkable.taxCode
)
