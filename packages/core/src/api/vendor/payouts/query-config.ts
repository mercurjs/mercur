export const vendorPayoutFields = [
  "id",
  "amount",
  "currency_code",
  "status",
  "data",
  "created_at",
  "updated_at",
  "display_id",
  "order_id",
  "status_reason",
  "reversals.id",
  "reversals.amount",
  "reversals.status",
  "reversals.refund_id",
  "reversals.created_at",
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
