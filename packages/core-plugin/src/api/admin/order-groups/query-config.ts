export const adminOrderGroupFields = [
  "id",
  "customer_id",
  "seller_count",
  "total",
  "created_at",
  "updated_at",
]

export const adminOrderGroupQueryConfig = {
  list: {
    defaults: adminOrderGroupFields,
    isList: true,
  },
  retrieve: {
    defaults: adminOrderGroupFields,
    isList: false,
  },
}
