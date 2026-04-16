export const adminProductRejectionReasonFields = [
  "id",
  "code",
  "label",
  "type",
  "is_active",
  "metadata",
  "created_at",
  "updated_at",
]

export const adminProductRejectionReasonQueryConfig = {
  list: {
    defaults: adminProductRejectionReasonFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: adminProductRejectionReasonFields,
    isList: false,
  },
}
