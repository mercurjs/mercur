export const vendorStoreFields = [
  'id',
  'name',
  'supported_currencies.id',
  'supported_currencies.is_default',
  'supported_currencies.currency_code',
  'default_sales_channel_id',
  'default_region_id',
  'default_location_id',
  'metadata',
  'created_at',
  'updated_at'
]
export const vendorStoresQueryConfig = {
  list: {
    defaults: vendorStoreFields,
    isList: true
  },
  retrieve: {
    defaults: vendorStoreFields,
    isList: false
  }
}
