export const vendorProductCategoryFields = [
  "id",
  "name",
  "description",
  "handle",
  "is_active",
  "is_internal",
  "is_restricted",
  "rank",
  "parent_category_id",
  "created_at",
  "updated_at",
  "metadata",
  "*parent_category",
  "*category_children",
  "media_images.id",
  "media_images.url",
  "media_images.type",
  "media_images.is_thumbnail",
  "media_images.is_banner",
  "media_images.rank",
]

export const vendorProductCategoryQueryConfig = {
  list: {
    defaults: vendorProductCategoryFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: vendorProductCategoryFields,
    isList: false,
  },
}
