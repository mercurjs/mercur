import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductChangeModule from "../modules/product-change"

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  {
    linkable: ProductChangeModule.linkable.productChange,
    field: "change",
    isList: true,
  },
  {
    database: {
      table: "product_change_link",
    },
  }
)
