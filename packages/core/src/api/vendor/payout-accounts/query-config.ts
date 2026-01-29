export const vendorPayoutAccountFields = [
  "id",
  "status",
  "data",
  "context",
  "created_at",
  "updated_at",
]

export const vendorPayoutAccountQueryConfig = {
  list: {
    defaults: vendorPayoutAccountFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorPayoutAccountFields,
    isList: false,
  },
}
