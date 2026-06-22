import { defineLink } from "@medusajs/framework/utils"
import OfferModule from "../modules/offer"
import SellerModule from "../modules/seller"

export default defineLink(
  {
    linkable: OfferModule.linkable.offer,
    field: "seller_id",
  },
  SellerModule.linkable.seller,
  {
    readOnly: true,
  }
)
