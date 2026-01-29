import { model } from '@medusajs/framework/utils'

import { PayoutAccount } from './payout-account'
import { PayoutReversal } from './payout-reversal'
import { PayoutStatus } from '@mercurjs/types'

export const Payout = model.define('payout', {
  id: model.id({ prefix: 'pout' }).primaryKey(),
  currency_code: model.text(),
  amount: model.bigNumber(),
  data: model.json().nullable(),
  account: model.belongsTo(() => PayoutAccount, {
    mappedBy: 'payouts'
  }),
  reversals: model.hasMany(() => PayoutReversal),
  status: model.enum(PayoutStatus).default(PayoutStatus.PENDING)
})
