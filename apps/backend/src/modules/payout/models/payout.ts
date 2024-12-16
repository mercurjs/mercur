import { model } from '@medusajs/framework/utils'

import { PayoutAccount } from './payout-account'

export const Payout = model.define('payout', {
  id: model.id({ prefix: 'pout' }).primaryKey(),
  currency_code: model.text(),
  amount: model.bigNumber(),
  data: model.json().nullable(),
  payout_account: model.belongsTo(() => PayoutAccount, {
    mappedBy: 'payouts'
  })
})
