import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductAttributeModule from "../modules/product-attribute"

export default defineLink(
  {
    linkable: ProductModule.linkable.productOptionValue,
  },
  {
    linkable: ProductAttributeModule.linkable.productAttributeValue,
    field: "source_attribute_value",
  },
  {
    database: {
      table: "product_option_value_attribute_value_link",
      extraColumns: {
        fingerprint: {
          type: "text",
          nullable: false,
        },
      },
    },
  }
)
