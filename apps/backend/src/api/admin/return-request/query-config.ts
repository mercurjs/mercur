export const adminReturnOrderRequestFields = [
  'id',
  'customer_id',
  'line_item_ids',
  'customer_note',
  'vendor_reviewer_id',
  'vendor_reviewer_note',
  'vendor_reviewer_date',
  'admin_reviewer_id',
  'admin_reviewer_note',
  'admin_reviewer_date',
  'status',
  'order.*'
]

export const adminReturnOrderRequestQueryConfig = {
  list: {
    defaults: adminReturnOrderRequestFields,
    isList: true
  },
  retrieve: {
    defaults: adminReturnOrderRequestFields,
    isList: false
  }
}
