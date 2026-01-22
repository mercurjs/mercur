export const vendorRegionFields = [
  "id",
  "name",
  "currency_code",
  "automatic_taxes",
  "metadata",
  "created_at",
  "updated_at",
  "*countries",
]

export const vendorRegionQueryConfig = {
  list: {
    defaults: vendorRegionFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorRegionFields,
    isList: false,
  },
}
