import { defineLink } from '@medusajs/framework/utils'

import orderReturnRequest from '../modules/order-return-request'
import SellerModule from '../modules/seller'

export default defineLink(SellerModule.linkable.seller, {
  linkable: orderReturnRequest.linkable.orderReturnRequest,
  isList: true
})
