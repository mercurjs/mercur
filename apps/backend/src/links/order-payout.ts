import { defineLink } from '@medusajs/framework/utils'
import OrderModule from '@medusajs/medusa/order'

import PayoutModule from '@mercurjs/payout'

export default defineLink(
  OrderModule.linkable.order,
  {
    linkable: PayoutModule.linkable.payout,
    isList: true
  },
  { database: { table: 'order_payout' } }
)
