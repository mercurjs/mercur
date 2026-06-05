export const vendorShippingOptionTypeFields = [
  "id",
  "label",
  "code",
  "description",
  "created_at",
  "updated_at",
]

export const vendorShippingOptionTypeQueryConfig = {
  list: {
    defaults: vendorShippingOptionTypeFields,
    defaultLimit: 20,
    isList: true,
  },
  retrieve: {
    defaults: vendorShippingOptionTypeFields,
    isList: false,
  },
}
