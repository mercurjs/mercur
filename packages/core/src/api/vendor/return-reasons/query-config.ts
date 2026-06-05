export const vendorReturnReasonFields = [
  "id",
  "value",
  "label",
  "parent_return_reason_id",
  "description",
  "created_at",
  "updated_at",
]

export const vendorReturnReasonRetrieveFields = [
  ...vendorReturnReasonFields,
  "parent_return_reason.*",
  "return_reason_children.*",
]

export const vendorReturnReasonQueryConfig = {
  list: {
    defaults: vendorReturnReasonFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorReturnReasonRetrieveFields,
    isList: false,
  },
}
