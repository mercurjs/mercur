export const vendorOrderFields = [
  'id',
  'display_id',
  'status',
  'email',
  'currency_code',
  'version',
  'summary',
  'metadata',
  'created_at',
  'updated_at',
  'region_id',
  'total',
  'subtotal',
  'tax_total',
  'order_change',
  'discount_total',
  'discount_tax_total',
  'original_total',
  'original_tax_total',
  'item_total',
  'item_subtotal',
  'item_tax_total',
  'original_item_total',
  'original_item_subtotal',
  'original_item_tax_total',
  'shipping_total',
  'shipping_subtotal',
  'shipping_tax_total',
  'original_shipping_tax_total',
  'original_shipping_subtotal',
  'original_shipping_total',
  '*items',
  '*items.tax_lines',
  '*items.adjustments',
  '*items.variant',
  '*items.variant.product',
  '*items.detail',
  '*shipping_address',
  '*billing_address',
  '*shipping_methods',
  '*shipping_methods.tax_lines',
  '*shipping_methods.adjustments',
  '*fulfillments',
  '*fulfillments.items',
  '*fulfillments.labels'
]

export const vendorOrderQueryConfig = {
  list: {
    defaults: vendorOrderFields,
    isList: true
  },
  retrieve: {
    defaults: vendorOrderFields,
    isList: false
  }
}
