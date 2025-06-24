import { defineLink } from '@medusajs/framework/utils'

import SellerModule from '@mercurjs/seller'

import RequestsModule from '../modules/requests'

export default defineLink(SellerModule.linkable.seller, {
  linkable: RequestsModule.linkable.request,
  isList: true
})
