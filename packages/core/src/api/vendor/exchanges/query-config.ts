export const vendorExchangeFields = [
  "id",
  "order_id",
  "return_id",
  "display_id",
  "no_notification",
  "allow_backorder",
  "difference_due",
  "created_by",
  "created_at",
  "updated_at",
  "canceled_at",
]

export const vendorExchangeQueryConfig = {
  list: {
    defaults: vendorExchangeFields,
    isList: true,
  },
}
