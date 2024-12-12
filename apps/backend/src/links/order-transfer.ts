import PayoutsModule from '#/modules/payouts'

import { defineLink } from '@medusajs/framework/utils'
import OrderModule from '@medusajs/medusa/order'

export default defineLink(OrderModule.linkable.order, {
  linkable: PayoutsModule.linkable.transfer,
  isList: true
})
