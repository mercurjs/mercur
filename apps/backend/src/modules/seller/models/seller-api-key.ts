import { model } from '@medusajs/framework/utils'

export const SellerApiKey = model.define('seller_api_key', {
  id: model.id({ prefix: 'selapi' }).primaryKey(),
  seller_id: model.text(),
  token: model.text(),
  salt: model.text(),
  redacted: model.text().searchable(),
  title: model.text().searchable(),
  created_by: model.text(),
  revoked_by: model.text().nullable(),
  revoked_at: model.dateTime().nullable()
})
