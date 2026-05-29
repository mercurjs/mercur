import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductAttributeModule from "../modules/product-attribute"

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  {
    linkable: ProductAttributeModule.linkable.productAttribute,
    field: "variant_attribute",
    isList: true,
  },
  {
    database: {
      table: "product_variant_attribute",
    },
  }
)
