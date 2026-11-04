import { defineLink } from "@medusajs/framework/utils"
import OfferModule from "../modules/offer"
import SellerModule from "../modules/seller"

export default defineLink(
  {
    linkable: OfferModule.linkable.offer,
    isList: true,
  },
  SellerModule.linkable.seller,
  {
    database: {
      table: "offer_seller",
    },
  }
)
