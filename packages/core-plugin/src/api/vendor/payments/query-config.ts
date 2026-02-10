export const vendorPaymentFields = [
  "id",
  "currency_code",
  "amount",
  "captured_at",
  "payment_collection_id",
  "payment_session_id",
  "captures.id",
  "captures.amount",
  "refunds.id",
  "refunds.amount",
  "refunds.note",
  "refunds.payment_id",
  "refunds.refund_reason.label",
  "refunds.refund_reason.code",
]

export const vendorPaymentQueryConfig = {
  list: {
    defaults: vendorPaymentFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorPaymentFields,
    isList: false,
  },
}

export const vendorPaymentProviderFields = ["id", "is_enabled"]

export const vendorPaymentProviderQueryConfig = {
  list: {
    defaults: vendorPaymentProviderFields,
    isList: true,
  },
}
