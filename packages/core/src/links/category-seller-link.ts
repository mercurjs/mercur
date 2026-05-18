import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "../modules/product"
import SellerModule from "../modules/seller"

export default defineLink(
  {
    linkable: ProductModule.linkable.productCategory,
    isList: true,
  },
  {
    linkable: SellerModule.linkable.seller,
    isList: true,
  }
)
