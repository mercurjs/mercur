import { defineLink } from '@medusajs/framework/utils'
import OrderModule from '@medusajs/medusa/order'

import orderReturnRequest from '../modules/order-return-request'

export default defineLink(
  orderReturnRequest.linkable.orderReturnRequest,
  OrderModule.linkable.order
)
