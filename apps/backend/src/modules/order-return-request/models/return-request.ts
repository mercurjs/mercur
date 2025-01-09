import { model } from '@medusajs/framework/utils'

export const OrderReturnRequest = model.define('order_return_request', {
  id: model.id({ prefix: 'oretreq' }).primaryKey(),
  customer_id: model.text(),
  customer_note: model.text(),
  line_item_ids: model.array(),
  vendor_reviewer_id: model.text().nullable(),
  vendor_reviewer_note: model.text().nullable(),
  vendor_review_date: model.dateTime().nullable(),
  admin_reviewer_id: model.text().nullable(),
  admin_reviewer_note: model.text().nullable(),
  admin_review_date: model.dateTime().nullable(),
  status: model
    .enum(['pending', 'refunded', 'withdrawn', 'escalated', 'canceled'])
    .default('pending')
})
