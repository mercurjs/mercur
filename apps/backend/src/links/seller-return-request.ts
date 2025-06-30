import { defineLink } from '@medusajs/framework/utils'

import orderReturnRequest from '@mercurjs/order-return-request'
import SellerModule from '@mercurjs/seller'

export default defineLink(SellerModule.linkable.seller, {
  linkable: orderReturnRequest.linkable.orderReturnRequest,
  isList: true
})
