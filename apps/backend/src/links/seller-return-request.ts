import { defineLink } from '@medusajs/framework/utils'

import SellerModule from '@mercurjs/seller'

import orderReturnRequest from '../modules/order-return-request'

export default defineLink(SellerModule.linkable.seller, {
  linkable: orderReturnRequest.linkable.orderReturnRequest,
  isList: true
})
