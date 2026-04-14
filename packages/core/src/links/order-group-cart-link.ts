import { defineLink } from "@medusajs/framework/utils"
import CartModule from "@medusajs/medusa/cart"
import SellerModule from "../modules/seller"

export default defineLink(
  {
    linkable: SellerModule.linkable.orderGroup,
    field: "cart_id",
  },
  CartModule.linkable.cart,
  {
    readOnly: true,
  }
)
