import { defineLink } from "@medusajs/framework/utils"
import CartModule from "@medusajs/medusa/cart"
import OfferModule from "../modules/offer"

export default defineLink(
  CartModule.linkable.lineItem,
  OfferModule.linkable.offer,
)
