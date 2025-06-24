import { defineLink } from '@medusajs/framework/utils'

import SellerModule from '@mercurjs/seller'

import PayoutModule from '../modules/payout'

export default defineLink(
  SellerModule.linkable.seller,
  PayoutModule.linkable.payoutAccount
)
