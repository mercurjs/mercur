import { model } from '@medusajs/framework/utils'

import { Payout } from './payout'
import { PayoutStatus } from '@mercurjs/types'

export const PayoutReversal = model
  .define('payout_reversal', {
    id: model.id({ prefix: 'pourev' }).primaryKey(),
    refund_id: model.text().nullable(),
    amount: model.bigNumber(),
    status: model.enum(PayoutStatus).default(PayoutStatus.PENDING),
    status_reason: model.text().nullable(),
    provider_reversal_id: model.text().nullable(),
    data: model.json().nullable(),
    payout: model.belongsTo(() => Payout, {
      mappedBy: 'reversals'
    })
  })
  .indexes([
    {
      name: 'IDX_payout_reversal_payout_id',
      on: ['payout_id'],
      where: 'deleted_at IS NULL'
    },
    {
      name: 'IDX_payout_reversal_refund_id',
      on: ['refund_id'],
      unique: true,
      where: 'deleted_at IS NULL AND refund_id IS NOT NULL'
    },
    {
      name: 'IDX_payout_reversal_status_created_at',
      on: ['status', 'created_at'],
      where: 'deleted_at IS NULL'
    }
  ])
