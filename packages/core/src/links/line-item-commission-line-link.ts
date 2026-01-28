import { defineLink } from "@medusajs/framework/utils"
import CartModule from "@medusajs/medusa/cart"
import CommissionModule from "../modules/commission"

export default defineLink(
  {
    linkable: CartModule.linkable.lineItem,
    field: "id",
  },
  {
    ...CommissionModule.linkable.commissionLine,
    primaryKey: "item_id",
  },
  {
    readOnly: true,
  }
)
