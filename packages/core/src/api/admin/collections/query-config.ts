export const adminCollectionFields = [
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

export const adminCollectionQueryConfig = {
  list: {
    defaults: adminCollectionFields,
    defaultLimit: 20,
    isList: true,
  },
  retrieve: {
    defaults: adminCollectionFields,
    isList: false,
  },
}
