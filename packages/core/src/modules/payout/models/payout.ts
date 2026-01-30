import { model } from '@medusajs/framework/utils'

import { PayoutAccount } from './payout-account'
import { PayoutStatus } from '@mercurjs/types'

export const Payout = model.define('payout', {
  id: model.id({ prefix: 'pout' }).primaryKey(),
  currency_code: model.text(),
  amount: model.bigNumber(),
  data: model.json().nullable(),
  account: model.belongsTo(() => PayoutAccount, {
    mappedBy: 'payouts'
  }),
  status: model.enum(PayoutStatus).default(PayoutStatus.PENDING)
})
