import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"

import ReturnRequestModule from "../modules/return-request"

export default defineLink(
  {
    linkable: OrderModule.linkable.return,
    field: "id",
  },
  {
    ...ReturnRequestModule.linkable.returnRequest.id,
    alias: "return_request",
    primaryKey: "return_id",
  },
  {
    readOnly: true,
  }
)
