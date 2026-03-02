export const DEFAULT_PROPERTIES = [
  "id",
  "customer_id",
  "seller_count",
  "total",
  "created_at",
]

export const DEFAULT_RELATIONS = [
  "*orders",
  "*orders.customer",
  "*orders.sales_channel",
  "*orders.seller",
]

export const DEFAULT_FIELDS = `${DEFAULT_PROPERTIES.join(
  ","
)},${DEFAULT_RELATIONS.join(",")}`
