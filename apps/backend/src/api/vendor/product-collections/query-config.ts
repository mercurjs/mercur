export const vendorProductCollectionFields = [
  'id',
  'title',
  'handle',
  'created_at',
  'updated_at',
  'metadata'
]

export const vendorProductCollectionQueryConfig = {
  list: {
    defaults: vendorProductCollectionFields,
    isList: true
  },
  retrieve: {
    defaults: vendorProductCollectionFields,
    isList: false
  }
}
