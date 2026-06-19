import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductAttributeModule from "../modules/product-attribute"

/**
 * Read-only link ProductAttributeValue → ProductOptionValue mirror (1:1).
 * `ProductAttributeValue.product_option_value_id` is the FK; no pivot table.
 */
export default defineLink(
  {
    ...ProductAttributeModule.linkable.productAttributeValue.id,
    primaryKey: "product_option_value_id",
    isList: false,
  },
  {
    linkable: ProductModule.linkable.productOptionValue.id,
    field: "id",
    isList: false,
  },
  {
    readOnly: true,
  },
)
