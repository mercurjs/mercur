import { defineLink } from '@medusajs/framework/utils'
import OrderModule from '@medusajs/medusa/order'

import orderReturnRequest from '../modules/order-return-request'

export default defineLink(
  {
    linkable: orderReturnRequest.linkable.orderReturnRequest,
    isList: true
  },
  OrderModule.linkable.order
)
