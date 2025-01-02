import { defineLink } from '@medusajs/framework/utils'

import RequestsModule from '../modules/requests'
import SellerModule from '../modules/seller'

export default defineLink(
  SellerModule.linkable.seller,
  RequestsModule.linkable.request
)
