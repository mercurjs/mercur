export const vendorPaymentCollectionFields = [
  "id",
  "status",
  "amount",
  "authorized_amount",
  "captured_amount",
  "refunded_amount",
  "currency_code",
  "completed_at",
  "created_at",
  "updated_at",
  "metadata",
  "*payments",
  "*payments.refunds",
  "*payment_sessions",
]

export const vendorPaymentCollectionQueryConfig = {
  retrieve: {
    defaults: vendorPaymentCollectionFields,
    isList: false,
  },
}
