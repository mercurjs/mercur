export const adminProductBrandFields = [
  "id",
  "name",
  "handle",
  "is_restricted",
  "metadata",
  "created_at",
  "updated_at",
]

export const adminProductBrandQueryConfig = {
  list: {
    defaults: adminProductBrandFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: adminProductBrandFields,
    isList: false,
  },
}
