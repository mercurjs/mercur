export const vendorPayoutFields = [
  "id",
  "amount",
  "currency_code",
  "status",
  "data",
  "created_at",
  "updated_at",
]

export const vendorPayoutQueryConfig = {
  list: {
    defaults: vendorPayoutFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorPayoutFields,
    isList: false,
  },
}
