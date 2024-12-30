import { model } from '@medusajs/framework/utils'

import { ComissionRule } from './comission_rule'

export const ComissionRate = model.define('comission_rate', {
  id: model.id({ prefix: 'com_rate' }).primaryKey(),
  type: model.text(),
  percentage_rate: model.number(),
  is_default: model.boolean(),
  include_tax: model.boolean(),
  include_shipping: model.boolean(),
  price_set_id: model.text(),
  max_price_set_id: model.text(),
  min_price_set_id: model.text(),
  rule: model
    .belongsTo(() => ComissionRule, {
      mappedBy: 'rate'
    })
    .nullable()
})
