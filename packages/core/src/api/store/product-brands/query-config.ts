export const storeProductBrandFields = [
  "id",
  "name",
  "handle",
  "metadata",
  "created_at",
  "updated_at",
]

export const storeProductBrandQueryConfig = {
  list: {
    defaults: storeProductBrandFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: storeProductBrandFields,
    isList: false,
  },
}
