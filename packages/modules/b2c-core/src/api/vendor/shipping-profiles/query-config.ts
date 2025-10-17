export const defaultVendorShippingProfileFields = [
  'id',
  'name',
  'type',
  'metadata',
  'created_at',
  'updated_at'
]

export const shippingProfilesQueryConfig = {
  list: {
    defaults: defaultVendorShippingProfileFields,
    isList: true
  },
  retrieve: {
    defaults: defaultVendorShippingProfileFields,
    isList: false
  }
}
