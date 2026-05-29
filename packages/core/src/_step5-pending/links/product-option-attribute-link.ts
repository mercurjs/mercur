import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductAttributeModule from "../modules/product-attribute"

export default defineLink(
  {
    linkable: ProductModule.linkable.productOption,
  },
  {
    linkable: ProductAttributeModule.linkable.productAttribute,
    field: "source_attribute",
  },
  {
    database: {
      table: "product_option_attribute_link",
      extraColumns: {
        fingerprint: {
          type: "text",
          nullable: false,
        },
      },
    },
  }
)
