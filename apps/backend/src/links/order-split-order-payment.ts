import { defineLink } from '@medusajs/framework/utils'
import OrderModule from '@medusajs/medusa/order'

import SplitOrderPaymentModule from '@mercurjs/split-order-payment'

export default defineLink(
  OrderModule.linkable.order,
  SplitOrderPaymentModule.linkable.splitOrderPayment
)
