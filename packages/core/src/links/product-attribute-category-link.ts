import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductAttributeModule from "../modules/product-attribute"


export default defineLink(
  {
    linkable: ProductAttributeModule.linkable.productAttribute.id,
    isList: true,
  },
  {
    linkable: {
      ...ProductModule.linkable.productCategory.id,
      alias: "categories",
    },
    isList: true,
  },
  {
    database: {
      table: "product_category_attribute",
    },
  }
)
