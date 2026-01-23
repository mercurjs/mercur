export const vendorRefundReasonFields = [
  "id",
  "label",
  "code",
  "description",
  "created_at",
  "updated_at",
]

export const vendorRefundReasonQueryConfig = {
  list: {
    defaults: vendorRefundReasonFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorRefundReasonFields,
    isList: false,
  },
}
