export const defaultVendorCollectionFields = [
  "id",
  "title",
  "handle",
  "created_at",
  "updated_at",
  "metadata",
  "images.id",
  "images.url",
  "images.type",
  "images.is_thumbnail",
  "images.is_banner",
  "images.rank",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultVendorCollectionFields,
  isList: false,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  isList: true,
}
