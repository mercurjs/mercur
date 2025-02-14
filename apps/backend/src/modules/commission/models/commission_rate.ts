import { model } from '@medusajs/framework/utils'

import { CommissionRule } from './commission_rule'

export const CommissionRate = model.define('commission_rate', {
  id: model.id({ prefix: 'com_rate' }).primaryKey(),
  type: model.text(),
  percentage_rate: model.number().nullable(),
  include_tax: model.boolean(),
  price_set_id: model.text().nullable(),
  max_price_set_id: model.text().nullable(),
  min_price_set_id: model.text().nullable(),
  rule: model
    .belongsTo(() => CommissionRule, {
      mappedBy: 'rate'
    })
    .nullable()
})
