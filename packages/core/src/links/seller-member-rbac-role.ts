import {
  defineFileConfig,
  defineLink,
  FeatureFlag,
  Modules,
} from "@medusajs/framework/utils"
import SellerModule from "../modules/seller"

// Must run before defineLink, which checks whether the file is disabled.
defineFileConfig({
  isDisabled: () => !FeatureFlag.isFeatureEnabled("rbac"),
})

// Described inline instead of importing `@medusajs/medusa/rbac`: link files are
// evaluated at boot, and that import would load the RBAC module even with the
// flag off.
export default defineLink(
  {
    linkable: SellerModule.linkable.sellerMember,
    field: "role_id",
  },
  {
    linkable: "rbac_role_id",
    primaryKey: "id",
    serviceName: Modules.RBAC,
    field: "rbacRole",
    entity: "RbacRole",
  },
  { readOnly: true }
)
