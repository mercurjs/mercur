import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "../modules/product"
import SellerModule from "../modules/seller"

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  {
    linkable: SellerModule.linkable.seller,
    isList: true,
  },
  {
    database: {
      table: "product_seller",
    },
  }
)
