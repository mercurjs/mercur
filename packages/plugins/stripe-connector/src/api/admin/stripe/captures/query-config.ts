export const adminCaptureFields = [
  "id",
  "order_group_id",
  "payment_collection_id",
  "payment_id",
  "currency_code",
  "authorized_amount",
  "capturable_amount",
  "orders_total",
  "orders_decided",
  "status",
  "status_reason",
  "authorized_at",
  "expires_at",
  "created_at",
  "updated_at",
  "order_group.id",
  "order_group.display_id",
]

export const adminCaptureQueryConfig = {
  list: { defaults: adminCaptureFields, isList: true, defaultLimit: 20 },
  retrieve: { defaults: adminCaptureFields, isList: false },
}
