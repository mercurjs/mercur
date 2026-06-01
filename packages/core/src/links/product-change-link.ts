import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductChangeModule from "../modules/product-change"

/**
 * Read-only link Product → ProductChange.
 * `ProductChange.product_id` references `Product.id`. No pivot table —
 * the FK column lives directly on the change row.
 */
export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    field: "id",
  },
  {
    ...ProductChangeModule.linkable.productChange.id,
    primaryKey: "product_id",
    isList: true
  },
  {
    readOnly: true,
  },
)
