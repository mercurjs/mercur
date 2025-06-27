import { model } from '@medusajs/framework/utils'

import { OrderReturnRequestLineItem } from './return-request-line-item'

export const OrderReturnRequest = model.define('order_return_request', {
  id: model.id({ prefix: 'oretreq' }).primaryKey(),
  customer_id: model.text(),
  customer_note: model.text(),
  shipping_option_id: model.text().nullable(),
  vendor_reviewer_id: model.text().nullable(),
  vendor_reviewer_note: model.text().nullable(),
  vendor_review_date: model.dateTime().nullable(),
  admin_reviewer_id: model.text().nullable(),
  admin_reviewer_note: model.text().nullable(),
  admin_review_date: model.dateTime().nullable(),
  line_items: model.hasMany(() => OrderReturnRequestLineItem, {
    mappedBy: 'return_request'
  }),
  status: model
    .enum(['pending', 'refunded', 'withdrawn', 'escalated', 'canceled'])
    .default('pending')
})
