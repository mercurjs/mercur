import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductAttributeModule from "../modules/product-attribute"

/**
 * Product ↔ ProductAttributeValue pivot link.
 */
export default defineLink(
  {
    linkable: ProductModule.linkable.product.id,
    isList: true,
  },
  {
    linkable: ProductAttributeModule.linkable.productAttributeValue.id,
    isList: true,
  },
  {
    database: {
      table: "product_attribute_value_link",
    },
  }
)
