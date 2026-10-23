import { model } from '@medusajs/framework/utils'

import { PayoutAccount } from './payout-account'
import { Settlement } from './settlement'
import { PayoutStatus } from '@mercurjs/types'

export const Payout = model
  .define('payout', {
    id: model.id({ prefix: 'pout' }).primaryKey(),
    display_id: model.autoincrement(),
    currency_code: model.text(),
    amount: model.bigNumber(),
    data: model.json().nullable(),
    provider_payout_id: model.text().nullable(),
    status_reason: model.text().nullable(),
    account: model.belongsTo(() => PayoutAccount, {
      mappedBy: 'payouts'
    }),
    settlement: model
      .belongsTo(() => Settlement, {
        mappedBy: 'payouts'
      })
      .nullable(),
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
    },
    {
      name: 'IDX_payout_settlement_id',
      on: ['settlement_id'],
      unique: true,
      where: 'deleted_at IS NULL AND settlement_id IS NOT NULL'
    },
    {
      name: 'IDX_payout_provider_payout_id',
      on: ['provider_payout_id'],
      where: 'deleted_at IS NULL AND provider_payout_id IS NOT NULL'
    }
  ])
