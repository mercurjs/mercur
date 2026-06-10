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
  "credit_line_total",
  "item_subtotal",
  "item_total",
  "item_tax_total",
  "original_item_tax_total",
  "item_discount_total",
  "shipping_subtotal",
  "original_total",
  "original_tax_total",
  "subtotal",
  "discount_total",
  "discount_subtotal",
  "shipping_total",
  "shipping_tax_total",
  "original_shipping_tax_total",
  "shipping_discount_total",
  "tax_total",
  "refundable_total",
  "order_change",
];

const DEFAULT_RELATIONS = [
  "*customer",
  "*items", // -> we get LineItem here with added `quantity` and `detail` which is actually an OrderItem (which is a parent object to LineItem in the DB)
  "*items.variant",
  "*items.variant.product",
  "*items.variant.options",
  "+items.variant.manage_inventory",
  "*items.variant.inventory_items.inventory",
  "+items.variant.inventory_items.required_quantity",
  // Mercur offer link — wired through the `order_line_item ↔ offer` module
  // link on order placement / order-edit / exchange / claim confirms. Drives
  // the offer-aware UI (Item caption SKU, Allocate Items predicate,
  // restock preview in return / exchange / claim create).
  "*items.offer",
  "*items.offer.prices",
  "*items.offer.shipping_profile",
  "*items.offer.inventory_item_link",
  "+items.offer.inventory_item_link.required_quantity",
  "*items.offer.inventory_item_link.inventory_item",
  "*items.offer.inventory_item_link.inventory_item.location_levels",
  "+summary",
  "*shipping_address",
  "*billing_address",
  "*sales_channel",
  // Mercur seller link — exposes `order.seller` so admin order-action
  // forms (fulfillment, allocate, return, exchange, claim) can scope
  // stock-location / shipping-option / shipping-profile lookups to the
  // vendor that owns the order via `?seller_id=…`.
  "*seller",
  // "*promotions",
  "*shipping_methods",
  "*credit_lines",
  "*fulfillments",
  "+fulfillments.shipping_option.service_zone.fulfillment_set.type",
  "*fulfillments.items",
  "*fulfillments.labels",
  "*fulfillments.labels",
  "*payment_collections",
  "*payment_collections.payments",
  "*payment_collections.payments.refunds",
  "*payment_collections.payments.refunds.refund_reason",
  "*payment_collections.payment_sessions",
  "region.automatic_taxes",
];

export const DEFAULT_FIELDS = `${DEFAULT_PROPERTIES.join(
  ","
)},${DEFAULT_RELATIONS.join(",")}`;
