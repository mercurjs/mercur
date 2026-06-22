import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductChangeModule from "../modules/product-edit"

/**
 * Read-only link Product → ProductChange.
 * `ProductChange.product_id` references `Product.id`. No pivot table —
 * the FK column lives directly on the change row. The `alias: "changes"`
 * exposes the list under `product.changes` for audit-history reads.
 */
export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    field: "id",
    isList: true,
  },
  {
    ...ProductChangeModule.linkable.productChange.id,
    alias: "changes",
    primaryKey: "product_id",
    isList: true,
  },
  {
    readOnly: true,
  }
)
