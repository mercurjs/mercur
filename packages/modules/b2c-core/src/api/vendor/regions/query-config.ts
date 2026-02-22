export const defaultVendorRegionFields = [
  'id',
  'name',
  'currency_code',
  'created_at',
  'updated_at',
  'deleted_at',
  'automatic_taxes',
  'metadata',
  '*countries'
]

export const vendorRegionsQueryConfig = {
  list: {
    defaults: defaultVendorRegionFields,
    isList: true
  },
  retrieve: {
    defaults: defaultVendorRegionFields,
    isList: false
  }
}
