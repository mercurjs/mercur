import { model } from '@medusajs/framework/utils'

export const Review = model.define('review', {
  id: model.id({ prefix: 'rev' }).primaryKey(),
  reference: model.enum(['product', 'seller']),
  rating: model.number(),
  customer_note: model.text().nullable(),
  seller_note: model.text().nullable()
})
