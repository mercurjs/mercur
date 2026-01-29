import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"
import CommissionModule from "../modules/commission"

export default defineLink(
  {
    linkable: OrderModule.linkable.orderLineItem,
    field: "id",
    isList: true,
  },
  {
    ...CommissionModule.linkable.commissionLine.id,
    alias: "commission_lines",
    primaryKey: "item_id",
    isList: true,
  },
  {
    readOnly: true,
  }
)
