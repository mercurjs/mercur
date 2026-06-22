import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"
import OfferModule from "../modules/offer"

// One offer can be referenced by many order line items (one per child
// order across many order groups). Without `isList: true` on the
// order-line-item side, Medusa enforces a 1:1 order_line_item ↔ offer
// relationship, which blocks any order from re-using an offer that was
// ever placed before.
export default defineLink(
  {
    linkable: OrderModule.linkable.orderLineItem,
    isList: true,
  },
  OfferModule.linkable.offer,
)
