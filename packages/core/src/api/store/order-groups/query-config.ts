export const storeOrderGroupFields = [
  "id",
  "customer_id",
  "seller_count",
  "total",
  "created_at",
  "updated_at",
  "orders",
  "orders.seller_id",
  "orders.items",
  "orders.items.variant",
  "orders.items.variant.product",
  "orders.items.variant.product.seller",
  "orders.items.variant.product.seller.id",
  "orders.items.variant.product.seller.name",
]

export const storeOrderGroupQueryConfig = {
  list: {
    defaults: storeOrderGroupFields,
    allowed: storeOrderGroupFields,
    isList: true,
  },
  retrieve: {
    defaults: storeOrderGroupFields,
    allowed: storeOrderGroupFields,
    isList: false,
  },
}
