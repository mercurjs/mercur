export const defaultVendorCollectionFields = [
  "id",
  "title",
  "handle",
  "created_at",
  "updated_at",
  "metadata",
  "media_images.id",
  "media_images.url",
  "media_images.type",
  "media_images.is_thumbnail",
  "media_images.is_banner",
  "media_images.rank",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultVendorCollectionFields,
  isList: false,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  isList: true,
}
