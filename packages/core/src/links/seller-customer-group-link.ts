import { defineLink } from "@medusajs/framework/utils"
import CustomerModule from "@medusajs/medusa/customer"
import SellerModule from "../modules/seller"

// A customer group is owned by exactly one seller, while a seller can own many
// customer groups. `isList` on the customer group side makes the seller side a
// list (seller.customer_groups), and the seller side without `isList` resolves
// to a single owner on the group (customer_group.seller). The generated link
// entity/table is `customer_group_seller`.
export default defineLink(
  { linkable: CustomerModule.linkable.customerGroup, isList: true },
  { linkable: SellerModule.linkable.seller }
)
