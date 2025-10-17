import { model } from '@medusajs/framework/utils'

export const SplitOrderPayment = model.define('split_order_payment', {
  id: model.id({ prefix: 'sp_ord_pay' }).primaryKey(),
  status: model.text(),
  currency_code: model.text(),
  authorized_amount: model.bigNumber(),
  captured_amount: model.bigNumber().default(0),
  refunded_amount: model.bigNumber().default(0),
  payment_collection_id: model.text()
})
