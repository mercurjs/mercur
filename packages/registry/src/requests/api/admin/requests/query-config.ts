export const adminRequestFields = [
  "id",
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
