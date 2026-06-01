import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductAttributeModule from "../modules/product-attribute"

export default defineLink(
  {
    linkable: ProductModule.linkable.productVariant,
    isList: true,
  },
  {
    linkable: ProductAttributeModule.linkable.productAttributeValue,
    field: "attribute_value",
    isList: true,
  },
  {
    database: {
      table: "product_variant_attribute_value",
    },
  }
)
