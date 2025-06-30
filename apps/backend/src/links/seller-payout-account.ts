import { defineLink } from '@medusajs/framework/utils'

import PayoutModule from '@mercurjs/payout'
import SellerModule from '@mercurjs/seller'

export default defineLink(
  SellerModule.linkable.seller,
  PayoutModule.linkable.payoutAccount
)
