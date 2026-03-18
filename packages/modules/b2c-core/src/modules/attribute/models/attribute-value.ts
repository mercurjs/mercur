import { model } from '@medusajs/framework/utils'

import Attribute from './attribute'

const AttributeValue = model
  .define('attribute_value', {
    id: model.id({ prefix: 'attr_val' }).primaryKey(),
    value: model.text(),
    rank: model.number(),
    metadata: model.json().nullable(),
    source: model.text().default('admin'),
    attribute: model.belongsTo(() => Attribute, {
      mappedBy: 'values'
    })
  })
  .indexes([
    {
      on: ['attribute_id', 'source'],
      name: 'IDX_attribute_value_attribute_source'
    }
  ])

export default AttributeValue
