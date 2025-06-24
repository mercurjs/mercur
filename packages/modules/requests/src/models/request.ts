import { model } from '@medusajs/framework/utils'

export const Request = model.define('request', {
  id: model.id({ prefix: 'req' }).primaryKey(),
  type: model.text(),
  data: model.json(),
  submitter_id: model.text(),
  reviewer_id: model.text().nullable(),
  reviewer_note: model.text().nullable(),
  status: model
    .enum(['draft', 'pending', 'accepted', 'rejected'])
    .default('pending')
})
