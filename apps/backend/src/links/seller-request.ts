import { defineLink } from '@medusajs/framework/utils'

import RequestsModule from '@mercurjs/requests'
import SellerModule from '@mercurjs/seller'

export default defineLink(SellerModule.linkable.seller, {
  linkable: RequestsModule.linkable.request,
  isList: true
})
