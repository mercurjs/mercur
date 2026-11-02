import { model } from '@medusajs/framework/utils'

import { PayoutAccount } from './payout-account'
import { PayoutReversal } from './payout-reversal'
import { PayoutStatus } from '@mercurjs/types'

export const Payout = model
  .define('payout', {
    id: model.id({ prefix: 'pout' }).primaryKey(),
    display_id: model.autoincrement(),
    order_id: model.text().nullable(),
    currency_code: model.text(),
    amount: model.bigNumber(),
    status: model.enum(PayoutStatus).default(PayoutStatus.PENDING),
    status_reason: model.text().nullable(),
    data: model.json().nullable(),
    metadata: model.json().nullable(),
    account: model.belongsTo(() => PayoutAccount, {
      mappedBy: 'payouts'
    }),
    reversals: model.hasMany(() => PayoutReversal, {
      mappedBy: 'payout'
    })
  })
  .cascades({
    delete: ['reversals']
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
    },
    {
      name: 'IDX_payout_order_id',
      on: ['order_id'],
      unique: true,
      where: 'deleted_at IS NULL AND order_id IS NOT NULL'
    }
  ])
