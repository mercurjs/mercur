import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"
import CommissionModule from "../modules/commission"

export default defineLink(
  {
    linkable: OrderModule.linkable.lineItem,
    field: "id",
  },
  {
    ...CommissionModule.linkable.commissionLine,
    alias: 'comission_lines',
    primaryKey: "item_id",
  },
  {
    readOnly: true,
  }
)
