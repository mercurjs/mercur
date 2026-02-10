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
  "*fulfillments",
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

export const vendorOrderChangesFields = [
  "id",
  "order_id",
  "version",
  "change_type",
  "status",
  "created_by",
  "confirmed_by",
  "canceled_by",
  "created_at",
  "updated_at",
  "confirmed_at",
  "canceled_at",
  "*actions",
]

export const vendorOrderChangesQueryConfig = {
  list: {
    defaults: vendorOrderChangesFields,
    isList: true,
  },
}
