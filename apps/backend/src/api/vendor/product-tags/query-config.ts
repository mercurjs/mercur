export const vendorProductTagFields = [
  'id',
  'value',
  'metadata',
  'created_at',
  'updated_at'
]

export const vendorProductTagsQueryConfig = {
  list: {
    defaults: vendorProductTagFields,
    isList: true
  },
  retrieve: {
    defaults: vendorProductTagFields,
    isList: false
  }
}
