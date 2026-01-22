export const vendorOrderFields = [
  "id",
  "display_id",
  "status",
  "email",
  "currency_code",
  "region_id",
  "customer_id",
  "sales_channel_id",
  "created_at",
  "updated_at",
  "canceled_at",
  "metadata",
  "*items",
  "*items.variant",
  "*items.variant.product",
  "*shipping_address",
  "*billing_address",
  "*shipping_methods",
  "*payment_collections",
  "*summary",
]

export const vendorOrderQueryConfig = {
  list: {
    defaults: vendorOrderFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorOrderFields,
    isList: false,
  },
}
