import { defineLink } from "@medusajs/framework/utils"
import CartModule from "@medusajs/medusa/cart"
import OfferModule from "../modules/offer"

// One offer can be referenced by many cart line items (across many carts).
// Without `isList: true` on the line-item side, Medusa enforces a 1:1
// cart_line_item ↔ offer relationship, which blocks any cart from re-using
// an offer that was ever added to another cart.
export default defineLink(
  {
    linkable: CartModule.linkable.lineItem,
    isList: true,
  },
  OfferModule.linkable.offer,
)
