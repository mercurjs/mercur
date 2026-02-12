export const defaultVendorCollectionFields = [
  "id",
  "title",
  "handle",
  "created_at",
  "updated_at",
  "metadata",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultVendorCollectionFields,
  isList: false,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  isList: true,
}
