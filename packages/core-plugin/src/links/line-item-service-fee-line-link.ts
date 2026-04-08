import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"
import ServiceFeeModule from "../modules/service-fee"

export default defineLink(
  {
    linkable: OrderModule.linkable.orderLineItem,
    field: "id",
    isList: true,
  },
  {
    ...ServiceFeeModule.linkable.serviceFeeLine.id,
    alias: "service_fee_lines",
    primaryKey: "item_id",
    isList: true,
  },
  {
    readOnly: true,
  }
)
