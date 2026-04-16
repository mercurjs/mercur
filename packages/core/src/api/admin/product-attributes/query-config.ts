export const adminProductAttributeFields = [
  "id",
  "name",
  "handle",
  "description",
  "type",
  "is_required",
  "is_filterable",
  "is_variant_axis",
  "is_active",
  "is_global",
  "created_by",
  "rank",
  "metadata",
  "created_at",
  "updated_at",
  "*values",
  "*categories",
]

export const adminProductAttributeQueryConfig = {
  list: {
    defaults: adminProductAttributeFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: adminProductAttributeFields,
    isList: false,
  },
}
