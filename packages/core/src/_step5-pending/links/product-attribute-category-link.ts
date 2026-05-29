import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductAttributeModule from "../modules/product-attribute"

export default defineLink(
  {
    linkable: ProductModule.linkable.productCategory,
    isList: true,
  },
  {
    linkable: ProductAttributeModule.linkable.productAttribute,
    field: "attribute",
    isList: true,
  },
  {
    database: {
      table: "product_category_attribute",
    },
  }
)
