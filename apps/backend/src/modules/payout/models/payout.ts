import { model } from '@medusajs/framework/utils'

export const Payout = model.define('payout', {
  id: model.id({ prefix: 'pay' }).primaryKey(),
  account_reference_id: model.text(),
  currency_code: model.text(),
  amount: model.bigNumber(),
  data: model.json().nullable()
})
