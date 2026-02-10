const DEFAULT_PROPERTIES = [
  "id",
  "status",
  "created_at",
  "canceled_at",
  "email",
  "display_id",
  "currency_code",
  "metadata",
  // --- TOTALS ---
  "total",
  "item_total",
  "shipping_subtotal",
  "subtotal",
  "discount_total",
  "discount_subtotal",
  "shipping_total",
  "shipping_tax_total",
  "tax_total",
  "refundable_total",
  "order_change",
  "commission_value",
]

const DEFAULT_RELATIONS = [
  "*customer",
  "*items", // -> we get LineItem here with added `quantity` and `detail` which is actually an OrderItem (which is a parent object to LineItem in the DB)
  "*items.variant",
  "*items.variant.product",
  "*items.variant.options",
  "+items.variant.manage_inventory",
  "*items.variant.inventory_items.inventory",
  "+items.variant.inventory_items.required_quantity",
  "*items.variant.prices",
  "+summary",
  "*shipping_address",
  "*billing_address",
  "*sales_channel",
  "*promotion",
  "*shipping_methods",
  "*fulfillments",
  "+fulfillments.shipping_option.service_zone.fulfillment_set.type",
  "*fulfillments.items",
  "*fulfillments.labels",
  "*fulfillments.labels",
  "region.automatic_taxes",
  "*split_order_payment",
  "payment_status",
  "*returns",
]

export const DEFAULT_FIELDS = `${DEFAULT_PROPERTIES.join(
  ","
)},${DEFAULT_RELATIONS.join(",")}`
