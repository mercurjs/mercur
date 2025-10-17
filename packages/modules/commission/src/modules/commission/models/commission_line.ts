import { model } from '@medusajs/framework/utils'

export const CommissionLine = model.define('commission_line', {
  id: model.id({ prefix: 'com_line' }).primaryKey(),
  item_line_id: model.text(),
  rule_id: model.text(),
  currency_code: model.text(),
  value: model.bigNumber()
})
