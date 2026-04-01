// TEMP: Commented out - RBAC module not enabled in dev config
// import { defineLink } from "@medusajs/framework/utils"
// import RbacModule from "@medusajs/medusa/rbac"
// import SellerModule from "../modules/seller"
//
// export default defineLink(
//     {
//         linkable: SellerModule.linkable.sellerMember,
//         field: "role_id",
//     },
//     RbacModule.linkable.rbacRole,
//     { readOnly: true }
// )
