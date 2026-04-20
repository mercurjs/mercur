export const storeProductAttributeFields = [
  "id",
  "name",
  "handle",
  "description",
  "type",
  "is_required",
  "is_filterable",
  "is_variant_axis",
  "rank",
  "metadata",
  "created_at",
  "updated_at",
  "*values",
]

export const storeProductAttributeQueryConfig = {
  list: {
    defaults: storeProductAttributeFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: storeProductAttributeFields,
    isList: false,
  },
}
