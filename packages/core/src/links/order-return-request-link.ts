import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"

import ReturnRequestModule from "../modules/return-request"

export default defineLink(
  {
    linkable: OrderModule.linkable.order,
    field: "id",
    isList: true,
  },
  {
    ...ReturnRequestModule.linkable.returnRequest.id,
    alias: "return_requests",
    primaryKey: "order_id",
    isList: true,
  },
  {
    readOnly: true,
  }
)
