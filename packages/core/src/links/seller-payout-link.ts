import { defineLink } from "@medusajs/framework/utils"
import SellerModule from "../modules/seller"
import PayoutModule from "../modules/payout"

export default defineLink(
  {
    linkable: PayoutModule.linkable.payout,
    isList: true,
  },
  SellerModule.linkable.seller,
)
