import { model } from '@medusajs/framework/utils'

import Attribute from './attribute'

const AttributeValue = model.define('attribute_value', {
  id: model.id({ prefix: 'attr_val' }).primaryKey(),
  value: model.text(),
  rank: model.number(),
  metadata: model.json().nullable(),
  attribute: model.belongsTo(() => Attribute, {
    mappedBy: 'values'
  })
})

export default AttributeValue
