export const vendorProductTypeFields = [
  'id',
  'value',
  'metadata',
  'created_at',
  'updated_at'
]

export const vendorProductTypeQueryConfig = {
  list: {
    defaults: vendorProductTypeFields,
    isList: true
  },
  retrieve: {
    defaults: vendorProductTypeFields,
    isList: false
  }
}
