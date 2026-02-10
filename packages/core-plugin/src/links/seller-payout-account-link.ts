import { defineLink } from "@medusajs/framework/utils"
import SellerModule from "../modules/seller"
import PayoutModule from "../modules/payout"

export default defineLink(
  SellerModule.linkable.seller,
  PayoutModule.linkable.payoutAccount,
)
