export const defaultAdminShippingMethodFields = [
  "id",
  "name",
  "code",
  "description",
  "provider_id",
  "shipping_option_type_id",
  "is_active",
  "metadata",
  "created_at",
  "updated_at",
]

export const adminShippingMethodQueryConfig = {
  list: {
    defaults: defaultAdminShippingMethodFields,
    isList: true,
  },
  retrieve: {
    defaults: defaultAdminShippingMethodFields,
    isList: false,
  },
}
