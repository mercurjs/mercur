import { model } from '@medusajs/framework/utils'

import { CommissionRate } from './commission_rate'

export const CommissionRule = model.define('commission_rule', {
  id: model.id({ prefix: 'com_rule' }).primaryKey(),
  name: model.text().searchable(),
  reference: model.text().searchable(),
  reference_id: model.text(),
  is_active: model.boolean().default(true),
  rate: model.hasOne(() => CommissionRate, {
    mappedBy: 'rule'
  })
})
