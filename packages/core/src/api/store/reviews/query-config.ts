import { buildAllowedFields } from "@medusajs/medusa/api/store/utils/allowed-fields"

export const storeReviewFields = [
  "id",
  "display_id",
  "reference",
  "rating",
  "customer_note",
  "seller_note",
  "status",
  "customer.first_name",
  "customer.last_name",
  "created_at",
  "updated_at",
]

export const allowedStoreReviewExtraFields = [
  "reference_id",
  "customer_id",
  "customer.id",
  "product.id",
  "product.title",
  "product.handle",
  "product.thumbnail",
  "seller.id",
  "seller.name",
  "seller.handle",
  "seller.logo",
]

const allowed = buildAllowedFields(storeReviewFields, allowedStoreReviewExtraFields)

export const storeReviewQueryConfig = {
  list: {
    defaults: storeReviewFields,
    allowed,
    isList: true,
  },
  retrieve: {
    defaults: storeReviewFields,
    allowed,
    isList: false,
  },
}
