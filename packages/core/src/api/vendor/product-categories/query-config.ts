export const defaultVendorProductCategoryFields = [
  "id",
  "name",
  "description",
  "handle",
  "rank",
  "parent_category_id",
  "is_active",
  "is_internal",
  "created_at",
  "updated_at",
  "metadata",
  "*parent_category",
  "*category_children",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultVendorProductCategoryFields,
  isList: false,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  isList: true,
}

