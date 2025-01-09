export const vendorReturnOrderRequestFields = [
  'id',
  'customer_id',
  'customer_note',
  'vendor_reviewer_id',
  'vendor_reviewer_note',
  'vendor_reviewer_date',
  'admin_reviewer_id',
  'admin_reviewer_note',
  'admin_reviewer_date',
  'status',
  'line_items.*',
  'order.*'
]

export const vendorReturnOrderRequestQueryConfig = {
  list: {
    defaults: vendorReturnOrderRequestFields,
    isList: true
  },
  retrieve: {
    defaults: vendorReturnOrderRequestFields,
    isList: false
  }
}
