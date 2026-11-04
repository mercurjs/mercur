import {
  buildAllowedFields,
  prefixAllowedFields,
} from "@medusajs/medusa/api/store/utils/allowed-fields"
import { allowedStoreProductCategoryExtraFields } from "@medusajs/medusa/api/store/product-categories/query-config"

export const storeProductCategoryFields = [
  "id",
  "name",
  "description",
  "handle",
  "rank",
  "parent_category_id",
  "created_at",
  "updated_at",
  "metadata",
  "*parent_category",
  "*category_children",
]

const storeCategoryProductFields = [
  "id",
  "title",
  "subtitle",
  "handle",
  "thumbnail",
  "status",
  "created_at",
  "updated_at",
]

// Medusa's list covers the nested category tree and product expansions; the
// explicit product paths let a storefront pick product columns instead of
// pulling `*products` wholesale.
const allowed = buildAllowedFields(
  storeProductCategoryFields,
  allowedStoreProductCategoryExtraFields,
  prefixAllowedFields("products", storeCategoryProductFields),
  prefixAllowedFields("category_children.products", storeCategoryProductFields)
)

export const storeProductCategoryQueryConfig = {
  list: {
    defaults: storeProductCategoryFields,
    allowed,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: storeProductCategoryFields,
    allowed,
    isList: false,
  },
}
