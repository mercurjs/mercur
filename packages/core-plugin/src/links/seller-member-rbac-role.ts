import { defineLink } from "@medusajs/framework/utils"
import RbacModule from "@medusajs/medusa/rbac"
import SellerModule from "../modules/seller"

export default defineLink(
  {
    linkable: SellerModule.linkable.sellerMember,
    field: "role_id",
    alias: 'role'
  },
  RbacModule.linkable.rbacRole,
  { readOnly: true }
)
