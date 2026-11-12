export const adminProductChangeRequestFields = [
  "id",
  "product_id",
  "status",
  "type",
  "action_count",
  "product_title",
  "product_thumbnail",
  "product_status",
  "seller_id",
  "seller_name",
  "seller_handle",
  "created_by",
  "external_note",
  "internal_note",
  "created_at",
  "updated_at",
]

export const adminProductChangeQueryConfig = {
  list: {
    defaults: adminProductChangeRequestFields,
    isList: true,
  },
}
