import { model } from '@medusajs/framework/utils'

import { PayoutAccount } from './payout-account'
import { PayoutStatus } from '@mercurjs/types'

export const Payout = model
  .define('payout', {
    id: model.id({ prefix: 'pout' }).primaryKey(),
    display_id: model.autoincrement(),
    currency_code: model.text(),
    amount: model.bigNumber(),
    data: model.json().nullable(),
    account: model.belongsTo(() => PayoutAccount, {
      mappedBy: 'payouts'
    }),
    status: model.enum(PayoutStatus).default(PayoutStatus.PENDING)
  })
  .indexes([
    {
      name: 'IDX_payout_account_id_created_at',
      on: ['account_id', 'created_at'],
      where: 'deleted_at IS NULL'
    },
    {
      name: 'IDX_payout_status_created_at',
      on: ['status', 'created_at'],
      where: 'deleted_at IS NULL'
    }
  ])
