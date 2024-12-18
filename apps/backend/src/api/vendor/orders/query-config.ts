export const vendorListOrderFields = [
  'id',
  'status',
  'summary',
  'display_id',
  'total',
  'currency_code',
  'metadata',
  'created_at',
  'updated_at',
  '*seller'
]

export const vendorRetrieveOrderFields = [
  'id',
  'status',
  'summary',
  'currency_code',
  'display_id',
  'region_id',
  'email',
  'total',
  'subtotal',
  'tax_total',
  'discount_total',
  'discount_subtotal',
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
  'created_at',
  'updated_at',
  '*items',
  '*items.detail',
  '*items.variant',
  '*items.variant.product',
  '*shipping_address',
  '*billing_address',
  '*shipping_methods',
  '*payment_collections',
  '*seller'
]

export const vendorOrderQueryConfig = {
  list: {
    defaults: vendorListOrderFields,
    isList: true
  },
  retrieve: {
    defaults: vendorRetrieveOrderFields,
    isList: false
  }
}
