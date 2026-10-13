import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"

import ReturnRequestModule from "../modules/return-request"

export default defineLink(
  {
    linkable: ReturnRequestModule.linkable.returnRequest,
    field: "order_id",
  },
  OrderModule.linkable.order,
  {
    readOnly: true,
  }
)
