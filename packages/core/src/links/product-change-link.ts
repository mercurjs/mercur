import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import ProductChangeModule from "../modules/product-change"

export default defineLink(
  ProductModule.linkable.product,
  {
    linkable: ProductChangeModule.linkable.productChange,
    field: "change",
    isList: true,
  },
  {
    database: {
      table: "product_change_link",
    },
  },
)
