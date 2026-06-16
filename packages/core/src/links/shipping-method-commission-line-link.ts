import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"
import CommissionModule from "../modules/commission"

export default defineLink(
  {
    linkable: OrderModule.linkable.orderShippingMethod,
    field: "id",
    isList: true,
  },
  {
    ...CommissionModule.linkable.commissionLine.id,
    alias: "shipping_commission_lines",
    primaryKey: "shipping_method_id",
    isList: true,
  },
  {
    readOnly: true,
  }
)
