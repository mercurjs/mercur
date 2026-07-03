import { defineLink } from "@medusajs/framework/utils"
import PricingModule from "@medusajs/medusa/pricing"
import OfferModule from "../modules/offer"

export default defineLink(OfferModule.linkable.offer, {
  linkable: PricingModule.linkable.price,
  isList: true,
})
