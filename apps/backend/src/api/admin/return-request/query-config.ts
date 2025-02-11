export const adminReturnOrderRequestFields = [
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
  'order.*',
  'order.customer.first_name',
  'order.customer.last_name',
  'seller.*',
  'created_at'
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
