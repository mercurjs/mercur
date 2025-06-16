import { model } from '@medusajs/framework/utils'

import AttributePossibleValue from './attribute-possible-value'
import AttributeValue from './attribute-value'

const Attribute = model
  .define('attribute', {
    id: model.id({ prefix: 'attr' }).primaryKey(),
    name: model.text().searchable(),
    description: model.text().nullable(),
    handle: model.text().unique(),
    metadata: model.json().nullable(),
    values: model.hasMany(() => AttributeValue),
    possible_values: model.hasMany(() => AttributePossibleValue)
  })
  .cascades({
    delete: ['values', 'possible_values']
  })

export default Attribute
