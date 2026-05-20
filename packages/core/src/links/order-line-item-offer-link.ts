import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"
import OfferModule from "../modules/offer"

export default defineLink(
  OrderModule.linkable.orderLineItem,
  OfferModule.linkable.offer,
)
