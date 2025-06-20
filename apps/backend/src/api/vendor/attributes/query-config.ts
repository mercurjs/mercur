export const defaultVendorAttributeFields = [
  'id',
  'name',
  'description',
  'handle',
  'is_filterable',
  'ui_component',
  'metadata',
  '*possible_values',
  'product_categories.id',
  'product_categories.name'
]

export const retrieveAttributeQueryConfig = {
  defaults: defaultVendorAttributeFields,
  isList: false
}

export const listAttributeQueryConfig = {
  ...retrieveAttributeQueryConfig,
  defaultLimit: 50,
  isList: true
}

export const defaultVendorAttributeValueFields = [
  'id',
  'value',
  'rank',
  'metadata'
]

export const retrieveAttributeValueQueryConfig = {
  defaults: defaultVendorAttributeValueFields,
  isList: false
}

export const listAttributeValueQueryConfig = {
  ...retrieveAttributeValueQueryConfig,
  isList: true,
  defaultLimit: 50
}
