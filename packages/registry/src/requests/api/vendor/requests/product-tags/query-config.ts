export const defaultVendorProductTagRequestFields = [
  "id",
  "value",
  "custom_fields.*",
  "created_at",
  "updated_at",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultVendorProductTagRequestFields,
  isList: false,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  isList: true,
}
