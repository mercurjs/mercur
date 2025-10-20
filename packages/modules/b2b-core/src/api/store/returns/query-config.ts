export const storeReturnFields = [
  'id',
  'display_id',
  'order_version',
  'order_id',
  'status',
  'location_id',
  'requested_at',
  'canceled_at',
  'items.*',
  'refund_amount',
  'created_at',
  'updated_at',
  'deleted_at'
]

export const storeReturnQueryConfig = {
  list: {
    defaults: [],
    isList: true
  },
  retrieve: {
    defaults: [],
    isList: false
  }
}
