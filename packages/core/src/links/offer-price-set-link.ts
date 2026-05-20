import { defineLink } from "@medusajs/framework/utils"
import PricingModule from "@medusajs/medusa/pricing"
import OfferModule from "../modules/offer"

export default defineLink(
  {
    linkable: OfferModule.linkable.offer,
    field: "price_set_id",
  },
  PricingModule.linkable.priceSet,
  {
    readOnly: true,
  }
)
