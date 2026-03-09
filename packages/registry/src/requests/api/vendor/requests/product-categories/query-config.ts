export const defaultVendorProductCategoryRequestFields = [
  "id",
  "name",
  "handle",
  "description",
  "is_active",
  "is_internal",
  "custom_fields.*",
  "created_at",
  "updated_at",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultVendorProductCategoryRequestFields,
  isList: false,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  isList: true,
}
