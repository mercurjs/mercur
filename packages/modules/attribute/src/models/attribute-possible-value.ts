import { model } from '@medusajs/framework/utils'

import Attribute from './attribute'

const AttributePossibleValue = model
  .define('attribute_possible_value', {
    id: model.id({ prefix: 'attr_pos_val' }).primaryKey(),
    value: model.text(),
    rank: model.number(),
    metadata: model.json().nullable(),
    attribute: model.belongsTo(() => Attribute, {
      mappedBy: 'possible_values'
    })
  })
  .indexes([
    {
      on: ['attribute_id', 'value'],
      name: 'UQ_attribute_id_value',
      unique: true
    }
  ])

export default AttributePossibleValue
