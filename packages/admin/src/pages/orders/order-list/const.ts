export const DEFAULT_PROPERTIES = [
  "id",
  'display_id',
  "customer_id",
  "seller_count",
  "total",
  "created_at",
  "orders.id",
  "orders.status",
  "orders.created_at",
  "orders.email",
  "orders.display_id",
  "orders.custom_display_id",
  "orders.payment_status",
  "orders.fulfillment_status",
  "orders.total",
  "orders.currency_code",
]

export const DEFAULT_RELATIONS = [
  "*orders.payment_collections",
  "*orders.customer",
  "*orders.sales_channel",
  "*orders.seller",
]

export const DEFAULT_FIELDS = `${DEFAULT_PROPERTIES.join(
  ","
)},${DEFAULT_RELATIONS.join(",")}`
