import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductAttributeModule from "../modules/product-attribute"

/**
 * ProductCategory ↔ ProductAttribute pivot link.
 */
export default defineLink(
  {
    linkable: ProductModule.linkable.productCategory.id,
    isList: true,
  },
  {
    linkable: ProductAttributeModule.linkable.productAttribute.id,
    isList: true,
  },
  {
    database: {
      table: "product_category_attribute",
    },
  }
)
