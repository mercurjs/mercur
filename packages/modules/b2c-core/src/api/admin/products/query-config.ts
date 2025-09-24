export const defaultAdminAttributeFields = [
  'id',
  'name',
  'description',
  'handle',
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
