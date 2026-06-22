import { defineLink } from "@medusajs/framework/utils"
import FulfillmentModule from "@medusajs/medusa/fulfillment"
import OfferModule from "../modules/offer"

export default defineLink(
  {
    linkable: OfferModule.linkable.offer,
    field: "shipping_profile_id",
  },
  FulfillmentModule.linkable.shippingProfile,
  {
    readOnly: true,
  }
)
