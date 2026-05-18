export const storeProductCategoryFields = [
  "id",
  "name",
  "description",
  "handle",
  "rank",
  "parent_category_id",
  "created_at",
  "updated_at",
  "metadata",
  "*parent_category",
  "*category_children",
]

export const storeProductCategoryQueryConfig = {
  list: {
    defaults: storeProductCategoryFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: storeProductCategoryFields,
    isList: false,
  },
}
