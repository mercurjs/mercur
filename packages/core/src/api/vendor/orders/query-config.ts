// Medusa's query parser blows up with
//   `Entity 'Order' does not have property '*items'`
// whenever you combine a `*foo` field with a deeper `*foo.bar` field
// (e.g. `*items` together with `*items.variant`). Use the safe form —
// `foo.*` for scalars plus `foo.bar.*` for each nested branch — so the
// merged defaults stay parseable when callers add more `fields=` params.
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
  "items.*",
  "items.variant.*",
  "items.variant.product.*",
  "items.offer.*",
  "items.offer.prices.*",
  "items.offer.shipping_profile.*",
  "items.offer.inventory_item_link.*",
  "items.offer.inventory_item_link.inventory_item.*",
  "items.offer.inventory_item_link.inventory_item.location_levels.*",
  "shipping_address.*",
  "billing_address.*",
  "shipping_methods.*",
  // The payment collection is shared across all split orders of a cart and is
  // therefore not linked directly to an order; reach it through the cart. The
  // vendor order routes normalize this back onto `payment_collections`.
  "cart.payment_collection.*",
  "cart.payment_collection.payments.*",
  "cart.payment_collection.payments.refunds.*",
  "cart.payment_collection.payments.refunds.refund_reason.*",
  "cart.payment_collection.payment_sessions.*",
  "fulfillments.*",
  "returns.*",
  "returns.items.*",
  // `returns.items.reason.*` 500s on mikro-orm populate expansion (the
  // belongsTo relation doesn't accept a wildcard traversal here). Listing
  // the relation by name returns the populated ReturnReason object.
  "returns.items.reason",
  "returns.shipping_methods.*",
  "summary.*",
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
  "actions.*",
]

export const vendorOrderChangesQueryConfig = {
  list: {
    defaults: vendorOrderChangesFields,
    isList: true,
  },
}
