export const vendorReturnFields = [
  'id',
  'order_id',
  'exchange_id',
  'claim_id',
  'display_id',
  'location_id',
  'order_version',
  'status',
  'metadata',
  'no_notification',
  'refund_amount',
  'items.*',
  'items.reason.*',
  'created_by',
  'created_at',
  'updated_at',
  'canceled_at',
  'requested_at',
  'received_at'
]

export const vendorReturnsQueryConfig = {
  list: {
    defaults: vendorReturnFields,
    isList: true
  },
  retrieve: {
    defaults: vendorReturnFields,
    isList: false
  }
}
