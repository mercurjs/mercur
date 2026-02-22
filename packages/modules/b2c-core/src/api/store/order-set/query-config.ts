export const defaultStoreRetrieveOrderSetFields = [
  'id',
  'updated_at',
  'created_at',
  'display_id',
  'orders.id',
  'orders.display_id',
  'orders.currency_code',
  'orders.created_at',
  'orders.updated_at',
  'orders.completed_at',
  'orders.status',
  'orders.payment_status',
  'orders.fulfillment_status',
  'orders.total',
  'orders.subtotal',
  'orders.tax_total',
  'orders.discount_total',
  'orders.discount_tax_total',
  'orders.original_total',
  'orders.original_tax_total',
  'orders.item_total',
  'orders.item_subtotal',
  'orders.item_tax_total',
  'orders.sales_channel_id',
  'orders.original_item_total',
  'orders.original_item_subtotal',
  'orders.original_item_tax_total',
  'orders.shipping_total',
  'orders.shipping_subtotal',
  'orders.shipping_tax_total',
  'orders.shipping_address.*',
  'orders.items.*',
  'orders.seller.*',
  'orders.fulfillments.labels.*'
]

export const orderSetQueryConfig = {
  retrieve: {
    defaults: [],
    isList: false
  },
  list: {
    defaults: [],
    isList: true
  }
}
