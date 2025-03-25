import { defineLink } from '@medusajs/framework/utils'
import CustomerModule from '@medusajs/medusa/customer'

import SellerModule from '../modules/seller'

export default defineLink(
  SellerModule.linkable.seller,
  CustomerModule.linkable.customerGroup
)
