import { model } from '@medusajs/framework/utils'

export const OrderSet = model.define('order_set', {
  id: model.id({ prefix: 'ordset' }).primaryKey(),
  display_id: model.number().nullable(),
  cart_id: model.text(),
  customer_id: model.text().nullable()
})
