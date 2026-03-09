export const defaultVendorProductCollectionRequestFields = [
  "id",
  "title",
  "handle",
  "custom_fields.*",
  "created_at",
  "updated_at",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultVendorProductCollectionRequestFields,
  isList: false,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  isList: true,
}
