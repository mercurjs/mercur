export const defaultAdminAttributeFields = [
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
  defaults: defaultAdminAttributeFields,
  isList: false
}

export const listAttributeQueryConfig = {
  ...retrieveAttributeQueryConfig,
  defaultLimit: 50,
  isList: true
}

export const defaultAdminAttributeValueFields = [
  'id',
  'value',
  'rank',
  'metadata'
]

export const retrieveAttributeValueQueryConfig = {
  defaults: defaultAdminAttributeValueFields,
  isList: false
}

export const listAttributeValueQueryConfig = {
  ...retrieveAttributeValueQueryConfig,
  isList: true,
  defaultLimit: 50
}
