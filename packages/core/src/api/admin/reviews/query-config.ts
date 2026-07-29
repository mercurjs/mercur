export const adminReviewsFields = [
  "id",
  "display_id",
  "reference",
  "rating",
  "customer_note",
  "seller_note",
  "status",
  "created_at",
  "updated_at",
  "customer.id",
  "customer.first_name",
  "customer.last_name",
  "customer.email",
  "order.id",
  "order.display_id",
  "order.created_at",
  "seller.id",
  "seller.name",
  "seller.email",
]

export const adminReviewsConfig = {
  list: {
    defaults: adminReviewsFields,
    isList: true,
  },
  retrieve: {
    defaults: adminReviewsFields,
    isList: false,
  },
}
