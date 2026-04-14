export const vendorShippingProfileFields = [
  "id",
  "name",
  "type",
  "metadata",
  "created_at",
  "updated_at",
]

export const vendorShippingProfileQueryConfig = {
  list: {
    defaults: vendorShippingProfileFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorShippingProfileFields,
    isList: false,
  },
}
