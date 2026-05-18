export const vendorProductBrandFields = [
  "id",
  "name",
  "handle",
  "is_restricted",
  "metadata",
  "created_at",
  "updated_at",
]

export const vendorProductBrandQueryConfig = {
  list: {
    defaults: vendorProductBrandFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: vendorProductBrandFields,
    isList: false,
  },
}
