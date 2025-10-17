export const vendorSalesChannelFields = [
  'id',
  'name',
  'description',
  'is_disabled',
  'created_at',
  'updated_at',
  'deleted_at',
  'metadata'
]

export const vendorSalesChannelQueryConfig = {
  list: {
    defaults: vendorSalesChannelFields,
    isList: true
  },
  retrieve: {
    defaults: vendorSalesChannelFields,
    isList: false
  }
}
