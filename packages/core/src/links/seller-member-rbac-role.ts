import {
  defineFileConfig,
  defineLink,
  FeatureFlag,
  Modules,
} from "@medusajs/framework/utils"
import { configManager } from "@medusajs/framework/config"
import SellerModule from "../modules/seller"

// `medusaIntegrationTestRunner` registers feature flags without the project
// config and loads link files before Medusa's own flag loader runs, so the
// global router still reports rbac as off at that point. The loaded config is
// the reliable source.
const isRbacEnabled = () => {
  if (FeatureFlag.isFeatureEnabled("rbac")) {
    return true
  }

  try {
    return !!configManager.config.featureFlags?.rbac
  } catch {
    return false
  }
}

// Must run before defineLink, which checks whether the file is disabled.
defineFileConfig({
  isDisabled: () => !isRbacEnabled(),
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
