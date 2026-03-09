export const adminRequestFields = [
  "id",
  "name",
  "title",
  "handle",
  "value",
  "description",
  "is_active",
  "is_internal",
  "custom_fields.*",
  "created_at",
  "updated_at",
]

export const adminRequestQueryConfig = {
  list: {
    defaults: adminRequestFields,
    isList: true,
  },
  retrieve: {
    defaults: adminRequestFields,
    isList: false,
  },
}
