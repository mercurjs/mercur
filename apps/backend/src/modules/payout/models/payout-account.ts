import { model } from '@medusajs/framework/utils'

import { PayoutAccountStatus } from '../types'

export const PayoutAccount = model.define('payout_account', {
  id: model.id({ prefix: 'pa' }).primaryKey(),
  status: model.enum(PayoutAccountStatus).default(PayoutAccountStatus.PENDING),
  reference_id: model.text().nullable(),
  data: model.json().nullable()
})
