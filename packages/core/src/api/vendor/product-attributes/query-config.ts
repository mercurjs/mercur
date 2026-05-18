export const vendorProductAttributeFields = [
  "id",
  "name",
  "handle",
  "description",
  "type",
  "is_required",
  "is_filterable",
  "is_variant_axis",
  "is_active",
  "created_by",
  "product_id",
  "rank",
  "metadata",
  "created_at",
  "updated_at",
  "*values",
  "*categories",
]

export const vendorProductAttributeQueryConfig = {
  list: {
    defaults: vendorProductAttributeFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: vendorProductAttributeFields,
    isList: false,
  },
}
