export const defaultVendorProductTypeRequestFields = [
  "id",
  "value",
  "custom_fields.*",
  "created_at",
  "updated_at",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultVendorProductTypeRequestFields,
  isList: false,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  isList: true,
}
