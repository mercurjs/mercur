import { defineLink } from "@medusajs/framework/utils"

import ReturnRequestModule from "../modules/return-request"
import SellerModule from "../modules/seller"

export default defineLink(
  {
    linkable: ReturnRequestModule.linkable.returnRequest,
    field: "seller_id",
  },
  SellerModule.linkable.seller,
  {
    readOnly: true,
  }
)
