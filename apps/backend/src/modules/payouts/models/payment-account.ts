import { model } from '@medusajs/framework/utils'

import { PaymentAccountStatus } from '../types'

export const PaymentAccount = model.define('payment_account', {
  id: model.id({ prefix: 'pa' }).primaryKey(),
  status: model
    .enum(PaymentAccountStatus)
    .default(PaymentAccountStatus.PENDING),
  reference_id: model.text().nullable(),
  data: model.json().nullable()
})
