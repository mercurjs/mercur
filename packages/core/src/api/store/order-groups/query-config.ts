export const storeOrderGroupFields = [
  "id",
  "customer_id",
  "seller_count",
  "total",
  "created_at",
  "updated_at",
]

export const storeOrderGroupQueryConfig = {
  list: {
    defaults: storeOrderGroupFields,
    isList: true,
  },
  retrieve: {
    defaults: storeOrderGroupFields,
    isList: false,
  },
}
