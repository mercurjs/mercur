import { defineLink } from '@medusajs/framework/utils'

import PayoutsModule from '../modules/payouts'
import SellerModule from '../modules/seller'

export default defineLink(
  SellerModule.linkable.seller,
  PayoutsModule.linkable.paymentAccount
)
