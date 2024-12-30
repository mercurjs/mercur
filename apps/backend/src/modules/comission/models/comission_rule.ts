import { model } from '@medusajs/framework/utils'

import { ComissionRate } from './comission_rate'

export const ComissionRule = model.define('comission_rule', {
  id: model.id({ prefix: 'com_rule' }).primaryKey(),
  name: model.text().searchable(),
  reference: model.text().searchable(),
  reference_id: model.text(),
  rate: model.hasOne(() => ComissionRate, {
    mappedBy: 'rule'
  })
})
