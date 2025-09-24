import { model } from '@medusajs/framework/utils'

import { Payout } from './payout'

export const PayoutReversal = model.define('payout_reversal', {
  id: model.id({ prefix: 'prev' }).primaryKey(),
  currency_code: model.text(),
  amount: model.bigNumber(),
  data: model.json().nullable(),
  payout: model.belongsTo(() => Payout, {
    mappedBy: 'reversals'
  })
})
