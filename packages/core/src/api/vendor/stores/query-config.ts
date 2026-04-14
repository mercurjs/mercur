export const vendorStoreFields = [
  "id",
  "name",
  "*supported_currencies",
  "*supported_currencies.currency",
  "default_sales_channel_id",
  "default_region_id",
  "default_location_id",
  "metadata",
  "created_at",
  "updated_at",
]

export const vendorStoreQueryConfig = {
  list: {
    defaults: vendorStoreFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorStoreFields,
    isList: false,
  },
}
