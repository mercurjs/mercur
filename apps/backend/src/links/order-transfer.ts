import PayoutModule from '#/modules/payout'

import { defineLink } from '@medusajs/framework/utils'
import OrderModule from '@medusajs/medusa/order'

export default defineLink(OrderModule.linkable.order, {
  linkable: PayoutModule.linkable.transfer,
  isList: true
})
